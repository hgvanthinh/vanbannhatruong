/** Bỏ dấu + chữ thường — để GV gõ "ke hoach" trên điện thoại vẫn ra "Kế hoạch". */
export function normalizeVi(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Khớp đúng vbValidSlug() trong firestore.rules — sửa thì sửa cả 2 nơi. */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 60;

export function isValidSlug(slug: string): boolean {
  return slug.length >= SLUG_MIN_LENGTH && slug.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(slug);
}

/**
 * Làm sạch khi đang gõ: bỏ dấu, chữ thường, ký tự lạ → '-'. KHÔNG cắt '-' ở
 * 2 đầu (đang gõ dở "thcs-" thì phải giữ được dấu '-' cuối).
 */
export function sanitizeSlugInput(text: string): string {
  return normalizeVi(text)
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, SLUG_MAX_LENGTH);
}

/** Chuẩn hoá hoàn chỉnh trước khi lưu: như trên + cắt '-' thừa ở 2 đầu. */
export function toSlug(text: string): string {
  return sanitizeSlugInput(text).replace(/^-+|-+$/g, '');
}

/**
 * Gợi ý đường dẫn từ tên trường: "Trường THCS Nguyễn Trãi" → "thcs-nguyen-trai"
 * (bỏ chữ "trường" đầu cho gọn). Tên quá ngắn → "truong-hoc".
 */
export function suggestSlugBase(schoolName: string): string {
  const slug = toSlug(schoolName).replace(/^truong-/, '');
  return isValidSlug(slug) ? slug : 'truong-hoc';
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value.trim()).protocol === 'https:';
  } catch {
    return false;
  }
}

/** Link Google Drive/Docs/Sheets/Slides — chỉ dùng để CẢNH BÁO, không chặn link khác. */
export function isGoogleDriveUrl(value: string): boolean {
  try {
    const host = new URL(value.trim()).hostname;
    return host === 'drive.google.com' || host === 'docs.google.com';
  } catch {
    return false;
  }
}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}
