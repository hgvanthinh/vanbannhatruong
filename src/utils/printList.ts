import { DOC_CATEGORIES, type DocCategory } from '../constants/docCategories';
import { DOC_FORMS, getDocFormMeta, type DocForm } from '../constants/docForms';
import type { DocSort, LibraryDoc, LibraryFilter } from '../types';
import { DOC_SORTS, EMPTY_FILTER, filterDocs, sortDocs } from './libraryFilter';
import { normalizeVi } from './text';

/**
 * Trang in danh sách văn bản (/truong/:slug/in) — kiểu "Hồ sơ kiểm tra nội bộ":
 * chọn nhiều Loại/Hình thức + khoảng ngày đăng + từ khoá rồi in/lưu PDF.
 * Mọi lựa chọn nằm trên URL (?loai=a,b&hinhthuc=&q=&tu=YYYY-MM-DD&den=&sapxep=&tieude=&qr=0&so=1)
 * để tải lại trang hay gửi link vẫn giữ nguyên.
 */
export interface PrintOptions {
  categories: DocCategory[];
  docForms: DocForm[];
  keyword: string;
  /** YYYY-MM-DD theo ngày ĐĂNG (createdAt) — web không có ngày ban hành. */
  from: string | null;
  to: string | null;
  sort: DocSort;
  title: string;
  showQr: boolean;
  /** Cột "Số, ký hiệu" để trống cho ghi tay — web không lưu số văn bản. */
  showNumber: boolean;
}

export const DEFAULT_PRINT_TITLE = 'DANH SÁCH VĂN BẢN';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pickList<V extends string>(raw: string | null, values: ReadonlyArray<{ value: V }>): V[] {
  const wanted = new Set((raw ?? '').split(','));
  return values.filter((v) => wanted.has(v.value)).map((v) => v.value);
}

export function printOptionsFromParams(params: URLSearchParams): PrintOptions {
  const date = (key: string) => {
    const v = params.get(key);
    return v && DATE_PATTERN.test(v) ? v : null;
  };
  return {
    categories: pickList(params.get('loai'), DOC_CATEGORIES),
    docForms: pickList(params.get('hinhthuc'), DOC_FORMS),
    keyword: params.get('q') ?? '',
    from: date('tu'),
    to: date('den'),
    // Hồ sơ lưu theo thứ tự thời gian nên mặc định cũ trước.
    sort: DOC_SORTS.find((s) => s.value === params.get('sapxep'))?.value ?? 'oldest',
    title: params.get('tieude') ?? DEFAULT_PRINT_TITLE,
    showQr: params.get('qr') !== '0',
    showNumber: params.get('so') === '1',
  };
}

export function printOptionsToParams(o: PrintOptions): URLSearchParams {
  const params = new URLSearchParams();
  if (o.categories.length) params.set('loai', o.categories.join(','));
  if (o.docForms.length) params.set('hinhthuc', o.docForms.join(','));
  if (o.keyword) params.set('q', o.keyword);
  if (o.from) params.set('tu', o.from);
  if (o.to) params.set('den', o.to);
  if (o.sort !== 'oldest') params.set('sapxep', o.sort);
  if (o.title !== DEFAULT_PRINT_TITLE) params.set('tieude', o.title);
  if (!o.showQr) params.set('qr', '0');
  if (o.showNumber) params.set('so', '1');
  return params;
}

/** Link sang trang in, mang theo bộ lọc đang xem (năm học → khoảng ngày 01/08 – 31/07). */
export function buildPrintListPath(slug: string, filter: LibraryFilter): string {
  const params = new URLSearchParams();
  if (filter.category !== 'all') params.set('loai', filter.category);
  if (filter.docForm !== 'all') params.set('hinhthuc', filter.docForm);
  if (filter.keyword.trim()) params.set('q', filter.keyword.trim());
  const year = /^(\d{4})-(\d{4})$/.exec(filter.schoolYear);
  if (year) {
    params.set('tu', `${year[1]}-08-01`);
    params.set('den', `${year[2]}-07-31`);
  }
  const search = params.toString();
  return `/truong/${slug}/in${search ? `?${search}` : ''}`;
}

/** So khoảng ngày bằng chuỗi YYYY-MM-DD theo giờ máy — tránh lệch múi giờ. */
function localDateKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function filterForPrint(docs: LibraryDoc[], o: PrintOptions): LibraryDoc[] {
  // Từ khoá dùng lại bộ tìm không dấu của kho văn bản.
  const matched = filterDocs(docs, { ...EMPTY_FILTER, keyword: o.keyword }).filter((d) => {
    const day = localDateKey(d.createdAt);
    return (
      (o.categories.length === 0 || o.categories.includes(d.category)) &&
      (o.docForms.length === 0 || o.docForms.includes(d.docForm)) &&
      (!o.from || day >= o.from) &&
      (!o.to || day <= o.to)
    );
  });
  return sortDocs(matched, o.sort);
}

/**
 * "Kế hoạch kiểm tra nội bộ năm học…" → { form: "KẾ HOẠCH", summary: "Kiểm tra nội bộ năm học…" }
 * như cột "Tên loại và trích yếu nội dung". Tên không bắt đầu bằng hình thức thì giữ nguyên.
 */
export function splitFormAndSummary(doc: LibraryDoc): { form: string | null; summary: string } {
  const label = getDocFormMeta(doc.docForm).label;
  const labelWords = label.split(' ').length;
  const words = doc.title.trim().split(/\s+/);
  // Phần còn lại dưới 3 chữ ("Nội quy nhà trường") thì tách ra đọc cụt — giữ nguyên tên.
  if (doc.docForm === 'khac' || words.length < labelWords + 3) return { form: null, summary: doc.title };
  if (normalizeVi(words.slice(0, labelWords).join(' ')) !== normalizeVi(label)) return { form: null, summary: doc.title };
  const rest = words.slice(labelWords).join(' ');
  return { form: label.toUpperCase(), summary: rest.charAt(0).toUpperCase() + rest.slice(1) };
}
