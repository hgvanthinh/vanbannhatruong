/**
 * Hình thức văn bản — danh sách CỐ ĐỊNH (giống DOC_CATEGORIES): bộ lọc gọn,
 * không bị gõ sai chính tả. Thêm hình thức mới chỉ cần thêm 1 dòng ở đây.
 * KHÔNG đổi `value` của hình thức đã dùng: doc cũ lưu value, đổi sẽ thành mục tự thêm.
 */
export const DOC_FORMS = [
  { value: 'ke-hoach', label: 'Kế hoạch' },
  { value: 'cong-van', label: 'Công văn' },
  { value: 'bao-cao', label: 'Báo cáo' },
  { value: 'to-trinh', label: 'Tờ trình' },
  { value: 'quyet-dinh', label: 'Quyết định' },
  { value: 'thong-bao', label: 'Thông báo' },
  { value: 'bien-ban', label: 'Biên bản' },
  { value: 'huong-dan', label: 'Hướng dẫn' },
  { value: 'nghi-quyet', label: 'Nghị quyết' },
  { value: 'chuong-trinh', label: 'Chương trình' },
  { value: 'quy-che', label: 'Quy chế' },
  { value: 'quy-dinh', label: 'Quy định' },
  { value: 'noi-quy', label: 'Nội quy' },
  { value: 'khac', label: 'Khác' },
] as const;

export type DocForm = (typeof DOC_FORMS)[number]['value'];

export const DEFAULT_DOC_FORM: DocForm = 'ke-hoach';


const FALLBACK_FORM = DOC_FORMS[DOC_FORMS.length - 1];

/** Value lạ = hình thức người quản lý tự thêm (src/utils/docOptions.ts): tên chính là value. */
export function getDocFormMeta(value: string | undefined): { value: string; label: string } {
  if (!value) return FALLBACK_FORM;
  return DOC_FORMS.find((f) => f.value === value) ?? { value, label: value };
}
