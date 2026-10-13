import { useState } from 'react';
import { Alert, Form, Input, Select } from 'antd';
import { ResponsiveModal } from './ResponsiveModal';
import { DOC_CATEGORIES } from '../constants/docCategories';
import { DEFAULT_DOC_FORM, DOC_FORMS } from '../constants/docForms';
import { isGoogleDriveUrl, isHttpsUrl } from '../utils/text';
import type { LibraryDoc, LibraryDocFormValues } from '../types';

interface DocFormModalProps {
  open: boolean;
  /** Có = sửa văn bản này; null = đăng mới. */
  editing: LibraryDoc | null;
  onCancel: () => void;
  onSubmit: (values: LibraryDocFormValues) => Promise<void>;
}

export function DocFormModal({ open, editing, onCancel, onSubmit }: DocFormModalProps) {
  const [form] = Form.useForm<LibraryDocFormValues>();
  const [loading, setLoading] = useState(false);
  const driveUrl = Form.useWatch('driveUrl', form) ?? '';

  async function handleOk() {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResponsiveModal
      title={editing ? 'Sửa văn bản' : 'Đăng văn bản'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={editing ? 'Lưu' : 'Đăng'}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form
        // key: mở modal cho văn bản khác thì dựng lại form để nạp đúng initialValues.
        key={editing?.id ?? 'new'}
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={
          editing
            ? {
                title: editing.title,
                docForm: editing.docForm,
                category: editing.category,
                driveUrl: editing.driveUrl,
              }
            : { docForm: DEFAULT_DOC_FORM, category: DOC_CATEGORIES[0].value }
        }
      >
        <Form.Item
          name="title"
          label="Tên tài liệu"
          rules={[
            { required: true, whitespace: true, message: 'Nhập tên tài liệu' },
            { max: 200, message: 'Tối đa 200 ký tự' },
          ]}
        >
          <Input placeholder="VD: Kế hoạch năm học 2026-2027" maxLength={200} />
        </Form.Item>

        <Form.Item name="docForm" label="Hình thức văn bản" rules={[{ required: true }]}>
          <Select options={DOC_FORMS.map((f) => ({ value: f.value, label: f.label }))} />
        </Form.Item>

        <Form.Item name="category" label="Loại văn bản" rules={[{ required: true }]}>
          <Select options={DOC_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
        </Form.Item>

        <Form.Item
          name="driveUrl"
          label="Link chia sẻ Google Drive"
          rules={[
            { required: true, whitespace: true, message: 'Dán link chia sẻ từ Drive' },
            {
              validator: (_, value: string | undefined) =>
                !value || isHttpsUrl(value)
                  ? Promise.resolve()
                  : Promise.reject(new Error('Link phải bắt đầu bằng https://')),
            },
          ]}
          extra={
            driveUrl && isHttpsUrl(driveUrl) && !isGoogleDriveUrl(driveUrl)
              ? 'Link này không phải Google Drive — vẫn lưu được, nhưng hãy kiểm tra lại.'
              : undefined
          }
        >
          <Input placeholder="https://drive.google.com/... hoặc https://docs.google.com/..." />
        </Form.Item>
      </Form>

      <Alert
        type="info"
        showIcon
        title='Trên Drive, nhớ chia sẻ file ở chế độ "Bất kỳ ai có đường liên kết" — giáo viên xem không cần đăng nhập nên chỉ mở được file chia sẻ công khai.'
      />
    </ResponsiveModal>
  );
}
