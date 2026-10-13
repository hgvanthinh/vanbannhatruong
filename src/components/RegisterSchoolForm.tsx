import { useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Select, Typography } from 'antd';
import { SCHOOL_LEVELS } from '../constants/schoolLevels';
import { SlugTakenError, findAvailableSlug, isSlugAvailable, registerSchool } from '../services/schoolService';
import { isValidSlug, sanitizeSlugInput, suggestSlugBase, toSlug, SLUG_MIN_LENGTH } from '../utils/text';
import type { SchoolFormValues } from '../types';

interface RegisterSchoolFormProps {
  uid: string;
  email: string;
  onRegistered: (slug: string) => void;
  /** Có = đang đăng ký THÊM trường (đã quản lý ít nhất 1 trường) → hiện nút huỷ. */
  onCancel?: () => void;
}

interface FormValues extends SchoolFormValues {
  slug: string;
}

/**
 * HT tự đăng ký trường. Đường dẫn (/truong/{slug}) app tự gợi ý từ tên trường
 * khi rời ô Tên — HT không phải nghĩ, muốn đổi thì sửa trước khi bấm Đăng ký
 * (sau khi tạo KHÔNG đổi được vì QR/link đã phát ra).
 */
export function RegisterSchoolForm({ uid, email, onRegistered, onCancel }: RegisterSchoolFormProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  // Người dùng đã tự sửa ô đường dẫn → thôi không ghi đè bằng gợi ý nữa.
  const [slugTouched, setSlugTouched] = useState(false);

  async function suggestSlug() {
    if (slugTouched) return;
    const name = form.getFieldValue('name') as string | undefined;
    if (!name?.trim()) return;
    try {
      form.setFieldValue('slug', await findAvailableSlug(suggestSlugBase(name)));
    } catch {
      form.setFieldValue('slug', suggestSlugBase(name));
    }
  }

  async function handleFinish(values: FormValues) {
    const slug = toSlug(values.slug);
    setSaving(true);
    try {
      await registerSchool(slug, values, uid, email);
      message.success('Đã đăng ký trường');
      onRegistered(slug);
    } catch (err) {
      message.error(
        err instanceof SlugTakenError
          ? `Đường dẫn "${slug}" đã có trường khác dùng, hãy sửa lại`
          : 'Đăng ký không thành công, vui lòng thử lại'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Đăng ký trường" style={{ maxWidth: 560 }}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Nếu trường đã có trên hệ thống, đừng đăng ký lại — hãy nhờ người đang quản lý trường thêm email của bạn."
      />
      <Form<FormValues> form={form} layout="vertical" initialValues={{ level: 'thcs', area: '' }} onFinish={handleFinish}>
        <Form.Item
          name="name"
          label="Tên trường"
          rules={[
            { required: true, whitespace: true, message: 'Nhập tên trường' },
            { max: 150, message: 'Tối đa 150 ký tự' },
          ]}
        >
          <Input placeholder="VD: Trường THCS Nguyễn Trãi" maxLength={150} onBlur={suggestSlug} />
        </Form.Item>
        <Form.Item name="level" label="Cấp học" rules={[{ required: true }]}>
          <Select options={SCHOOL_LEVELS.map((l) => ({ value: l.value, label: l.label }))} />
        </Form.Item>
        <Form.Item
          name="area"
          label="Địa bàn (không bắt buộc)"
          extra="Giúp giáo viên phân biệt khi có trường trùng tên"
          rules={[{ max: 150, message: 'Tối đa 150 ký tự' }]}
        >
          <Input placeholder="VD: Xã Hoài Đức, Hà Nội" maxLength={150} />
        </Form.Item>
        <Form.Item
          name="slug"
          label="Đường dẫn của trường"
          extra={
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              App tự gợi ý theo tên trường. Không đổi được sau khi đăng ký.
            </Typography.Text>
          }
          normalize={(v: string) => sanitizeSlugInput(v ?? '')}
          rules={[
            { required: true, message: 'Nhập đường dẫn' },
            {
              validator: async (_, value: string | undefined) => {
                const slug = toSlug(value ?? '');
                if (!isValidSlug(slug)) throw new Error(`Cần ít nhất ${SLUG_MIN_LENGTH} ký tự chữ/số`);
                if (!(await isSlugAvailable(slug))) throw new Error('Đường dẫn này đã có trường khác dùng');
              },
              validateTrigger: 'onBlur',
            },
          ]}
          validateTrigger={['onChange', 'onBlur']}
        >
          <Input prefix="/truong/" placeholder="thcs-nguyen-trai" maxLength={60} onChange={() => setSlugTouched(true)} />
        </Form.Item>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" htmlType="submit" loading={saving}>
            Đăng ký
          </Button>
          {onCancel && <Button onClick={onCancel}>Huỷ</Button>}
        </div>
      </Form>
    </Card>
  );
}
