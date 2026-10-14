import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Input, Result, Skeleton } from 'antd';
import { ArrowLeftOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageShell } from '../components/PageShell';
import { StudentList, type StudentRow } from '../components/StudentList';
import { SITE_NAME } from '../constants/site';
import { compareClassNames, getClassDirectory } from '../services/classService';
import { getSchool } from '../services/schoolService';
import { normalizeVi } from '../utils/text';
import type { ClassDirectory, School } from '../types';

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

const OTHER_GRADE = 'khac';

/** "6A" → "6", "2 CUỔM" → "2"; tên không bắt đầu bằng số → nhóm "Khác". */
function gradeOf(className: string): string {
  return className.trim().match(/^\d+/)?.[0] ?? OTHER_GRADE;
}

function gradeLabel(grade: string): string {
  return grade === OTHER_GRADE ? 'Khác' : `Khối ${grade}`;
}

/**
 * QR chung cả trường (/ds-lop/:slug/:dirId): mọi lớp, lọc theo khối, chạm vào
 * lớp để xem danh sách, hoặc tìm tên học sinh trên toàn trường. Bộ lọc nằm trên
 * URL (?khoi=&lop=&q=): chọn lớp là 1 bước lịch sử → nút Back quay về lưới lớp.
 */
export function ClassDirectoryPage() {
  const { slug = '', dirId = '' } = useParams<{ slug: string; dirId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [school, setSchool] = useState<School | null>(null);
  const [directory, setDirectory] = useState<ClassDirectory | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  // State là nguồn chính cho ô tìm (gõ Telex mượt), URL chỉ là bản sao.
  const [keyword, setKeyword] = useState(() => searchParams.get('q') ?? '');

  const grade = searchParams.get('khoi') ?? 'all';
  const classId = searchParams.get('lop');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    Promise.all([getSchool(slug), getClassDirectory(slug, dirId)])
      .then(([s, d]) => {
        if (cancelled) return;
        if (!s || !d) return setState('missing');
        setSchool(s);
        setDirectory(d);
        setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
    };
  }, [slug, dirId]);

  useEffect(() => {
    document.title = school ? `Danh sách lớp - ${school.name}` : SITE_NAME;
  }, [school]);

  // Không cho Google lập chỉ mục trang có tên + ngày sinh + địa chỉ học sinh.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  function setParam(key: string, value: string | null, push = false) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      // fromGrid: biết lớp này mở từ lưới trong trang → nút "Tất cả các lớp" chỉ cần lùi lịch sử.
      { replace: !push, state: push ? { fromGrid: true } : location.state }
    );
  }

  function backToGrid() {
    if ((location.state as { fromGrid?: boolean } | null)?.fromGrid) navigate(-1);
    else setParam('lop', null);
  }

  function changeKeyword(value: string) {
    setKeyword(value);
    setParam('q', value.trim() || null);
  }

  const classes = useMemo(
    () => [...(directory?.classes ?? [])].sort((a, b) => compareClassNames(a.name, b.name)),
    [directory]
  );
  const grades = useMemo(() => {
    const list = [...new Set(classes.map((c) => gradeOf(c.name)))];
    return list.sort((a, b) => (a === OTHER_GRADE ? 1 : b === OTHER_GRADE ? -1 : Number(a) - Number(b)));
  }, [classes]);
  const totalStudents = classes.reduce((n, c) => n + c.students.length, 0);

  const selectedClass = classes.find((c) => c.id === classId) ?? null;
  const gradeClasses = grade === 'all' ? classes : classes.filter((c) => gradeOf(c.name) === grade);
  // Đang mở 1 lớp → tìm trong lớp đó; không thì tìm trong khối đang chọn (hoặc cả trường).
  const scope = selectedClass ? [selectedClass] : gradeClasses;
  const kw = normalizeVi(keyword);

  const rows: StudentRow[] = scope.flatMap((c) =>
    c.students
      .map((s, i) => ({ ...s, no: i + 1, key: `${c.id}-${i}`, className: selectedClass ? undefined : c.name }))
      .filter((s) => !kw || normalizeVi(s.name).includes(kw))
  );

  if (state === 'missing' || state === 'error') {
    return (
      <PageShell maxWidth={720}>
        <Result
          status={state === 'missing' ? '404' : 'warning'}
          title={state === 'missing' ? 'Không tìm thấy danh sách lớp' : 'Không tải được danh sách lớp'}
          subTitle={state === 'missing' ? 'Mã QR không đúng hoặc nhà trường đã đổi mã.' : 'Kiểm tra kết nối mạng rồi quét lại mã QR.'}
        />
      </PageShell>
    );
  }

  const scopeLabel = selectedClass ? `lớp ${selectedClass.name}` : grade === 'all' ? 'toàn trường' : gradeLabel(grade).toLowerCase();

  return (
    <PageShell maxWidth={720}>
      <div className="class-hero">
        {state === 'loading' ? (
          <Skeleton active title={false} paragraph={{ rows: 3 }} />
        ) : selectedClass ? (
          <>
            <div className="class-hero-school">{school?.name}</div>
            <h1 className="class-hero-name">Lớp {selectedClass.name}</h1>
            <div className="class-hero-count">
              <TeamOutlined /> {selectedClass.students.length} học sinh
            </div>
          </>
        ) : (
          <>
            <div className="class-hero-school">{school?.name}</div>
            <h1 className="class-hero-name" style={{ fontSize: 28 }}>
              Danh sách học sinh
            </h1>
            <div className="class-hero-count">
              <TeamOutlined /> {classes.length} lớp · {totalStudents} học sinh
            </div>
          </>
        )}
      </div>

      {state === 'ready' && directory && (
        <>
          <div className="class-search">
            <Input
              size="large"
              allowClear
              prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
              placeholder={`Tìm tên học sinh ${scopeLabel}`}
              value={keyword}
              onChange={(e) => changeKeyword(e.target.value)}
            />
            {selectedClass ? (
              <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                style={{ padding: 0, marginTop: 6, height: 'auto' }}
                onClick={backToGrid}
              >
                Tất cả các lớp
              </Button>
            ) : (
              grades.length > 1 && (
                <div className="grade-chips" role="tablist" aria-label="Lọc theo khối">
                  {['all', ...grades].map((g) => (
                    <button
                      key={g}
                      type="button"
                      role="tab"
                      aria-selected={grade === g}
                      className={`grade-chip${grade === g ? ' active' : ''}`}
                      onClick={() => setParam('khoi', g === 'all' ? null : g)}
                    >
                      {g === 'all' ? 'Tất cả' : gradeLabel(g)}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          {selectedClass || kw ? (
            <>
              {kw && (
                <div className="class-result-count">
                  Tìm thấy {rows.length} học sinh {scopeLabel}
                </div>
              )}
              <StudentList rows={rows} emptyText={`Không có học sinh nào tên “${keyword}” ${scopeLabel}`} />
            </>
          ) : (
            (grade === 'all' ? grades : [grade]).map((g) => {
              const list = classes.filter((c) => gradeOf(c.name) === g);
              if (list.length === 0) return null;
              return (
                <section key={g} className="grade-section">
                  {grade === 'all' && grades.length > 1 && <h2 className="grade-title">{gradeLabel(g)}</h2>}
                  <div className="class-tiles">
                    {list.map((c) => (
                      <button key={c.id} type="button" className="class-tile" onClick={() => setParam('lop', c.id, true)}>
                        <span className="class-tile-name">{c.name}</span>
                        <span className="class-tile-count">{c.students.length} học sinh</span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })
          )}

          <div className="class-footer">Cập nhật {dayjs(directory.updatedAt).format('DD/MM/YYYY')}</div>
        </>
      )}
    </PageShell>
  );
}
