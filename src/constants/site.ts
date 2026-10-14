export const SITE_NAME = 'Văn bản nhà trường';

/**
 * Email quản trị toàn hệ thống: xem/xoá MỌI trường (dọn trường rác/giả vì HT tự
 * đăng ký). PHẢI khớp danh sách trong vbIsAdmin() của firestore.rules — sửa thì
 * sửa cả 2 nơi (client chỉ để hiện menu, quyền thật nằm ở rules).
 */
export const ADMIN_EMAILS = ['thaygiaotin1990@gmail.com'];

/** Tối đa số email quản lý 1 trường — khớp rules (vbSchoolEditors). */
export const MAX_EDITORS_PER_SCHOOL = 20;

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/** Link công khai — dùng origin hiện tại vì website tự host ở tên miền riêng. */
export function buildSchoolUrl(slug: string): string {
  return `${window.location.origin}/truong/${slug}`;
}

/** Link trung gian của QR từng văn bản — app đọc doc rồi chuyển sang Drive. */
export function buildDocUrl(slug: string, docId: string): string {
  return `${window.location.origin}/vb/${slug}/${docId}`;
}

/** Link danh sách lớp (QR dán cửa lớp) — classId ngẫu nhiên nên người ngoài không dò được. */
export function buildClassUrl(slug: string, classId: string): string {
  return `${window.location.origin}/lop/${slug}/${classId}`;
}
