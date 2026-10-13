import { useMemo, useState } from 'react';
import { Empty, Input, Typography } from 'antd';
import { BankOutlined, ExportOutlined, SearchOutlined } from '@ant-design/icons';
import { getLevelLabel } from '../constants/schoolLevels';
import { normalizeVi } from '../utils/text';
import type { School } from '../types';

/**
 * Từ chung trong tên trường — bỏ qua khi so tên gần giống, nếu không gõ
 * "Trường THCS" là ra cả trăm trường.
 */
const GENERIC_WORDS = new Set([
  'truong', 'mam', 'non', 'mn', 'tieu', 'hoc', 'th', 'thcs', 'thpt', 'trung', 'co', 'so', 'pho', 'thong',
  'lien', 'cap', 'ptdtbt', 'ptdtnt', 'pt', 'dan', 'toc', 'ban', 'noi', 'tru', 'va', 'xa', 'phuong', 'thi', 'tran',
]);

function words(text: string): string[] {
  return normalizeVi(text).split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Trường đã có mà tên gần giống tên đang gõ: mọi từ "riêng" (bỏ từ chung) của
 * tên gõ vào đều là đầu 1 từ trong tên + địa bàn của trường (gõ dở từ cuối vẫn khớp).
 */
export function findSimilarSchools(schools: School[], name: string | undefined): School[] {
  const keys = words(name ?? '').filter((w) => !GENERIC_WORDS.has(w));
  if (keys.length === 0 || keys.join('').length < 2) return [];
  return schools.filter((s) => {
    const schoolWords = words(`${s.name} ${s.area}`);
    return keys.every((k) => schoolWords.some((w) => w.startsWith(k)));
  });
}

/** 1 dòng trường — bấm mở trang công khai của trường ở tab mới để đối chiếu. */
export function ExistingSchoolRow({ school }: { school: School }) {
  return (
    <a
      href={`/truong/${school.slug}`}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
        color: 'inherit',
      }}
    >
      <BankOutlined style={{ fontSize: 18, color: '#1677ff' }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <Typography.Text strong style={{ display: 'block' }}>
          {school.name}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {[getLevelLabel(school.level), school.area].filter(Boolean).join(' · ')}
        </Typography.Text>
      </span>
      <ExportOutlined style={{ color: 'var(--muted)' }} title="Mở trang trường" />
    </a>
  );
}

/** Toàn bộ trường đã đăng ký + ô tìm không dấu (trong form đăng ký trường). */
export function ExistingSchoolList({ schools }: { schools: School[] }) {
  const [keyword, setKeyword] = useState('');
  const visible = useMemo(() => {
    const kw = normalizeVi(keyword);
    return kw ? schools.filter((s) => normalizeVi(`${s.name} ${s.area}`).includes(kw)) : schools;
  }, [schools, keyword]);

  return (
    <div>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Tìm tên trường hoặc địa bàn (gõ không dấu cũng được)"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div style={{ maxHeight: 320, overflowY: 'auto', marginTop: 4 }}>
        {visible.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={schools.length === 0 ? 'Chưa có trường nào đăng ký' : 'Không tìm thấy trường phù hợp'}
          />
        ) : (
          visible.map((s) => <ExistingSchoolRow key={s.slug} school={s} />)
        )}
      </div>
    </div>
  );
}
