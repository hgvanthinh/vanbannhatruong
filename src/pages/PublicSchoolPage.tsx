import { Fragment, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, Empty, Result, Skeleton, Space, Typography } from 'antd';
import { DownOutlined, PrinterOutlined, SwapOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageShell } from '../components/PageShell';
import { LibraryFilterBar } from '../components/LibraryFilterBar';
import { PublicDocCard } from '../components/PublicDocCard';
import { DOC_CATEGORIES } from '../constants/docCategories';
import { DOC_FORMS } from '../constants/docForms';
import { getLevelLabel } from '../constants/schoolLevels';
import { SITE_NAME } from '../constants/site';
import { listDocs } from '../services/docService';
import { getSchool } from '../services/schoolService';
import { DOC_SORTS, EMPTY_FILTER, filterDocs, sortDocs } from '../utils/libraryFilter';
import { clearLastSchool, setLastSchool } from '../utils/lastSchool';
import { buildPrintListPath } from '../utils/printList';
import type { LibraryDoc, LibraryFilter, School } from '../types';

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

/** Số văn bản hiện thêm mỗi lần bấm "Xem thêm" — kho vài trăm văn bản vẫn nhẹ trên điện thoại. */
const PAGE_SIZE = 30;

/**
 * Bộ lọc nằm trên URL (?q=&loai=&hinhthuc=&namhoc=&sapxep=): mở văn bản (cùng
 * tab) rồi bấm Back vẫn giữ nguyên bộ lọc, và gửi link đã lọc cho người khác
 * được. Giá trị lạ trên URL bị bỏ qua.
 */
function filterFromParams(params: URLSearchParams): LibraryFilter {
  const pick = <V extends string>(key: string, values: ReadonlyArray<{ value: V }>) =>
    values.find((v) => v.value === params.get(key))?.value;
  const year = params.get('namhoc') ?? '';
  return {
    keyword: params.get('q') ?? '',
    category: pick('loai', DOC_CATEGORIES) ?? 'all',
    docForm: pick('hinhthuc', DOC_FORMS) ?? 'all',
    schoolYear: /^\d{4}-\d{4}$/.test(year) ? year : 'all',
    sort: pick('sapxep', DOC_SORTS) ?? EMPTY_FILTER.sort,
  };
}

function filterToParams(filter: LibraryFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.keyword) params.set('q', filter.keyword);
  if (filter.category !== 'all') params.set('loai', filter.category);
  if (filter.docForm !== 'all') params.set('hinhthuc', filter.docForm);
  if (filter.schoolYear !== 'all') params.set('namhoc', filter.schoolYear);
  if (filter.sort !== EMPTY_FILTER.sort) params.set('sapxep', filter.sort);
  return params;
}

/** Kho văn bản công khai của 1 trường (/truong/:slug) — GV xem không cần đăng nhập. */
export function PublicSchoolPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [school, setSchool] = useState<School | null>(null);
  const [docs, setDocs] = useState<LibraryDoc[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  // State là nguồn chính (ô tìm gõ Telex mượt, không chờ router), URL chỉ là
  // bản sao để Back/tải lại trang khôi phục được.
  const [filter, setFilter] = useState<LibraryFilter>(() => filterFromParams(searchParams));
  // Số đã "Xem thêm" lưu trong history state của mục lịch sử này: Back từ
  // Drive về vẫn đủ danh sách như lúc rời đi.
  const [limit, setLimit] = useState(() => (location.state as { limit?: number } | null)?.limit ?? PAGE_SIZE);

  useEffect(() => {
    const search = filterToParams(filter).toString();
    // replace: gõ tìm/đổi lọc không đẻ thêm mục lịch sử — Back vẫn ra khỏi trang.
    navigate({ search: search ? `?${search}` : '' }, { replace: true, state: { limit } });
  }, [filter, limit, navigate]);

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

  const visibleDocs = useMemo(() => sortDocs(filterDocs(docs, filter), filter.sort), [docs, filter]);
  const shownDocs = visibleDocs.slice(0, limit);
  // Sắp theo ngày thì chia mốc theo tháng đăng cho dễ dò khi kho dài.
  const groupByMonth = filter.sort !== 'title';

  // Đổi bộ lọc thì về lại trang đầu của kết quả mới.
  function changeFilter(next: LibraryFilter) {
    setFilter(next);
    setLimit(PAGE_SIZE);
  }

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
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {school?.name ?? 'Kho văn bản'}
            </Typography.Title>
            {school && (
              <Typography.Text type="secondary">
                {[getLevelLabel(school.level), school.area].filter(Boolean).join(' · ')}
              </Typography.Text>
            )}
          </div>
          {state === 'ready' && docs.length > 0 && (
            // Mang theo bộ lọc đang xem sang trang in.
            <Button icon={<PrinterOutlined />} onClick={() => navigate(buildPrintListPath(slug, filter))} style={{ flexShrink: 0 }}>
              In danh sách
            </Button>
          )}
        </div>

        {state === 'error' ? (
          <Result status="warning" title="Không tải được danh sách văn bản" subTitle="Kiểm tra kết nối mạng rồi tải lại trang." />
        ) : (
          <>
            <LibraryFilterBar
              docs={docs}
              filter={filter}
              onChange={changeFilter}
              resultCount={visibleDocs.length}
              size="large"
            />
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
                {shownDocs.map((d, i) => {
                  const month = dayjs(d.createdAt).format('MM/YYYY');
                  const newMonth = groupByMonth && (i === 0 || dayjs(shownDocs[i - 1].createdAt).format('MM/YYYY') !== month);
                  return (
                    <Fragment key={d.id}>
                      {newMonth && (
                        <Typography.Text type="secondary" strong style={{ display: 'block', fontSize: 13, marginTop: i === 0 ? 0 : 6 }}>
                          Tháng {month}
                        </Typography.Text>
                      )}
                      <PublicDocCard doc={d} />
                    </Fragment>
                  );
                })}
                {visibleDocs.length > shownDocs.length && (
                  <Button block size="large" icon={<DownOutlined />} onClick={() => setLimit(limit + PAGE_SIZE)}>
                    Xem thêm ({visibleDocs.length - shownDocs.length} văn bản)
                  </Button>
                )}
              </Space>
            )}
          </>
        )}
      </Space>
    </PageShell>
  );
}
