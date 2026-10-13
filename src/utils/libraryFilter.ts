import { currentSchoolYear } from '../constants/docTitleSuggestions';
import type { DocSort, LibraryDoc, LibraryFilter } from '../types';
import { normalizeVi } from './text';

export const DOC_SORTS: { value: DocSort; label: string }[] = [
  { value: 'newest', label: 'Mới đăng trước' },
  { value: 'oldest', label: 'Cũ trước' },
  { value: 'title', label: 'Tên A → Z' },
];

export const EMPTY_FILTER: LibraryFilter = { category: 'all', docForm: 'all', schoolYear: 'all', keyword: '', sort: 'newest' };

/** Có đang lọc gì không (sắp xếp không tính là lọc). */
export function isFiltering(filter: LibraryFilter): boolean {
  return filter.category !== 'all' || filter.docForm !== 'all' || filter.schoolYear !== 'all' || filter.keyword.trim() !== '';
}

/** Bỏ mọi bộ lọc nhưng giữ cách sắp xếp người dùng đã chọn. */
export function clearFilter(filter: LibraryFilter): LibraryFilter {
  return { ...EMPTY_FILTER, sort: filter.sort };
}

/** Năm học của văn bản theo NGÀY ĐĂNG (tháng 8 sang năm học mới, như gợi ý tên). */
export function docSchoolYear(doc: LibraryDoc): string {
  return currentSchoolYear(new Date(doc.createdAt));
}

// Chữ tìm kiếm (tên + tên phụ lục, bỏ dấu) tính 1 lần cho mỗi văn bản — bộ lọc chạy lại mỗi phím gõ và mỗi lần đếm.
const normalizedTitles = new WeakMap<LibraryDoc, string>();
function normalizedTitle(doc: LibraryDoc): string {
  let title = normalizedTitles.get(doc);
  if (title === undefined) {
    title = normalizeVi([doc.title, ...(doc.attachments ?? []).map((a) => a.name)].join(' '));
    normalizedTitles.set(doc, title);
  }
  return title;
}

export function filterDocs(docs: LibraryDoc[], filter: LibraryFilter): LibraryDoc[] {
  // Tách từ: "ke hoach thi dua" vẫn ra "Kế hoạch tổ chức phong trào thi đua".
  const words = normalizeVi(filter.keyword).split(/\s+/).filter(Boolean);
  return docs.filter(
    (d) =>
      (filter.category === 'all' || d.category === filter.category) &&
      (filter.docForm === 'all' || d.docForm === filter.docForm) &&
      (filter.schoolYear === 'all' || docSchoolYear(d) === filter.schoolYear) &&
      words.every((w) => normalizedTitle(d).includes(w))
  );
}

const titleCollator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });

/** Trả mảng mới đã sắp xếp (không đụng mảng gốc). */
export function sortDocs(docs: LibraryDoc[], sort: DocSort): LibraryDoc[] {
  const sorted = [...docs];
  if (sort === 'title') sorted.sort((a, b) => titleCollator.compare(a.title, b.title));
  else if (sort === 'oldest') sorted.sort((a, b) => a.createdAt - b.createdAt);
  else sorted.sort((a, b) => b.createdAt - a.createdAt);
  return sorted;
}

export interface FacetCounts {
  /** Số văn bản theo từng giá trị của bộ lọc. */
  counts: Record<string, number>;
  /** Số hiện ở mục "Tất cả". */
  total: number;
}

export function countBy<T>(items: T[], keyOf: (item: T) => string): FacetCounts {
  const counts: Record<string, number> = {};
  for (const item of items) counts[keyOf(item)] = (counts[keyOf(item)] ?? 0) + 1;
  return { counts, total: items.length };
}

/**
 * Số đếm cho từng ô lọc. Mỗi ô đếm trên tập đã áp MỌI bộ lọc KHÁC trừ chính
 * nó — chọn "Chi bộ" thì ô Hình thức chỉ còn đếm văn bản Chi bộ, nhưng ô Loại
 * vẫn hiện đủ để đổi sang loại khác được.
 */
export function facetCounts(
  docs: LibraryDoc[],
  filter: LibraryFilter
): { category: FacetCounts; docForm: FacetCounts; schoolYear: FacetCounts } {
  return {
    category: countBy(filterDocs(docs, { ...filter, category: 'all' }), (d) => d.category),
    docForm: countBy(filterDocs(docs, { ...filter, docForm: 'all' }), (d) => d.docForm),
    schoolYear: countBy(filterDocs(docs, { ...filter, schoolYear: 'all' }), docSchoolYear),
  };
}

/** Các năm học có văn bản (mới nhất trước) — ô Năm học chỉ hiện khi có từ 2 năm trở lên. */
export function listSchoolYears(docs: LibraryDoc[]): string[] {
  return [...new Set(docs.map(docSchoolYear))].sort().reverse();
}
