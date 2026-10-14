import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button, Card, QRCode, Result, Segmented, Select, Space, Spin, Typography } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';
import { buildClassUrl, SITE_NAME } from '../constants/site';
import { listClasses } from '../services/classService';
import { getSchool } from '../services/schoolService';
import type { School, SchoolClass } from '../types';

type LoadState = 'loading' | 'ready' | 'error';

/** Số mã QR trên 1 tờ A4 — khớp các lớp .qr-sheet-{n} trong index.css. */
const PER_PAGE_OPTIONS = [1, 2, 4, 6] as const;
type PerPage = (typeof PER_PAGE_OPTIONS)[number];

/**
 * In QR các lớp (/quan-ly/in-qr-lop/:slug) để dán cửa lớp. Cần đăng nhập vì
 * danh sách lớp không công khai (rules chỉ cho người quản lý `list`).
 */
export function ClassQrPrintPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [perPage, setPerPage] = useState<PerPage>(4);
  const [only, setOnly] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([getSchool(slug), listClasses(slug)])
      .then(([s, list]) => {
        if (cancelled) return;
        if (!s) return setState('error');
        setSchool(s);
        setClasses(list);
        setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
    };
  }, [slug, user]);

  useEffect(() => {
    document.title = school ? `QR các lớp - ${school.name}` : SITE_NAME;
  }, [school]);

  const printed = useMemo(() => (only.length ? classes.filter((c) => only.includes(c.id)) : classes), [classes, only]);

  if (authLoading) return <Spin style={{ margin: 40 }} />;
  if (!user) return <Navigate to="/quan-ly" replace />;
  if (state === 'error') {
    return (
      <Result
        status="warning"
        title="Không tải được danh sách lớp"
        subTitle="Chỉ người quản lý của trường mới in được mã QR các lớp."
        extra={<Link to="/quan-ly">Về trang quản lý</Link>}
      />
    );
  }

  return (
    <div className="print-page">
      <Card className="no-print" style={{ maxWidth: 1000, margin: '0 auto 16px' }}>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Link to="/quan-ly">
              <ArrowLeftOutlined /> Quản lý
            </Link>
            <Typography.Text strong>In mã QR dán cửa lớp</Typography.Text>
          </Space>
          <Space wrap align="center">
            <Typography.Text>Số mã mỗi tờ A4:</Typography.Text>
            <Segmented<PerPage> value={perPage} onChange={setPerPage} options={PER_PAGE_OPTIONS.map((n) => ({ value: n, label: String(n) }))} />
          </Space>
          <Select
            mode="multiple"
            allowClear
            placeholder="In tất cả các lớp (hoặc chọn vài lớp)"
            value={only}
            onChange={setOnly}
            options={classes.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
            style={{ width: '100%' }}
          />
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} disabled={printed.length === 0}>
            In {printed.length} mã QR
          </Button>
        </Space>
      </Card>

      {state === 'loading' ? (
        <Spin style={{ display: 'block', margin: 40 }} />
      ) : (
        <div className={`qr-sheet qr-sheet-${perPage}`}>
          {printed.map((c) => (
            <div key={c.id} className="qr-card">
              <div className="qr-card-school">{school?.name}</div>
              <div className="qr-card-class">LỚP {c.name.toUpperCase()}</div>
              <QRCode value={buildClassUrl(slug, c.id)} type="svg" size={240} bordered={false} bgColor="#ffffff" errorLevel="M" />
              <div className="qr-card-hint">Quét mã để xem danh sách lớp ({c.students.length} học sinh)</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
