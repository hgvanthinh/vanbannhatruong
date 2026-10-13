import { useMemo, useState } from 'react';
import { Button, Divider, Input, Select, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  MAX_CUSTOM_OPTION_LENGTH,
  cleanOptionLabel,
  findOptionByLabel,
  mergeCustomOptions,
  optionLabelError,
  type DocOption,
} from '../utils/docOptions';

interface AddableSelectProps {
  /** value/onChange do Form.Item truyền vào. */
  value?: string;
  onChange?: (value: string) => void;
  options: DocOption[];
  /** Mục mới vừa gõ — cha giữ lại để còn hiện trong danh sách cho các lần đăng sau. */
  onAdd: (label: string) => void;
  addPlaceholder: string;
}

/**
 * Ô chọn Hình thức / Loại có ô "Thêm mục mới" ở cuối danh sách. Tên mục mới
 * chính là value lưu vào văn bản (xem utils/docOptions.ts). Gõ trùng tên mục
 * đã có (không phân biệt dấu) thì chọn luôn mục đó, không thêm bản sao.
 */
export function AddableSelect({ value, onChange, options, onAdd, addPlaceholder }: AddableSelectProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Value chưa có trong danh sách (VD mục tự thêm nhớ từ lần đăng trước) vẫn hiện đúng tên.
  const allOptions = useMemo(
    () => (value && !options.some((o) => o.value === value) ? mergeCustomOptions(options, [value]) : options),
    [options, value]
  );

  function add() {
    const label = cleanOptionLabel(text);
    const err = optionLabelError(label);
    if (err) {
      setError(err);
      return;
    }
    const existing = findOptionByLabel(allOptions, label);
    if (!existing) onAdd(label);
    onChange?.(existing?.value ?? label);
    setText('');
    setError(null);
    setOpen(false);
  }

  return (
    <Select
      value={value}
      onChange={onChange}
      options={allOptions}
      open={open}
      onOpenChange={setOpen}
      popupRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ padding: '0 8px 4px' }}>
            <Space.Compact block>
              <Input
                placeholder={addPlaceholder}
                value={text}
                maxLength={MAX_CUSTOM_OPTION_LENGTH}
                status={error ? 'error' : undefined}
                onChange={(e) => {
                  setText(e.target.value);
                  setError(null);
                }}
                // Không để phím (Enter, mũi tên, Backspace) lọt ra ô chọn.
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    add();
                  }
                }}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={add}>
                Thêm mục mới
              </Button>
            </Space.Compact>
            {error && (
              <Typography.Text type="danger" style={{ fontSize: 12 }}>
                {error}
              </Typography.Text>
            )}
          </div>
        </>
      )}
    />
  );
}
