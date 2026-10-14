import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, Checkbox, Col, DatePicker, Empty, Input, QRCode, Result, Row, Select, Skeleton, Space, Typography } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { currentSchoolYear } from '../constants/docTitleSuggestions';
import { buildDocUrl, SITE_NAME } from '../constants/site';
import { listDocs } from '../services/docService';
import { getSchool } from '../services/schoolService';
import { categoryOptions, docFormOptions } from '../utils/docOptions';
import { DOC_SORTS } from '../utils/libraryFilter';
import { filterForPrint, printOptionsFromParams, printOptionsToParams, splitFormAndSummary, type PrintOptions } from '../utils/printList';
import type { LibraryDoc, School } from '../types';

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

const DATE_KEY = 'YYYY-MM-DD';

function schoolYearRange(): [Dayjs, Dayjs] {
  const start = Number(currentSchoolYear().slice(0, 4));
  return [dayjs(`${start}-08-01`), dayjs(`${start + 1}-07-31`)];
}

const DATE_PRESETS: { label: string; value: [Dayjs, Dayjs] }[] = [
  { label: 'Năm học hiện tại', value: schoolYearRange() },
  { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
];

/**
 * In danh sách văn bản (/truong/:slug/in) theo mẫu hồ sơ của trường: STT, ngày
 * đăng, tên loại và trích yếu, liên kết, mã QR. Công khai như kho văn bản —
 * dữ liệu vốn đã công khai. Phần chọn lọc ẩn khi in (class no-print).
 */
export function PrintListPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [options, setOptions] = useState<PrintOptions>(() => printOptionsFromParams(searchParams));
  const [school, setSchool] = useState<School | null>(null);
  const [docs, setDocs] = useState<LibraryDoc[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    setSearchParams(printOptionsToParams(options), { replace: true });
  }, [options, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSchool(slug), listDocs(slug)])
      .then(([s, list]) => {
        if (cancelled) return;
        if (!s) return setState('missing');
        setSchool(s);
        setDocs(list);
        setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Tiêu đề tab = tên tệp gợi ý khi "Lưu dưới dạng PDF".
  useEffect(() => {
    document.title = school ? `${options.title} - ${school.name}` : SITE_NAME;
  }, [school, options.title]);

  const rows = useMemo(() => filterForPrint(docs, options), [docs, options]);
  // Kèm mục tự thêm có trong văn bản + mục đang chọn trên URL (để còn bỏ chọn được).
  const categories = useMemo(() => categoryOptions(docs, options.categories), [docs, options.categories]);
  const docForms = useMemo(() => docFormOptions(docs, options.docForms), [docs, options.docForms]);
  const set = (patch: Partial<PrintOptions>) => setOptions((o) => ({ ...o, ...patch }));
  const columnCount = 3 +(options.showNumber ? 1 : 0) + (options.showQr ? 1 : 0);

  if (state === 'missing' || state === 'error') {
    return (
      <Result
        status={state === 'missing' ? '404' : 'warning'}
        title={state === 'missing' ? 'Không tìm thấy trường' : 'Không tải được danh sách văn bản'}
        extra={<Link to="/chon-truong">Chọn trường</Link>}
      />
    );
  }

  return (
    <div className="print-page">
      <Card size="small" className="no-print" style={{ maxWidth: 1000, margin: '0 auto 16px' }}>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to={`/truong/${slug}`}>
              <ArrowLeftOutlined /> Về kho văn bản
            </Link>
            <Button type="primary" icon={<PrinterOutlined />} disabled={rows.length === 0} onClick={() => window.print()}>
              In / Lưu PDF ({rows.length} văn bản)
            </Button>
          </div>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Typography.Text type="secondary">Tiêu đề hồ sơ</Typography.Text>
              <Input value={options.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder="VD: HỒ SƠ KIỂM TRA NỘI BỘ" />
            </Col>
            <Col xs={24} md={12}>
              <Typography.Text type="secondary">Tìm theo tên (gõ không dấu được)</Typography.Text>
              <Input value={options.keyword} allowClear onChange={(e) => set({ keyword: e.target.value })} placeholder="VD: kiem tra noi bo" />
            </Col>
            <Col xs={24} md={12}>
              <Typography.Text type="secondary">Loại văn bản</Typography.Text>
              <Select
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                placeholder="Tất cả loại"
                value={options.categories}
                onChange={(categories) => set({ categories })}
                options={categories}
              />
            </Col>
            <Col xs={24} md={12}>
              <Typography.Text type="secondary">Hình thức văn bản</Typography.Text>
              <Select
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                placeholder="Tất cả hình thức"
                value={options.docForms}
                onChange={(docForms) => set({ docForms })}
                options={docForms}
              />
            </Col>
            <Col xs={24} md={12}>
              <Typography.Text type="secondary">Ngày đăng (từ – đến)</Typography.Text>
              <DatePicker.RangePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                allowEmpty={[true, true]}
                presets={DATE_PRESETS}
                value={[options.from ? dayjs(options.from) : null, options.to ? dayjs(options.to) : null]}
                onChange={(range) =>
                  set({ from: range?.[0]?.format(DATE_KEY) ?? null, to: range?.[1]?.format(DATE_KEY) ?? null })
                }
              />
            </Col>
            <Col xs={24} md={12}>
              <Typography.Text type="secondary">Sắp xếp</Typography.Text>
              <Select style={{ width: '100%' }} value={options.sort} onChange={(sort) => set({ sort })} options={DOC_SORTS} />
            </Col>
          </Row>
          <Space wrap>
            <Checkbox checked={options.showQr} onChange={(e) => set({ showQr: e.target.checked })}>
              Cột mã QR
            </Checkbox>
            <Checkbox checked={options.showNumber} onChange={(e) => set({ showNumber: e.target.checked })}>
              Cột "Số, ký hiệu" (để trống, ghi tay)
            </Checkbox>
          </Space>
        </Space>
      </Card>

      <div className="print-sheet">
        {state === 'loading' ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : rows.length === 0 ? (
          <Empty description="Không có văn bản nào khớp lựa chọn" />
        ) : (
          <>
            <div className="print-school">{school?.name}</div>
            <table className="print-table">
              <thead>
                <tr>
                  <th colSpan={columnCount} className="print-title">
                    {options.title.toUpperCase()}
                  </th>
                </tr>
                <tr>
                  <th style={{ width: 40 }}>STT</th>
                  {options.showNumber && <th style={{ width: 90 }}>Số, ký hiệu văn bản</th>}
                  <th style={{ width: 86 }}>Ngày đăng</th>
                  <th>Tên loại và trích yếu nội dung</th>
                  {options.showQr && <th style={{ width: 96 }}>Mã QR tra cứu</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => {
                  const { form, summary } = splitFormAndSummary(d);
                  const url = buildDocUrl(slug, d.id);
                  return (
                    <tr key={d.id}>
                      <td style={{ textAlign: 'center' }}>{i + 1}</td>
                      {options.showNumber && <td />}
                      <td style={{ textAlign: 'center' }}>{dayjs(d.createdAt).format('DD/MM/YYYY')}</td>
                      <td>
                        {form ? `${form} – ${summary}` : summary}
                        {!!d.attachments?.length && (
                          <div className="print-attachments">Kèm theo: {d.attachments.map((a) => a.name).join('; ')}</div>
                        )}
                      </td>
                      {options.showQr && (
                        <td style={{ textAlign: 'center' }}>
                          <QRCode value={url} type="svg" size={80} bordered={false} color="#000000" bgColor="#ffffff" errorLevel="M" style={{ margin: '0 auto', padding: 0 }} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
