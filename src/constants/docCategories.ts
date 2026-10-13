/**
 * Loại văn bản — danh sách CỐ ĐỊNH để bộ lọc gọn và không bị gõ sai chính tả.
 * Thêm loại mới chỉ cần thêm 1 dòng ở đây (rules không liệt kê cứng các loại).
 * KHÔNG đổi `value` của loại đã dùng: doc cũ lưu value, đổi sẽ rơi vào "Khác".
 */
export const DOC_CATEGORIES = [
  { value: 'nha-truong', label: 'Văn bản Nhà trường', color: 'blue' },
  { value: 'chi-bo', label: 'Văn bản Chi bộ - Đảng bộ', color: 'red' },
  { value: 'cong-doan', label: 'Công đoàn', color: 'orange' },
  { value: 'doan-doi', label: 'Đoàn - Đội', color: 'cyan' },
  { value: 'cap-tren', label: 'Văn bản cấp trên', color: 'purple' },
  { value: 'khac', label: 'Khác', color: 'default' },
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number]['value'];

const FALLBACK_CATEGORY = DOC_CATEGORIES[DOC_CATEGORIES.length - 1];

export function getCategoryMeta(value: string) {
  return DOC_CATEGORIES.find((c) => c.value === value) ?? FALLBACK_CATEGORY;
}
