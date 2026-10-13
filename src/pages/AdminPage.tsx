import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { App, Button, Input, Space, Spin, Table, Typography } from 'antd';
import { DeleteOutlined, ExportOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { PageShell } from '../components/PageShell';
import { getEditorRoleLabel } from '../constants/editorRoles';
import { getLevelLabel } from '../constants/schoolLevels';
import { isAdminEmail } from '../constants/site';
import { deleteSchool, getSchoolEditors, listSchools } from '../services/schoolService';
import { normalizeVi } from '../utils/text';
import type { School, SchoolEditor } from '../types';

interface AdminRow extends School {
  editors: SchoolEditor[];
}

function formatEditor({ email, role }: SchoolEditor): string {
  const label = getEditorRoleLabel(role);
  return label ? `${email} (${label})` : email;
}

/**
 * /admin — chỉ email trong ADMIN_EMAILS: xem mọi trường + người quản lý, xoá
 * trường rác/giả (HT tự đăng ký nên ai cũng tạo được trường).
 */
export function AdminPage() {
  const { user, loading } = useAuth();
  const { message, modal } = App.useApp();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [keyword, setKeyword] = useState('');
  const isAdmin = isAdminEmail(user?.email);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const schools = await listSchools();
      const editors = await Promise.all(schools.map((s) => getSchoolEditors(s.slug).catch(() => [])));
      setRows(schools.map((s, i) => ({ ...s, editors: editors[i] })));
    } catch {
      message.error('Không tải được danh sách trường');
    } finally {
      setFetching(false);
    }
  }, [message]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (loading) return <Spin style={{ margin: 40 }} />;
  if (!isAdmin) return <Navigate to="/quan-ly" replace />;

  function confirmDelete(row: AdminRow) {
    modal.confirm({
      title: `Xoá trường "${row.name}"?`,
      content: 'Xoá toàn bộ văn bản đã đăng + danh sách người quản lý. Không hoàn tác được.',
      okText: 'Xoá',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await deleteSchool(row.slug);
          message.success('Đã xoá trường');
          load();
        } catch {
          message.error('Xoá không thành công');
        }
      },
    });
  }

  const kw = normalizeVi(keyword);
  const visible = kw
    ? rows.filter((r) => normalizeVi(`${r.name} ${r.area} ${r.slug} ${r.editors.map(formatEditor).join(' ')}`).includes(kw))
    : rows;

  return (
    <PageShell maxWidth={1200}>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản trị — {rows.length} trường
        </Typography.Title>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo tên trường, địa bàn, đường dẫn, email"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ maxWidth: 420 }}
        />
        <Table<AdminRow>
          rowKey="slug"
          loading={fetching}
          dataSource={visible}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 50, hideOnSinglePage: true }}
          columns={[
            { title: 'Trường', dataIndex: 'name' },
            { title: 'Cấp', dataIndex: 'level', render: (v: string) => getLevelLabel(v) },
            { title: 'Địa bàn', dataIndex: 'area' },
            { title: 'Đường dẫn', dataIndex: 'slug', render: (v: string) => <Typography.Text code>{v}</Typography.Text> },
            {
              title: 'Người quản lý',
              dataIndex: 'editors',
              render: (editors: SchoolEditor[]) => (
                <span style={{ whiteSpace: 'pre-line' }}>{editors.map(formatEditor).join('\n')}</span>
              ),
            },
            {
              title: 'Ngày đăng ký',
              dataIndex: 'createdAt',
              render: (v: number) => dayjs(v).format('DD/MM/YYYY'),
            },
            {
              title: '',
              key: 'actions',
              render: (_, row) => (
                <Space>
                  <Button size="small" icon={<ExportOutlined />} href={`/truong/${row.slug}`} target="_blank">
                    Xem
                  </Button>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(row)}>
                    Xoá
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Space>
    </PageShell>
  );
}
