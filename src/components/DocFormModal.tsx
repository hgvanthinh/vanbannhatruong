import { useMemo, useState } from 'react';
import { Alert, AutoComplete, Button, Col, Form, Input, Row, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { AddableSelect } from './AddableSelect';
import { ResponsiveModal } from './ResponsiveModal';
import { StorageUploadButton } from './StorageUploadButton';
import { DOC_CATEGORIES } from '../constants/docCategories';
import { DOC_FORMS } from '../constants/docForms';
import { getDocTitleSuggestions } from '../constants/docTitleSuggestions';
import { MAX_ATTACHMENTS } from '../services/docService';
import { isStoredFileUrl } from '../services/uploadService';
import { categoryOptions, docFormOptions } from '../utils/docOptions';
import { getLastDocChoice, setLastDocChoice } from '../utils/lastDocChoice';
import { isGoogleDriveUrl, isHttpsUrl, normalizeVi } from '../utils/text';
import type { LibraryDoc, LibraryDocFormValues } from '../types';

const MAX_SUGGESTIONS = 12;

const httpsRule = {
  validator: (_: unknown, value: string | undefined) =>
    !value || isHttpsUrl(value) ? Promise.resolve() : Promise.reject(new Error('Link phải bắt đầu bằng https://')),
};

/** Tên tệp bỏ đuôi — làm tên mặc định khi tải tệp lên mà chưa gõ tên. */
function fileBaseName(file: File): string {
  return file.name.replace(/.[^.]+$/, '').slice(0, 200);
}

interface DocFormModalProps {
  /** Trường đang đăng — thư mục chứa tệp khi tải thẳng lên Storage. */
  slug: string;
  /** Văn bản đã đăng của trường — lấy các Hình thức / Loại người quản lý từng tự thêm. */
  docs: LibraryDoc[];
  open: boolean;
  /** Có = sửa văn bản này; null = đăng mới. */
  editing: LibraryDoc | null;
  onCancel: () => void;
  onSubmit: (values: LibraryDocFormValues) => Promise<void>;
}

export function DocFormModal({ slug, docs, open, editing, onCancel, onSubmit }: DocFormModalProps) {
  const [form] = Form.useForm<LibraryDocFormValues>();
  const [loading, setLoading] = useState(false);
  const driveUrl = Form.useWatch('driveUrl', form) ?? '';
  const title = Form.useWatch('title', form) ?? '';
  // Mục vừa thêm nhưng chưa có văn bản nào dùng — giữ đến khi tải lại trang.
  const [addedForms, setAddedForms] = useState<string[]>([]);
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const formOptions = useMemo(() => docFormOptions(docs, addedForms), [docs, addedForms]);
  const categoryList = useMemo(() => categoryOptions(docs, addedCategories), [docs, addedCategories]);

  // Tính lại mỗi lần mở modal để năm học trong gợi ý luôn đúng.
  const suggestions = useMemo(
    () => getDocTitleSuggestions().map((s) => ({ ...s, search: normalizeVi(s.title) })),
    [open],
  );

  // Gõ không dấu, các từ không cần liền nhau: "kh kiem tra" → "Kế hoạch kiểm tra nội bộ…".
  const titleOptions = useMemo(() => {
    const words = normalizeVi(title).split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    return suggestions
      .filter((s) => s.title !== title && words.every((w) => s.search.includes(w)))
      .slice(0, MAX_SUGGESTIONS)
      .map((s) => ({ value: s.title, label: s.title }));
  }, [title, suggestions]);

  /** Chọn gợi ý → tự đặt Hình thức theo chữ đầu tên (và Loại theo gợi ý). */
  function handleSelectTitle(value: string) {
    const picked = suggestions.find((s) => s.title === value);
    if (!picked) return;
    const docForm = DOC_FORMS.find((f) => picked.search.startsWith(normalizeVi(f.label) + ' '));
    if (docForm) form.setFieldValue('docForm', docForm.value);
    form.setFieldValue('category', picked.category ?? DOC_CATEGORIES[0].value);
  }

  async function handleOk() {
    const values = await form.validateFields();
    if (!editing) setLastDocChoice(values.docForm, values.category);
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
      width={760}
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
                attachments: editing.attachments ?? [],
              }
            : getLastDocChoice()
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
          <AutoComplete
            options={titleOptions}
            onSelect={handleSelectTitle}
            placeholder="Gõ để chọn tên có sẵn, VD: ke hoach nam hoc"
            maxLength={200}
            allowClear
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="docForm" label="Hình thức văn bản" rules={[{ required: true }]}>
              <AddableSelect
                options={formOptions}
                onAdd={(label) => setAddedForms((list) => [...list, label])}
                addPlaceholder="Hình thức khác"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="category" label="Loại văn bản" rules={[{ required: true }]}>
              <AddableSelect
                options={categoryList}
                onAdd={(label) => setAddedCategories((list) => [...list, label])}
                addPlaceholder="Loại khác"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Link chia sẻ Google Drive"
          required
          extra={
            driveUrl && isHttpsUrl(driveUrl) && !isGoogleDriveUrl(driveUrl) && !isStoredFileUrl(driveUrl)
              ? 'Link này không phải Google Drive — vẫn lưu được, nhưng hãy kiểm tra lại.'
              : undefined
          }
        >
          <Space.Compact block>
            <Form.Item
              name="driveUrl"
              noStyle
              rules={[
                { required: true, whitespace: true, message: 'Dán link chia sẻ từ Drive' },
                httpsRule,
              ]}
            >
              <Input placeholder="https://drive.google.com/... hoặc https://docs.google.com/..." />
            </Form.Item>
            <StorageUploadButton
              slug={slug}
              onUploaded={(url, file) => {
                form.setFieldValue('driveUrl', url);
                if (!form.getFieldValue('title')?.trim()) form.setFieldValue('title', fileBaseName(file));
                form.validateFields(['driveUrl']);
              }}
            />
          </Space.Compact>
        </Form.Item>

        <Form.List name="attachments">
          {(fields, { add, remove }) => (
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                Phụ lục / văn bản kèm theo{' '}
                <Typography.Text type="secondary" style={{ fontWeight: 'normal' }}>
                  (không bắt buộc)
                </Typography.Text>
              </Typography.Text>
              {fields.map((field, index) => (
                <Row key={field.key} gutter={8} wrap={false} align="top">
                  <Col flex="1">
                    <Row gutter={8}>
                      <Col xs={24} sm={9}>
                        <Form.Item
                          name={[field.name, 'name']}
                          rules={[{ max: 200, message: 'Tối đa 200 ký tự' }]}
                          style={{ marginBottom: 8 }}
                        >
                          <Input placeholder={`Phụ lục ${index + 1}`} maxLength={200} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={15}>
                        <Form.Item style={{ marginBottom: 8 }}>
                          <Space.Compact block>
                            <Form.Item
                              name={[field.name, 'url']}
                              noStyle
                              rules={[{ required: true, whitespace: true, message: 'Dán link Drive của phụ lục' }, httpsRule]}
                            >
                              <Input placeholder="Link chia sẻ Google Drive" />
                            </Form.Item>
                            <StorageUploadButton
                              slug={slug}
                              label="Tệp"
                              onUploaded={(url, file) => {
                                form.setFieldValue(['attachments', field.name, 'url'], url);
                                if (!form.getFieldValue(['attachments', field.name, 'name'])?.trim())
                                  form.setFieldValue(['attachments', field.name, 'name'], fileBaseName(file));
                                form.validateFields([['attachments', field.name, 'url']]);
                              }}
                            />
                          </Space.Compact>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                  <Col flex="none">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={`Bỏ phụ lục ${index + 1}`}
                      onClick={() => remove(field.name)}
                    />
                  </Col>
                </Row>
              ))}
              {fields.length < MAX_ATTACHMENTS && (
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ name: '', url: '' })}>
                  Thêm phụ lục / văn bản kèm theo
                </Button>
              )}
            </div>
          )}
        </Form.List>
      </Form>

      <Alert
        type="info"
        showIcon
        title='Trên Drive, nhớ chia sẻ file ở chế độ "Bất kỳ ai có đường liên kết" — giáo viên xem không cần đăng nhập nên chỉ mở được file chia sẻ công khai.'
      />
    </ResponsiveModal>
  );
}
