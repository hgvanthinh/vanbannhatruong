/**
 * Hình thức văn bản — danh sách CỐ ĐỊNH (giống DOC_CATEGORIES): bộ lọc gọn,
 * không bị gõ sai chính tả. Thêm hình thức mới chỉ cần thêm 1 dòng ở đây.
 * KHÔNG đổi `value` của hình thức đã dùng: doc cũ lưu value, đổi sẽ rơi vào "Khác".
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
  { value: 'khac', label: 'Khác' },
] as const;

export type DocForm = (typeof DOC_FORMS)[number]['value'];

export const DEFAULT_DOC_FORM: DocForm = 'ke-hoach';


const FALLBACK_FORM = DOC_FORMS[DOC_FORMS.length - 1];

export function getDocFormMeta(value: string | undefined) {
  return DOC_FORMS.find((f) => f.value === value) ?? FALLBACK_FORM;
}
