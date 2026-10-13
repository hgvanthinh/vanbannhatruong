/**
 * Loại văn bản — danh sách CỐ ĐỊNH để bộ lọc gọn và không bị gõ sai chính tả.
 * Thêm loại mới chỉ cần thêm 1 dòng ở đây (rules không liệt kê cứng các loại).
 * KHÔNG đổi `value` của loại đã dùng: doc cũ lưu value, đổi sẽ thành mục tự thêm.
 */
export const DOC_CATEGORIES = [
  { value: 'nha-truong', label: 'Văn bản Nhà trường', color: 'blue' },
  { value: 'chi-bo', label: 'Văn bản Chi bộ - Đảng bộ', color: 'red' },
  { value: 'cong-doan', label: 'Công đoàn', color: 'orange' },
  { value: 'doan-doi', label: 'Đoàn - Đội', color: 'cyan' },
  { value: 'cap-tren', label: 'Văn bản cấp trên', color: 'purple' },
  { value: 'ban-tru', label: 'Hồ sơ bán trú', color: 'green' },
  { value: 'khac', label: 'Khác', color: 'default' },
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number]['value'];

const FALLBACK_CATEGORY = DOC_CATEGORIES[DOC_CATEGORIES.length - 1];

/** Value lạ = loại người quản lý tự thêm (src/utils/docOptions.ts): tên chính là value. */
export function getCategoryMeta(value: string | undefined): { value: string; label: string; color: string } {
  if (!value) return FALLBACK_CATEGORY;
  return DOC_CATEGORIES.find((c) => c.value === value) ?? { value, label: value, color: 'default' };
}
