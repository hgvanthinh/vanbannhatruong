import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, App, Button, Card, Result, Select, Space, Spin, Tabs, Typography } from 'antd';
import { GoogleOutlined, LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';
import { PageShell } from '../components/PageShell';
import { RegisterSchoolForm } from '../components/RegisterSchoolForm';
import { SchoolDocsManager } from '../components/SchoolDocsManager';
import { SchoolSettings } from '../components/SchoolSettings';
import { SITE_NAME, isAdminEmail } from '../constants/site';
import { listMySchools } from '../services/schoolService';
import type { School } from '../types';

/** /quan-ly — dành cho người quản lý trường (HT, Phó HT, văn thư): đăng nhập Google. */
export function ManagePage() {
  const { user, loading: authLoading, signIn, signOutUser } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const email = user?.email?.toLowerCase() ?? '';

  const [schools, setSchools] = useState<School[] | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    document.title = `Quản lý - ${SITE_NAME}`;
  }, []);

  const loadSchools = useCallback(
    async (preferSlug?: string) => {
      if (!email) return;
      setLoadError(false);
      try {
        const list = await listMySchools(email);
        setSchools(list);
        setSelectedSlug((current) => {
          const wanted = preferSlug ?? current;
          return list.some((s) => s.slug === wanted) ? (wanted as string) : (list[0]?.slug ?? null);
        });
      } catch {
        setLoadError(true);
      }
    },
    [email]
  );

  useEffect(() => {
    setSchools(null);
    loadSchools();
  }, [loadSchools]);

  async function handleSignIn() {
    try {
      await signIn();
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        message.error('Đăng nhập không thành công. Nếu đang mở trong Zalo/Facebook, hãy mở bằng Chrome hoặc Safari.');
      }
    }
  }

  const headerExtra = user ? (
    <>
      {isAdminEmail(email) && (
        <Button size="small" onClick={() => navigate('/admin')}>
          Admin
        </Button>
      )}
      <Button size="small" icon={<LogoutOutlined />} onClick={() => signOutUser()}>
        Đăng xuất
      </Button>
    </>
  ) : null;

  if (authLoading) {
    return (
      <PageShell maxWidth={1100}>
        <Spin />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell maxWidth={1100}>
        <Card style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Dành cho nhà trường
            </Typography.Title>
            <Typography.Text type="secondary">
              Hiệu trưởng, Phó HT, văn thư đăng nhập để đăng văn bản. Giáo viên xem văn bản không cần đăng nhập.
            </Typography.Text>
            <Button type="primary" size="large" icon={<GoogleOutlined />} onClick={handleSignIn} block>
              Đăng nhập bằng Google
            </Button>
          </Space>
        </Card>
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell maxWidth={1100} headerExtra={headerExtra}>
        <Result
          status="warning"
          title="Không tải được danh sách trường"
          extra={<Button onClick={() => loadSchools()}>Thử lại</Button>}
        />
      </PageShell>
    );
  }

  if (schools === null) {
    return (
      <PageShell maxWidth={1100} headerExtra={headerExtra}>
        <Spin />
      </PageShell>
    );
  }

  if (schools.length === 0 || registering) {
    return (
      <PageShell maxWidth={1100} headerExtra={headerExtra}>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          {schools.length === 0 && (
            <Alert
              type="info"
              showIcon
              title={`Email ${email} chưa quản lý trường nào.`}
              description="Đăng ký trường mới bên dưới, hoặc nhờ người đang quản lý trường thêm email này rồi tải lại trang."
            />
          )}
          <RegisterSchoolForm
            uid={user.uid}
            email={email}
            onCancel={schools.length > 0 ? () => setRegistering(false) : undefined}
            onRegistered={(slug) => {
              setRegistering(false);
              loadSchools(slug);
            }}
          />
        </Space>
      </PageShell>
    );
  }

  const school = schools.find((s) => s.slug === selectedSlug) ?? schools[0];

  return (
    <PageShell maxWidth={1100} headerExtra={headerExtra}>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          {schools.length > 1 ? (
            <Select
              value={school.slug}
              onChange={setSelectedSlug}
              options={schools.map((s) => ({ value: s.slug, label: s.name }))}
              style={{ minWidth: 260 }}
              size="large"
            />
          ) : (
            <Typography.Title level={4} style={{ margin: 0 }}>
              {school.name}
            </Typography.Title>
          )}
          <Button icon={<PlusOutlined />} onClick={() => setRegistering(true)}>
            Đăng ký thêm trường
          </Button>
        </div>

        <Tabs
          // key: đổi trường thì dựng lại 2 tab để nạp dữ liệu của trường mới.
          key={school.slug}
          items={[
            { key: 'docs', label: 'Văn bản', children: <SchoolDocsManager school={school} uid={user.uid} /> },
            {
              key: 'settings',
              label: 'Trường & người quản lý',
              children: <SchoolSettings school={school} myEmail={email} onChanged={() => loadSchools()} />,
            },
          ]}
        />
      </Space>
    </PageShell>
  );
}
