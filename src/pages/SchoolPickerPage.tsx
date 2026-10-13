import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Empty, Input, Result, Skeleton, Space, Typography } from 'antd';
import { BankOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { PageShell } from '../components/PageShell';
import { FilterChips } from '../components/FilterChips';
import { SCHOOL_LEVELS, getLevelLabel, type SchoolLevel } from '../constants/schoolLevels';
import { listSchools } from '../services/schoolService';
import { countBy } from '../utils/libraryFilter';
import { setLastSchool } from '../utils/lastSchool';
import { normalizeVi } from '../utils/text';
import type { School } from '../types';

/**
 * Chọn trường để xem văn bản — không cần đăng nhập. Chọn xong app nhớ trường
 * đó (localStorage) để lần sau mở trang chủ là vào thẳng.
 */
export function SchoolPickerPage() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState<SchoolLevel | 'all'>('all');

  useEffect(() => {
    document.title = 'Chọn trường - Văn bản nhà trường';
    listSchools()
      .then(setSchools)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Lọc theo từ khoá trước để số đếm trên chip cấp học khớp với ô tìm kiếm.
  const keywordMatched = useMemo(() => {
    const kw = normalizeVi(keyword);
    return kw ? schools.filter((s) => normalizeVi(`${s.name} ${s.area}`).includes(kw)) : schools;
  }, [schools, keyword]);
  const levelFacet = useMemo(() => countBy(keywordMatched, (s) => s.level), [keywordMatched]);
  const visible = level === 'all' ? keywordMatched : keywordMatched.filter((s) => s.level === level);

  function choose(slug: string) {
    setLastSchool(slug);
    navigate(`/truong/${slug}`);
  }

  return (
    <PageShell
      headerExtra={
        <Button size="small" onClick={() => navigate('/quan-ly')}>
          Dành cho nhà trường
        </Button>
      }
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Chọn trường của bạn
          </Typography.Title>
          <Typography.Text type="secondary">Lần sau mở trang sẽ vào thẳng trường đã chọn.</Typography.Text>
        </div>

        {error ? (
          <Result status="warning" title="Không tải được danh sách trường" subTitle="Kiểm tra kết nối mạng rồi tải lại trang." />
        ) : (
          <>
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              placeholder="Tìm tên trường hoặc địa bàn (gõ không dấu cũng được)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {schools.length > 0 && (
              <FilterChips label="Cấp học" options={SCHOOL_LEVELS} value={level} onChange={setLevel} facet={levelFacet} />
            )}

            {loading ? (
              <Card size="small">
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            ) : visible.length === 0 ? (
              <Card size="small">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={schools.length === 0 ? 'Chưa có trường nào đăng ký' : 'Không tìm thấy trường phù hợp'}
                />
              </Card>
            ) : (
              <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                {visible.map((s) => (
                  <Card key={s.slug} size="small" hoverable onClick={() => choose(s.slug)} styles={{ body: { padding: 14 } }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <BankOutlined style={{ fontSize: 22, color: '#1677ff' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Typography.Text strong style={{ fontSize: 15, display: 'block' }}>
                          {s.name}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                          {[getLevelLabel(s.level), s.area].filter(Boolean).join(' · ')}
                        </Typography.Text>
                      </div>
                      <RightOutlined style={{ color: 'var(--muted)' }} />
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </>
        )}
      </Space>
    </PageShell>
  );
}
