import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Empty, Result, Skeleton, Space, Typography } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { PageShell } from '../components/PageShell';
import { LibraryFilterBar } from '../components/LibraryFilterBar';
import { PublicDocCard } from '../components/PublicDocCard';
import { getLevelLabel } from '../constants/schoolLevels';
import { SITE_NAME } from '../constants/site';
import { listDocs } from '../services/docService';
import { getSchool } from '../services/schoolService';
import { EMPTY_FILTER, filterDocs } from '../utils/libraryFilter';
import { clearLastSchool, setLastSchool } from '../utils/lastSchool';
import type { LibraryDoc, LibraryFilter, School } from '../types';

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

/** Kho văn bản công khai của 1 trường (/truong/:slug) — GV xem không cần đăng nhập. */
export function PublicSchoolPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [docs, setDocs] = useState<LibraryDoc[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [filter, setFilter] = useState<LibraryFilter>(EMPTY_FILTER);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    Promise.all([getSchool(slug), listDocs(slug)])
      .then(([s, list]) => {
        if (cancelled) return;
        if (!s) {
          // Trường đã bị xoá/đổi: quên lựa chọn cũ để trang chủ không đưa GV vào ngõ cụt mãi.
          clearLastSchool();
          setState('missing');
          return;
        }
        // Vào bằng QR/link cũng tính là "đã chọn trường" — lần sau mở trang chủ vào thẳng.
        setLastSchool(slug);
        setSchool(s);
        setDocs(list);
        setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    document.title = school ? `${school.name} - ${SITE_NAME}` : SITE_NAME;
  }, [school]);

  const visibleDocs = useMemo(() => filterDocs(docs, filter), [docs, filter]);

  const changeSchoolButton = (
    <Button size="small" icon={<SwapOutlined />} onClick={() => navigate('/chon-truong')}>
      Đổi trường
    </Button>
  );

  if (state === 'missing') {
    return (
      <PageShell headerExtra={changeSchoolButton}>
        <Result
          status="404"
          title="Không tìm thấy trường"
          subTitle="Đường dẫn không đúng hoặc trường đã ngừng sử dụng."
          extra={
            <Button type="primary" onClick={() => navigate('/chon-truong')}>
              Chọn trường khác
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell headerExtra={changeSchoolButton}>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {school?.name ?? 'Kho văn bản'}
          </Typography.Title>
          {school && (
            <Typography.Text type="secondary">
              {[getLevelLabel(school.level), school.area].filter(Boolean).join(' · ')}
            </Typography.Text>
          )}
        </div>

        {state === 'error' ? (
          <Result status="warning" title="Không tải được danh sách văn bản" subTitle="Kiểm tra kết nối mạng rồi tải lại trang." />
        ) : (
          <>
            <LibraryFilterBar docs={docs} filter={filter} onChange={setFilter} size="large" />
            {state === 'loading' ? (
              <Card size="small">
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            ) : visibleDocs.length === 0 ? (
              <Card size="small">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={docs.length === 0 ? 'Trường chưa đăng văn bản nào' : 'Không tìm thấy văn bản phù hợp'}
                />
              </Card>
            ) : (
              <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                {visibleDocs.map((d) => (
                  <PublicDocCard key={d.id} doc={d} />
                ))}
              </Space>
            )}
          </>
        )}
      </Space>
    </PageShell>
  );
}
