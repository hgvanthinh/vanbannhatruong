import { useMemo } from 'react';
import { Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { DOC_CATEGORIES } from '../constants/docCategories';
import { DOC_FORMS } from '../constants/docForms';
import { facetCounts } from '../utils/libraryFilter';
import { FilterChips } from './FilterChips';
import type { LibraryDoc, LibraryFilter } from '../types';

interface LibraryFilterBarProps {
  docs: LibraryDoc[];
  filter: LibraryFilter;
  onChange: (filter: LibraryFilter) => void;
  /** Ô tìm to hơn ở trang công khai (GV dùng điện thoại). */
  size?: 'middle' | 'large';
  searchMaxWidth?: number;
}

/** Ô tìm + 2 hàng chip (Loại, Hình thức) — dùng chung cho trang HT và trang công khai. */
export function LibraryFilterBar({ docs, filter, onChange, size = 'middle', searchMaxWidth }: LibraryFilterBarProps) {
  const facets = useMemo(() => facetCounts(docs, filter), [docs, filter]);

  return (
    <Space orientation="vertical" size={10} style={{ width: '100%' }}>
      <Input
        allowClear
        size={size}
        prefix={<SearchOutlined />}
        placeholder="Tìm theo tên văn bản (gõ không dấu cũng được)"
        value={filter.keyword}
        onChange={(e) => onChange({ ...filter, keyword: e.target.value })}
        style={{ maxWidth: searchMaxWidth }}
      />
      {docs.length > 0 && (
        <>
          <FilterChips
            label="Loại"
            options={DOC_CATEGORIES}
            value={filter.category}
            onChange={(category) => onChange({ ...filter, category })}
            facet={facets.category}
          />
          <FilterChips
            label="Hình thức"
            options={DOC_FORMS}
            value={filter.docForm}
            onChange={(docForm) => onChange({ ...filter, docForm })}
            facet={facets.docForm}
          />
        </>
      )}
    </Space>
  );
}
