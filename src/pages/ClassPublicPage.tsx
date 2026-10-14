import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Input, Result, Skeleton } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageShell } from '../components/PageShell';
import { SITE_NAME } from '../constants/site';
import { getSchoolClass } from '../services/classService';
import { getSchool } from '../services/schoolService';
import { normalizeVi } from '../utils/text';
import type { School, SchoolClass } from '../types';

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

/**
 * Danh sách 1 lớp (/lop/:slug/:classId) — mở bằng QR dán cửa lớp, không cần
 * đăng nhập. Có dữ liệu cá nhân học sinh nên không cho máy tìm kiếm lập chỉ mục
 * và không liên kết từ trang công khai của trường.
 */
export function ClassPublicPage() {
  const { slug = '', classId = '' } = useParams<{ slug: string; classId: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    Promise.all([getSchool(slug), getSchoolClass(slug, classId)])
      .then(([s, c]) => {
        if (cancelled) return;
        if (!s || !c) return setState('missing');
        setSchool(s);
        setSchoolClass(c);
        setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
    };
  }, [slug, classId]);

  useEffect(() => {
    document.title = schoolClass && school ? `Lớp ${schoolClass.name} - ${school.name}` : SITE_NAME;
  }, [school, schoolClass]);

  // Không cho Google lập chỉ mục trang có tên + ngày sinh + địa chỉ học sinh.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const rows = useMemo(() => {
    const list = (schoolClass?.students ?? []).map((s, i) => ({ ...s, no: i + 1 }));
    const kw = normalizeVi(keyword);
    return kw ? list.filter((s) => normalizeVi(s.name).includes(kw)) : list;
  }, [schoolClass, keyword]);

  if (state === 'missing' || state === 'error') {
    return (
      <PageShell maxWidth={640}>
        <Result
          status={state === 'missing' ? '404' : 'warning'}
          title={state === 'missing' ? 'Không tìm thấy danh sách lớp' : 'Không tải được danh sách lớp'}
          subTitle={state === 'missing' ? 'Lớp này đã bị nhà trường gỡ hoặc mã QR không đúng.' : 'Kiểm tra kết nối mạng rồi quét lại mã QR.'}
        />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth={640}>
      <div className="class-hero">
        {state === 'loading' ? (
          <Skeleton active title={false} paragraph={{ rows: 3 }} />
        ) : (
          <>
            <div className="class-hero-school">{school?.name}</div>
            <h1 className="class-hero-name">Lớp {schoolClass?.name}</h1>
            <div className="class-hero-count">
              <TeamOutlined /> {schoolClass?.students.length} học sinh
            </div>
          </>
        )}
      </div>

      {state === 'ready' && schoolClass && (
        <>
          {schoolClass.students.length > 8 && (
            <div className="class-search">
              <Input
                size="large"
                allowClear
                prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                placeholder="Tìm tên học sinh (gõ không dấu cũng được)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          )}

          <ol className="student-list">
            {rows.map((s) => (
              <li key={s.no} className="student-item">
                <span className="student-no">{s.no}</span>
                <div className="student-body">
                  <div className="student-name">{s.name}</div>
                  {s.dob && (
                    <div className="student-meta">
                      <CalendarOutlined /> {s.dob}
                    </div>
                  )}
                  {s.address && (
                    <div className="student-meta">
                      <EnvironmentOutlined /> <span>{s.address}</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
            {rows.length === 0 && <li className="student-empty">Không có học sinh nào tên “{keyword}”</li>}
          </ol>

          <div className="class-footer">Cập nhật {dayjs(schoolClass.updatedAt).format('DD/MM/YYYY')}</div>
        </>
      )}
    </PageShell>
  );
}
