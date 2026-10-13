import { Tag, Typography } from 'antd';
import type { FacetCounts } from '../utils/libraryFilter';

interface FilterChipsProps<V extends string> {
  /** Nhãn nhỏ đầu hàng ("Loại", "Hình thức"). */
  label: string;
  options: ReadonlyArray<{ value: V; label: string }>;
  value: V | 'all';
  onChange: (value: V | 'all') => void;
  /** Số văn bản theo từng giá trị (xem facetCounts) — giá trị 0 văn bản bị ẩn cho gọn. */
  facet: FacetCounts;
}

/**
 * Hàng chip lọc, cuộn ngang trên điện thoại thay vì xuống dòng — giữ danh sách
 * luôn ở gần đầu màn hình. Hợp với ít lựa chọn (Cấp học ở trang chọn trường);
 * kho văn bản nhiều lựa chọn hơn nên dùng ô chọn ở LibraryFilterBar.
 */
export function FilterChips<V extends string>({ label, options, value, onChange, facet }: FilterChipsProps<V>) {
  const items: Array<{ value: V | 'all'; label: string; count: number }> = [
    { value: 'all', label: 'Tất cả', count: facet.total },
    // Giữ chip đang chọn dù đã về 0 (vd vừa xoá văn bản cuối, hoặc hàng kia vừa
    // đổi) để người dùng còn thấy và bấm bỏ chọn được.
    ...options
      .filter((o) => (facet.counts[o.value] ?? 0) > 0 || o.value === value)
      .map((o) => ({ value: o.value, label: o.label, count: facet.counts[o.value] ?? 0 })),
  ];

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
      <Typography.Text type="secondary" style={{ flexShrink: 0, fontSize: 13 }}>
        {label}:
      </Typography.Text>
      {items.map((item) => (
        <Tag.CheckableTag
          key={item.value}
          checked={value === item.value}
          onChange={() => onChange(item.value)}
          style={{ flexShrink: 0, padding: '6px 12px', fontSize: 14, border: '1px solid #d9d9d9', marginInlineEnd: 0 }}
        >
          {item.label} ({item.count})
        </Tag.CheckableTag>
      ))}
    </div>
  );
}
