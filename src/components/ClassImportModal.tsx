import { useEffect, useMemo, useState } from 'react';
import { Alert, Input, Space, Table, Tag, Typography } from 'antd';
import { classKey } from '../services/classService';
import type { ImportedClass, StudentImportResult } from '../utils/studentImport';
import { ResponsiveModal } from './ResponsiveModal';
import type { SchoolClass } from '../types';

interface ClassImportModalProps {
  /** null = đóng. */
  result: StudentImportResult | null;
  fileName: string;
  existing: SchoolClass[];
  onCancel: () => void;
  onConfirm: (classes: ImportedClass[]) => Promise<void>;
}

/** Xem trước kết quả đọc file Excel: chọn lớp nào lưu, lớp đã có thì thay danh sách (giữ QR). */
export function ClassImportModal({ result, fileName, existing, onCancel, onConfirm }: ClassImportModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  // File không có cột Lớp → cả file là 1 lớp, người nhập gõ tên.
  const [singleName, setSingleName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(result ? result.classes.map((c) => classKey(c.name)) : []);
    setSingleName('');
  }, [result]);

  const existingByKey = useMemo(() => new Map(existing.map((c) => [classKey(c.name), c])), [existing]);

  if (!result) return null;
  const single = result.missingClassColumn;
  const rows = result.classes.map((c) => ({ ...c, key: classKey(c.name) }));
  const total = rows.filter((r) => selected.includes(r.key)).reduce((n, r) => n + r.students.length, 0);

  async function handleOk() {
    if (!result) return;
    const classes = single
      ? [{ ...result.classes[0], name: singleName.trim() }]
      : result.classes.filter((c) => selected.includes(classKey(c.name)));
    setSaving(true);
    try {
      await onConfirm(classes);
    } finally {
      setSaving(false);
    }
  }

  const replacing = single
    ? existingByKey.get(classKey(singleName))
    : null;

  return (
    <ResponsiveModal
      title="Nhập danh sách học sinh"
      open
      width={640}
      onCancel={onCancel}
      onOk={handleOk}
      okText={single ? 'Lưu lớp' : `Lưu ${selected.length} lớp`}
      cancelText="Huỷ"
      confirmLoading={saving}
      okButtonProps={{ disabled: single ? !singleName.trim() : selected.length === 0 }}
      destroyOnHidden
    >
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          Tệp <Typography.Text strong>{fileName}</Typography.Text> — lấy cột:{' '}
          {[result.columns.name, result.columns.className, result.columns.dob, result.columns.address]
            .filter(Boolean)
            .map((c) => `“${c}”`)
            .join(', ')}
          . Các cột khác (căn cước, cha mẹ, điện thoại...) không được lưu.
        </Typography.Text>
        {result.warnings.map((w) => (
          <Alert key={w} type="warning" showIcon title={w} />
        ))}

        {single ? (
          <>
            <Alert type="info" showIcon title={`File không có cột Lớp — ${result.classes[0].students.length} học sinh sẽ vào 1 lớp.`} />
            <Input
              size="large"
              placeholder="Tên lớp, VD: 6A"
              maxLength={30}
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
            />
            {replacing && (
              <Typography.Text type="warning">
                Lớp {replacing.name} đã có {replacing.students.length} học sinh — danh sách cũ sẽ được thay (mã QR giữ nguyên).
              </Typography.Text>
            )}
          </>
        ) : (
          <>
            <Typography.Text>
              Đọc được <b>{rows.length}</b> lớp. Đã chọn {selected.length} lớp, {total} học sinh.
            </Typography.Text>
            <Table
              size="small"
              rowKey="key"
              dataSource={rows}
              pagination={false}
              scroll={{ y: 360 }}
              rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as string[]) }}
              columns={[
                { title: 'Lớp', dataIndex: 'name', render: (v: string) => <b>{v}</b> },
                { title: 'Số HS', key: 'count', width: 70, render: (_, r) => r.students.length },
                {
                  title: 'Trên web',
                  key: 'status',
                  render: (_, r) => {
                    const old = existingByKey.get(r.key);
                    return old ? (
                      <Tag color="orange">Thay danh sách cũ ({old.students.length} HS)</Tag>
                    ) : (
                      <Tag color="green">Lớp mới</Tag>
                    );
                  },
                },
              ]}
            />
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Lớp đã có thì thay toàn bộ danh sách nhưng GIỮ NGUYÊN mã QR đã dán. Lớp không có trong file thì để nguyên.
            </Typography.Text>
          </>
        )}
      </Space>
    </ResponsiveModal>
  );
}
