/**
 * Vai trò của người quản lý trường — CHỈ để ghi nhận/hiển thị (ai là ai), KHÔNG
 * phân quyền: mọi email trong vbSchoolEditors ngang quyền nhau. Người đăng ký
 * trường không nhất thiết là HT (có thể là phụ trách CNTT, văn thư...).
 * KHÔNG đổi `value` đã dùng: doc cũ lưu value, đổi sẽ rơi vào "Khác".
 */
export const EDITOR_ROLES = [
  { value: 'hieu-truong', label: 'Hiệu trưởng' },
  { value: 'pho-hieu-truong', label: 'Phó Hiệu trưởng' },
  { value: 'van-thu', label: 'Văn thư' },
  { value: 'cntt', label: 'Phụ trách CNTT' },
  { value: 'to-truong', label: 'Tổ trưởng chuyên môn' },
  { value: 'cong-doan', label: 'Chủ tịch Công đoàn' },
  { value: 'doan-doi', label: 'Bí thư Đoàn / TPT Đội' },
  { value: 'khac', label: 'Khác' },
] as const;

export type EditorRole = (typeof EDITOR_ROLES)[number]['value'];

export const EDITOR_ROLE_OPTIONS = EDITOR_ROLES.map((r) => ({ value: r.value, label: r.label }));

/** Không có vai trò (email thêm trước khi có tính năng này) → undefined để UI ẩn nhãn. */
export function getEditorRoleLabel(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return EDITOR_ROLES.find((r) => r.value === value)?.label ?? 'Khác';
}
