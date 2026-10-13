/**
 * Nhớ trường GV đã chọn để lần sau vào thẳng kho văn bản trường đó. Chỉ là
 * tiện ích trên máy người xem — localStorage có thể bị chặn (chế độ ẩn danh,
 * trình duyệt trong Zalo...) nên mọi truy cập đều bọc try/catch.
 */
const KEY = 'vbnt:lastSchool';

export function getLastSchool(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setLastSchool(slug: string): void {
  try {
    localStorage.setItem(KEY, slug);
  } catch {
    // bỏ qua: không lưu được thì lần sau GV chọn lại trường
  }
}

export function clearLastSchool(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // bỏ qua
  }
}
