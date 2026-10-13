import type { LibraryDoc, LibraryFilter } from '../types';
import { normalizeVi } from './text';

export const EMPTY_FILTER: LibraryFilter = { category: 'all', docForm: 'all', keyword: '' };

export function filterDocs(docs: LibraryDoc[], filter: LibraryFilter): LibraryDoc[] {
  const keyword = normalizeVi(filter.keyword);
  return docs.filter(
    (d) =>
      (filter.category === 'all' || d.category === filter.category) &&
      (filter.docForm === 'all' || d.docForm === filter.docForm) &&
      (!keyword || normalizeVi(d.title).includes(keyword))
  );
}

export interface FacetCounts {
  /** Số văn bản theo từng giá trị của hàng chip. */
  counts: Record<string, number>;
  /** Số hiện ở chip "Tất cả". */
  total: number;
}

export function countBy<T>(items: T[], keyOf: (item: T) => string): FacetCounts {
  const counts: Record<string, number> = {};
  for (const item of items) counts[keyOf(item)] = (counts[keyOf(item)] ?? 0) + 1;
  return { counts, total: items.length };
}

/**
 * Số đếm cho 2 hàng chip lọc. Mỗi hàng đếm trên tập đã áp MỌI bộ lọc KHÁC trừ
 * chính nó — chọn "Chi bộ" thì hàng Hình thức chỉ còn đếm văn bản Chi bộ, nhưng
 * hàng Loại vẫn hiện đủ để đổi sang loại khác được.
 */
export function facetCounts(docs: LibraryDoc[], filter: LibraryFilter): { category: FacetCounts; docForm: FacetCounts } {
  return {
    category: countBy(filterDocs(docs, { ...filter, category: 'all' }), (d) => d.category),
    docForm: countBy(filterDocs(docs, { ...filter, docForm: 'all' }), (d) => d.docForm),
  };
}
