import { useCallback, useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Select, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import { EDITOR_ROLE_OPTIONS, type EditorRole } from '../constants/editorRoles';
import { SCHOOL_LEVELS } from '../constants/schoolLevels';
import { MAX_EDITORS_PER_SCHOOL } from '../constants/site';
import {
  addSchoolEditor,
  deleteSchool,
  getSchoolEditors,
  removeSchoolEditor,
  setSchoolEditorRole,
  updateSchoolInfo,
} from '../services/schoolService';
import { isValidEmail } from '../utils/text';
import type { School, SchoolEditor, SchoolFormValues } from '../types';

interface SchoolSettingsProps {
  school: School;
  myEmail: string;
  /** Sau khi sửa thông tin / xoá trường / tự rời trường — trang cha tải lại danh sách trường. */
  onChanged: () => void;
}

/**
 * Tab "Trường & người quản lý". Mỗi email kèm 1 vai trò (HT, văn thư, phụ trách
 * CNTT...) chỉ để biết ai là ai — mọi email vẫn NGANG QUYỀN nhau: đều đăng văn
 * bản, sửa thông tin trường, thêm/bớt email, đổi vai trò. Đơn giản và đủ dùng
 * khi đổi HT — người mới được thêm vào, người cũ tự rời.
 */
export function SchoolSettings({ school, myEmail, onChanged }: SchoolSettingsProps) {
  const { message, modal } = App.useApp();
  const [infoForm] = Form.useForm<SchoolFormValues>();
  const [savingInfo, setSavingInfo] = useState(false);
  const [editors, setEditors] = useState<SchoolEditor[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<EditorRole | undefined>(undefined);
  const [adding, setAdding] = useState(false);

  const loadEditors = useCallback(async () => {
    try {
      setEditors(await getSchoolEditors(school.slug));
    } catch {
      message.error('Không tải được danh sách người quản lý');
    }
  }, [school.slug, message]);

  useEffect(() => {
    loadEditors();
    infoForm.setFieldsValue({ name: school.name, level: school.level, area: school.area });
  }, [loadEditors, infoForm, school]);

  async function saveInfo(values: SchoolFormValues) {
    setSavingInfo(true);
    try {
      await updateSchoolInfo(school.slug, values);
      message.success('Đã lưu thông tin trường');
      onChanged();
    } catch {
      message.error('Lưu không thành công');
    } finally {
      setSavingInfo(false);
    }
  }

  async function addEditor() {
    const email = newEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      message.warning('Email không hợp lệ');
      return;
    }
    if (editors.some((e) => e.email === email)) {
      message.info('Email này đã có trong danh sách');
      return;
    }
    if (!newRole) {
      message.warning('Chọn vai trò của người được thêm');
      return;
    }
    setAdding(true);
    try {
      await addSchoolEditor(school.slug, email, newRole);
      setNewEmail('');
      setNewRole(undefined);
      message.success(`Đã thêm ${email} — người này đăng nhập Google bằng đúng email đó là quản lý được`);
      loadEditors();
    } catch {
      message.error('Thêm không thành công');
    } finally {
      setAdding(false);
    }
  }

  async function changeRole(email: string, role: EditorRole) {
    setEditors((list) => list.map((e) => (e.email === email ? { ...e, role } : e)));
    try {
      await setSchoolEditorRole(school.slug, email, role);
    } catch {
      message.error('Đổi vai trò không thành công');
      loadEditors();
    }
  }

  function removeEditor(email: string) {
    const isSelf = email === myEmail;
    modal.confirm({
      title: isSelf ? 'Rời khỏi quản lý trường này?' : `Gỡ ${email}?`,
      content: isSelf
        ? 'Bạn sẽ không còn đăng/sửa văn bản của trường này nữa (trừ khi người khác thêm lại).'
        : 'Người này sẽ không còn đăng/sửa văn bản của trường.',
      okText: isSelf ? 'Rời' : 'Gỡ',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await removeSchoolEditor(school.slug, email);
          if (isSelf) onChanged();
          else loadEditors();
        } catch {
          message.error('Không gỡ được, vui lòng thử lại');
        }
      },
    });
  }

  function confirmDeleteSchool() {
    modal.confirm({
      title: `Xoá trường "${school.name}"?`,
      content:
        'Toàn bộ văn bản đã đăng của trường sẽ bị xoá khỏi website, link/QR đã phát ra sẽ ngừng hoạt động. File trên Google Drive KHÔNG bị ảnh hưởng. Không hoàn tác được.',
      okText: 'Xoá trường',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await deleteSchool(school.slug);
          message.success('Đã xoá trường');
          onChanged();
        } catch {
          message.error('Xoá không thành công');
        }
      },
    });
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%', maxWidth: 640 }}>
      <Card title="Thông tin trường" size="small">
        <Form<SchoolFormValues> form={infoForm} layout="vertical" onFinish={saveInfo}>
          <Form.Item
            name="name"
            label="Tên trường"
            rules={[
              { required: true, whitespace: true, message: 'Nhập tên trường' },
              { max: 150, message: 'Tối đa 150 ký tự' },
            ]}
          >
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item name="level" label="Cấp học" rules={[{ required: true }]}>
            <Select options={SCHOOL_LEVELS.map((l) => ({ value: l.value, label: l.label }))} />
          </Form.Item>
          <Form.Item name="area" label="Địa bàn" rules={[{ max: 150, message: 'Tối đa 150 ký tự' }]}>
            <Input maxLength={150} />
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
            Đường dẫn <Typography.Text code>/truong/{school.slug}</Typography.Text> cố định, không đổi được.
          </Typography.Paragraph>
          <Button type="primary" htmlType="submit" loading={savingInfo}>
            Lưu thông tin
          </Button>
        </Form>
      </Card>

      <Card title="Người quản lý (được đăng văn bản)" size="small">
        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
          Uỷ quyền đăng văn bản: thêm email Google của HT, Phó HT, văn thư, phụ trách CNTT... kèm vai trò. Người được thêm
          chỉ cần vào trang Quản lý và đăng nhập Google bằng đúng email đó. Vai trò chỉ để biết ai là ai — mọi người trong
          danh sách có quyền như nhau.
        </Typography.Paragraph>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {editors.map(({ email, role }) => (
            <div
              key={email}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ wordBreak: 'break-all', flex: '1 1 200px' }}>
                {email} {email === myEmail && <Tag color="blue">Bạn</Tag>}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Select<EditorRole>
                  size="small"
                  value={role}
                  placeholder="Chọn vai trò"
                  options={EDITOR_ROLE_OPTIONS}
                  onChange={(v) => changeRole(email, v)}
                  style={{ width: 190 }}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={editors.length <= 1}
                  title={editors.length <= 1 ? 'Trường phải còn ít nhất 1 người quản lý' : undefined}
                  onClick={() => removeEditor(email)}
                >
                  {email === myEmail ? 'Rời' : 'Gỡ'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <Input
            placeholder="email@gmail.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onPressEnter={addEditor}
            disabled={editors.length >= MAX_EDITORS_PER_SCHOOL}
            style={{ flex: '1 1 220px' }}
          />
          <Select<EditorRole>
            value={newRole}
            placeholder="Vai trò"
            options={EDITOR_ROLE_OPTIONS}
            onChange={setNewRole}
            disabled={editors.length >= MAX_EDITORS_PER_SCHOOL}
            style={{ flex: '1 1 180px' }}
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            loading={adding}
            onClick={addEditor}
            disabled={editors.length >= MAX_EDITORS_PER_SCHOOL}
          >
            Thêm
          </Button>
        </div>
      </Card>

      <Card title="Xoá trường" size="small">
        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
          Chỉ dùng khi đăng ký nhầm hoặc trường ngừng sử dụng website.
        </Typography.Paragraph>
        <Button danger onClick={confirmDeleteSchool}>
          Xoá trường này
        </Button>
      </Card>
    </Space>
  );
}
