import { useEffect } from 'react';
import { Button, Form, Input, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { CLASS_NAME_MAX_LENGTH, classKey, MAX_STUDENTS_PER_CLASS } from '../services/classService';
import { ResponsiveModal } from './ResponsiveModal';
import type { SchoolClass, Student } from '../types';

export interface ClassFormValues {
  name: string;
  students: Student[];
}

interface ClassFormModalProps {
  open: boolean;
  /** null = thêm lớp mới. */
  editing: SchoolClass | null;
  existing: SchoolClass[];
  onCancel: () => void;
  onSubmit: (values: ClassFormValues) => Promise<void>;
}

const EMPTY_STUDENT: Student = { name: '', dob: '', address: '' };

/** Thêm / sửa 1 lớp bằng tay: tên lớp + từng học sinh (họ tên, ngày sinh, địa chỉ). */
export function ClassFormModal({ open, editing, existing, onCancel, onSubmit }: ClassFormModalProps) {
  const [form] = Form.useForm<ClassFormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      editing ? { name: editing.name, students: editing.students } : { name: '', students: [{ ...EMPTY_STUDENT }] }
    );
  }, [open, editing, form]);

  async function handleOk() {
    const values = await form.validateFields();
    await onSubmit({ name: values.name, students: values.students ?? [] });
  }

  return (
    <ResponsiveModal
      title={editing ? `Sửa lớp ${editing.name}` : 'Thêm lớp'}
      open={open}
      width={760}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Lưu"
      cancelText="Huỷ"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="name"
          label="Tên lớp"
          rules={[
            { required: true, whitespace: true, message: 'Nhập tên lớp' },
            {
              validator: (_, value: string) =>
                existing.some((c) => c.id !== editing?.id && classKey(c.name) === classKey(value ?? ''))
                  ? Promise.reject(new Error('Đã có lớp này'))
                  : Promise.resolve(),
            },
          ]}
        >
          <Input placeholder="VD: 6A" maxLength={CLASS_NAME_MAX_LENGTH} style={{ maxWidth: 200 }} />
        </Form.Item>

        <Form.List name="students">
          {(fields, { add, remove }) => (
            <>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                Học sinh ({fields.length})
              </Typography.Text>
              {fields.map((field, index) => (
                <div key={field.key} className="class-form-row">
                  <span className="class-form-index">{index + 1}</span>
                  <Form.Item name={[field.name, 'name']} rules={[{ required: true, whitespace: true, message: 'Nhập họ tên' }]} style={{ margin: 0 }}>
                    <Input placeholder="Họ và tên" maxLength={100} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'dob']} style={{ margin: 0 }}>
                    <Input placeholder="Ngày sinh (dd/mm/yyyy)" maxLength={20} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'address']} style={{ margin: 0 }}>
                    <Input placeholder="Địa chỉ" maxLength={200} />
                  </Form.Item>
                  <Button danger type="text" icon={<DeleteOutlined />} aria-label="Xoá học sinh" onClick={() => remove(field.name)} />
                </div>
              ))}
              <Button
                block
                type="dashed"
                icon={<PlusOutlined />}
                disabled={fields.length >= MAX_STUDENTS_PER_CLASS}
                onClick={() => add({ ...EMPTY_STUDENT })}
              >
                Thêm học sinh
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </ResponsiveModal>
  );
}
