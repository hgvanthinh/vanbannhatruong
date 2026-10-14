import { classKey, compareClassNames, MAX_STUDENTS_PER_CLASS } from '../services/classService';
import type { Student } from '../types';
import { normalizeVi } from './text';

/**
 * Đọc danh sách học sinh từ file Excel xuất từ phần mềm quản lý (VEMIS, CSDL
 * ngành...) hoặc tự lập: tìm dòng tiêu đề có cột "Họ và tên" rồi lấy Lớp, Ngày
 * sinh, Địa chỉ. Chỉ giữ 4 thông tin này — mọi cột khác (CCCD, cha mẹ, điện
 * thoại...) bị bỏ, không gửi lên máy chủ.
 *
 * Phần dò cột làm trên mảng 2 chiều thuần (`parseStudentRows`) để không phụ
 * thuộc thư viện; `parseStudentFile` chỉ là lớp đọc file bằng SheetJS (nạp động).
 */

export type SheetCell = string | number | boolean | Date | null | undefined;

export interface ImportedClass {
  name: string;
  students: Student[];
}

export interface StudentImportResult {
  classes: ImportedClass[];
  /** Tiêu đề cột đã dùng — hiện cho người nhập kiểm tra đã lấy đúng cột chưa. */
  columns: { name: string; className?: string; dob?: string; address?: string };
  /** Không có cột Lớp → cả file là 1 lớp, người nhập tự gõ tên lớp. */
  missingClassColumn: boolean;
  warnings: string[];
}

export class StudentImportError extends Error {}

/** Chuẩn hoá tiêu đề cột: bỏ dấu, bỏ dấu câu ("Ngày, tháng, năm sinh" → "ngay thang nam sinh"). */
function headerKey(cell: SheetCell): string {
  return normalizeVi(String(cell ?? ''))
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const NAME_HEADERS = ['ho va ten', 'ho ten', 'ho va ten hoc sinh', 'ho ten hoc sinh', 'ten hoc sinh'];
const CLASS_HEADERS = ['lop', 'lop hoc', 'ten lop'];
const DOB_HEADERS = ['ngay sinh', 'ngay thang nam sinh', 'ngay sinh dd mm yyyy'];
// Ưu tiên theo thứ tự: chỗ ở hiện nay trước, hộ khẩu sau.
const ADDRESS_HEADERS = ['cho o hien nay', 'dia chi', 'noi o hien nay', 'noi o', 'dia chi thuong tru', 'ho khau thuong tru', 'thuong tru'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Số ngày kiểu Excel (1 = 01/01/1900) → "dd/mm/yyyy". Tính theo UTC để không lệch múi giờ. */
function excelSerialToDate(serial: number): string {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000);
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/** Ngày sinh về dạng "dd/mm/yyyy"; dạng lạ thì giữ nguyên chữ. */
export function normalizeDob(cell: SheetCell): string {
  if (cell instanceof Date) return `${pad2(cell.getDate())}/${pad2(cell.getMonth() + 1)}/${cell.getFullYear()}`;
  if (typeof cell === 'number') return cell > 0 && cell < 80000 ? excelSerialToDate(cell) : String(cell);
  const text = String(cell ?? '').trim();
  let m = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${pad2(Number(m[1]))}/${pad2(Number(m[2]))}/${m[3]}`;
  m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${pad2(Number(m[3]))}/${pad2(Number(m[2]))}/${m[1]}`;
  return text;
}

function cellText(cell: SheetCell): string {
  return String(cell ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "MA THANH HÀ" → "Ma Thanh Hà" (phần mềm hay xuất tên viết hoa toàn bộ); tên đã viết thường thì giữ nguyên. */
function fixAllCapsName(name: string): string {
  if (name !== name.toLocaleUpperCase('vi') || name === name.toLocaleLowerCase('vi')) return name;
  return name
    .toLocaleLowerCase('vi')
    .split(' ')
    .map((w) => w.charAt(0).toLocaleUpperCase('vi') + w.slice(1))
    .join(' ');
}

interface HeaderInfo {
  row: number;
  name: number;
  className: number;
  dob: number;
  /** Cột địa chỉ có thể là ô gộp nhiều cột (Thôn / Khu dân cư / Xã / Tỉnh) → [từ, tới) */
  address: [number, number] | null;
}

function findColumn(keys: string[], candidates: string[]): number {
  for (const c of candidates) {
    const i = keys.indexOf(c);
    if (i >= 0) return i;
  }
  return -1;
}

function findHeader(rows: SheetCell[][]): HeaderInfo | null {
  for (let r = 0; r < Math.min(rows.length, 40); r++) {
    const keys = (rows[r] ?? []).map(headerKey);
    const name = findColumn(keys, NAME_HEADERS);
    if (name < 0) continue;
    const addressCol = findColumn(keys, ADDRESS_HEADERS);
    let address: [number, number] | null = null;
    if (addressCol >= 0) {
      // Ô tiêu đề gộp ngang: các cột sau nó có tiêu đề rỗng (tiêu đề con nằm ở dòng dưới).
      let end = addressCol + 1;
      while (end < keys.length && !keys[end] && end - addressCol < 6) end++;
      address = [addressCol, end];
    }
    return {
      row: r,
      name,
      className: findColumn(keys, CLASS_HEADERS),
      dob: findColumn(keys, DOB_HEADERS),
      address,
    };
  }
  return null;
}

/** Ghép "Thôn Bơi" + "" + "Xã Bạch Xa" + "Tuyên Quang" → "Thôn Bơi, Xã Bạch Xa, Tuyên Quang". */
function joinAddress(parts: string[]): string {
  const out: string[] = [];
  for (const p of parts) {
    if (p && !out.some((o) => normalizeVi(o) === normalizeVi(p))) out.push(p);
  }
  return out.join(', ');
}

export function parseStudentRows(rows: SheetCell[][]): StudentImportResult {
  const header = findHeader(rows);
  if (!header) {
    throw new StudentImportError('Không thấy cột "Họ và tên" trong file. Dòng tiêu đề cần có cột Họ và tên (và nên có Lớp, Ngày sinh, Địa chỉ).');
  }
  const headerRow = rows[header.row];
  const label = (i: number) => (i >= 0 ? cellText(headerRow[i]) : undefined);

  const groups = new Map<string, ImportedClass>();
  for (const row of rows.slice(header.row + 1)) {
    if (!row) continue;
    const name = fixAllCapsName(cellText(row[header.name]));
    const className = header.className >= 0 ? cellText(row[header.className]).replace(/^lớp\s+/i, '') : '';
    // Dòng tiêu đề con (SN/Xóm, Xã/Phường...), dòng trống, chữ ký cuối bảng: không có tên hoặc không có lớp.
    if (!name || (header.className >= 0 && !className)) continue;
    const student: Student = {
      name,
      dob: header.dob >= 0 ? normalizeDob(row[header.dob]) : '',
      address: header.address ? joinAddress(row.slice(header.address[0], header.address[1]).map(cellText)) : '',
    };
    const key = classKey(className);
    const group = groups.get(key) ?? { name: className, students: [] };
    group.students.push(student);
    groups.set(key, group);
  }

  const classes = [...groups.values()].sort((a, b) => compareClassNames(a.name, b.name));
  if (classes.length === 0) throw new StudentImportError('File không có dòng học sinh nào bên dưới dòng tiêu đề.');

  const warnings: string[] = [];
  if (header.dob < 0) warnings.push('Không thấy cột Ngày sinh — ngày sinh để trống.');
  if (!header.address) warnings.push('Không thấy cột Địa chỉ / Chỗ ở hiện nay — địa chỉ để trống.');
  for (const c of classes) {
    if (c.students.length > MAX_STUDENTS_PER_CLASS) {
      warnings.push(`Lớp ${c.name || '(chưa đặt tên)'} có ${c.students.length} học sinh, chỉ lưu ${MAX_STUDENTS_PER_CLASS} em đầu.`);
    }
  }

  return {
    classes,
    columns: {
      name: label(header.name) ?? '',
      className: label(header.className),
      dob: label(header.dob),
      address: header.address ? label(header.address[0]) : undefined,
    },
    missingClassColumn: header.className < 0,
    warnings,
  };
}

/** Đọc .xls / .xlsx / .csv. Thử từng sheet, lấy sheet đầu tiên có cột "Họ và tên". */
export async function parseStudentFile(file: File): Promise<StudentImportResult> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
  let firstError: unknown = null;
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<SheetCell[]>(workbook.Sheets[sheetName], { header: 1, raw: true, defval: '', blankrows: false });
    try {
      return parseStudentRows(rows);
    } catch (err) {
      firstError ??= err;
    }
  }
  throw firstError ?? new StudentImportError('File không có dữ liệu.');
}
