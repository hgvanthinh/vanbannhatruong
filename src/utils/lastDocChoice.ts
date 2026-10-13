import { DOC_CATEGORIES, type DocCategory } from '../constants/docCategories';
import { DEFAULT_DOC_FORM, DOC_FORMS, type DocForm } from '../constants/docForms';

/**
 * Nhớ Hình thức + Loại của văn bản đăng gần nhất để lần đăng sau chọn sẵn
 * (người quản lý hay đăng liền nhiều văn bản cùng kiểu). Chỉ là tiện ích trên
 * máy đó — localStorage có thể bị chặn nên bọc try/catch; giá trị không còn
 * trong danh sách cố định thì dùng mặc định.
 */
const KEY = 'vbnt:lastDocChoice';

export function getLastDocChoice(): { docForm: DocForm; category: DocCategory } {
  let saved: { docForm?: string; category?: string } = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {};
  } catch {
    // bỏ qua: dùng mặc định
  }
  return {
    docForm: DOC_FORMS.find((f) => f.value === saved.docForm)?.value ?? DEFAULT_DOC_FORM,
    category: DOC_CATEGORIES.find((c) => c.value === saved.category)?.value ?? DOC_CATEGORIES[0].value,
  };
}

export function setLastDocChoice(docForm: DocForm, category: DocCategory): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ docForm, category }));
  } catch {
    // bỏ qua: không lưu được thì lần sau chọn lại
  }
}
