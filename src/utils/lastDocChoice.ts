import { DOC_CATEGORIES } from '../constants/docCategories';
import { DEFAULT_DOC_FORM } from '../constants/docForms';
import { isValidOptionValue } from './docOptions';

/**
 * Nhớ Hình thức + Loại của văn bản đăng gần nhất để lần đăng sau chọn sẵn
 * (người quản lý hay đăng liền nhiều văn bản cùng kiểu). Chỉ là tiện ích trên
 * máy đó — localStorage có thể bị chặn nên bọc try/catch; giá trị hỏng thì
 * dùng mặc định. Mục tự thêm cũng được nhớ (value = tên mục).
 */
const KEY = 'vbnt:lastDocChoice';

export function getLastDocChoice(): { docForm: string; category: string } {
  let saved: { docForm?: string; category?: string } = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {};
  } catch {
    // bỏ qua: dùng mặc định
  }
  return {
    docForm: isValidOptionValue(saved.docForm) ? saved.docForm : DEFAULT_DOC_FORM,
    category: isValidOptionValue(saved.category) ? saved.category : DOC_CATEGORIES[0].value,
  };
}

export function setLastDocChoice(docForm: string, category: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ docForm, category }));
  } catch {
    // bỏ qua: không lưu được thì lần sau chọn lại
  }
}
