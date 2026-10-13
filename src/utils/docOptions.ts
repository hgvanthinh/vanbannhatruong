import { DOC_CATEGORIES } from '../constants/docCategories';
import { DOC_FORMS } from '../constants/docForms';
import type { LibraryDoc } from '../types';
import { normalizeVi } from './text';

/**
 * Loại / Hình thức người quản lý tự thêm ("Thêm mục mới" ở modal Đăng văn bản)
 * lưu thẳng TÊN làm value (VD "Tờ khai") — không cần bảng riêng, rules chỉ
 * kiểm chuỗi ≤ 50 ký tự. Danh sách mục tự thêm của 1 trường = các value lạ có
 * trong văn bản đã đăng, chèn trước mục "Khác" của danh sách cố định.
 */
export const MAX_CUSTOM_OPTION_LENGTH = 50;

export interface DocOption {
  value: string;
  label: string;
}

/** Danh sách cố định + các value lạ (bỏ trùng, xếp A→Z), chèn trước mục cuối "Khác". */
export function mergeCustomOptions(fixed: ReadonlyArray<DocOption>, values: Iterable<string>): DocOption[] {
  const known = new Set(fixed.map((o) => o.value));
  const custom = [...new Set(values)]
    .filter((v) => v && !known.has(v))
    .sort((a, b) => a.localeCompare(b, 'vi'))
    .map((v) => ({ value: v, label: v }));
  const base = fixed.map((o) => ({ value: o.value, label: o.label }));
  return [...base.slice(0, -1), ...custom, ...base.slice(-1)];
}

export function categoryOptions(docs: LibraryDoc[], extra: string[] = []): DocOption[] {
  return mergeCustomOptions(DOC_CATEGORIES, [...docs.map((d) => d.category), ...extra]);
}

export function docFormOptions(docs: LibraryDoc[], extra: string[] = []): DocOption[] {
  return mergeCustomOptions(DOC_FORMS, [...docs.map((d) => d.docForm), ...extra]);
}

/** Mục đã có trùng tên (không phân biệt dấu/hoa thường) — gõ lại "ke hoach" thì dùng luôn "Kế hoạch". */
export function findOptionByLabel(options: DocOption[], label: string): DocOption | undefined {
  const key = normalizeVi(label);
  return options.find((o) => normalizeVi(o.label) === key);
}

/** Gọn khoảng trắng, viết hoa chữ đầu: "  tờ   khai " → "Tờ khai". */
export function cleanOptionLabel(raw: string): string {
  const text = raw.trim().replace(/\s+/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Lỗi của tên mục mới, hoặc null nếu dùng được. Cấm dấu phẩy vì trang in ghi
 * nhiều Loại/Hình thức trên URL cách nhau bằng dấu phẩy (?loai=a,b).
 */
export function optionLabelError(label: string): string | null {
  if (!label) return 'Nhập tên mục mới';
  if (label.length > MAX_CUSTOM_OPTION_LENGTH) return `Tối đa ${MAX_CUSTOM_OPTION_LENGTH} ký tự`;
  if (label.includes(',')) return 'Tên không được có dấu phẩy';
  return null;
}

/** Value lấy từ URL / localStorage: mục cố định hoặc mục tự thêm hợp lệ. */
export function isValidOptionValue(value: unknown): value is string {
  return typeof value === 'string' && value.trim() === value && optionLabelError(value) === null;
}
