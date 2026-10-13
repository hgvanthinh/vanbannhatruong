import { useMemo } from 'react';
import { Button, Input, Select, Space, Typography } from 'antd';
import { CloseCircleOutlined, SearchOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { DOC_CATEGORIES } from '../constants/docCategories';
import { DOC_FORMS } from '../constants/docForms';
import { DOC_SORTS, clearFilter, facetCounts, isFiltering, listSchoolYears, type FacetCounts } from '../utils/libraryFilter';
import type { LibraryDoc, LibraryFilter } from '../types';

interface LibraryFilterBarProps {
  docs: LibraryDoc[];
  filter: LibraryFilter;
  onChange: (filter: LibraryFilter) => void;
  /** Số văn bản sau khi lọc — cho dòng "Tìm thấy x / y văn bản". */
  resultCount: number;
  /** Ô tìm to hơn ở trang công khai (GV dùng điện thoại). */
  size?: 'middle' | 'large';
}

interface FacetOption {
  value: string;
  label: string;
  count: number;
}

/**
 * Mục "Tất cả" + các giá trị có văn bản. Giữ giá trị đang chọn dù đã về 0 (vd
 * vừa xoá văn bản cuối, hoặc ô khác vừa đổi) để người dùng còn thấy mà bỏ chọn.
 */
function facetOptions(
  allLabel: string,
  options: ReadonlyArray<{ value: string; label: string }>,
  facet: FacetCounts,
  selected: string
): FacetOption[] {
  return [
    { value: 'all', label: allLabel, count: facet.total },
    ...options
      .filter((o) => (facet.counts[o.value] ?? 0) > 0 || o.value === selected)
      .map((o) => ({ value: o.value, label: o.label, count: facet.counts[o.value] ?? 0 })),
  ];
}

function FacetSelect({
  value,
  options,
  onChange,
  size,
  ariaLabel,
}: {
  value: string;
  options: FacetOption[];
  onChange: (value: string) => void;
  size: 'middle' | 'large';
  ariaLabel: string;
}) {
  return (
    <Select
      aria-label={ariaLabel}
      size={size}
      value={value}
      onChange={onChange}
      options={options}
      popupMatchSelectWidth={false}
      style={{ width: '100%' }}
      // Ô đang lọc hiện chữ xanh đậm — nhìn lướt là biết đang lọc theo gì.
      labelRender={({ label }) =>
        value === 'all' ? label : <span style={{ color: '#1677ff', fontWeight: 600 }}>{label}</span>
      }
      optionRender={({ data }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>{data.label}</span>
          <Typography.Text type="secondary">{data.count}</Typography.Text>
        </div>
      )}
    />
  );
}

/**
 * Ô tìm + lưới ô chọn Loại / Hình thức / Năm học / Sắp xếp + dòng kết quả —
 * dùng chung cho trang HT và trang công khai. Ô chọn thay cho hàng chip để
 * 13 hình thức không kéo dài màn hình, và luôn thấy đang lọc theo gì.
 */
export function LibraryFilterBar({ docs, filter, onChange, resultCount, size = 'middle' }: LibraryFilterBarProps) {
  const facets = useMemo(() => facetCounts(docs, filter), [docs, filter]);
  const schoolYears = useMemo(() => listSchoolYears(docs), [docs]);
  const filtering = isFiltering(filter);
  // Cả kho chỉ trong 1 năm học thì ô Năm học vô nghĩa — ẩn cho gọn.
  const showSchoolYear = schoolYears.length > 1 || filter.schoolYear !== 'all';

  return (
    <Space orientation="vertical" size={10} style={{ width: '100%' }}>
      <Input
        allowClear
        size={size}
        prefix={<SearchOutlined />}
        placeholder="Tìm theo tên văn bản (gõ không dấu cũng được)"
        value={filter.keyword}
        onChange={(e) => onChange({ ...filter, keyword: e.target.value })}
      />
      {docs.length > 0 && (
        <>
          {/* Điện thoại: 2 cột; máy tính: 1 hàng. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
            <FacetSelect
              ariaLabel="Lọc theo loại"
              size={size}
              value={filter.category}
              options={facetOptions('Tất cả loại', DOC_CATEGORIES, facets.category, filter.category)}
              onChange={(category) => onChange({ ...filter, category: category as LibraryFilter['category'] })}
            />
            <FacetSelect
              ariaLabel="Lọc theo hình thức"
              size={size}
              value={filter.docForm}
              options={facetOptions('Tất cả hình thức', DOC_FORMS, facets.docForm, filter.docForm)}
              onChange={(docForm) => onChange({ ...filter, docForm: docForm as LibraryFilter['docForm'] })}
            />
            {showSchoolYear && (
              <FacetSelect
                ariaLabel="Lọc theo năm học"
                size={size}
                value={filter.schoolYear}
                options={facetOptions(
                  'Mọi năm học',
                  schoolYears.map((y) => ({ value: y, label: `Năm học ${y}` })),
                  facets.schoolYear,
                  filter.schoolYear
                )}
                onChange={(schoolYear) => onChange({ ...filter, schoolYear })}
              />
            )}
            <Select
              aria-label="Sắp xếp"
              size={size}
              prefix={<SortAscendingOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />}
              value={filter.sort}
              onChange={(sort) => onChange({ ...filter, sort })}
              options={DOC_SORTS}
              popupMatchSelectWidth={false}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 24 }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {filtering ? `Tìm thấy ${resultCount} / ${docs.length} văn bản` : `${docs.length} văn bản`}
            </Typography.Text>
            {filtering && (
              <Button type="link" size="small" icon={<CloseCircleOutlined />} onClick={() => onChange(clearFilter(filter))} style={{ paddingInline: 0 }}>
                Xoá bộ lọc
              </Button>
            )}
          </div>
        </>
      )}
    </Space>
  );
}
