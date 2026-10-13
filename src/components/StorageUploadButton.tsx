import { useRef, useState } from 'react';
import { App, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';
import { isAdminEmail } from '../constants/site';
import { MAX_UPLOAD_MB, UPLOAD_ENABLED, uploadSchoolFile } from '../services/uploadService';

interface StorageUploadButtonProps {
  slug: string;
  onUploaded: (url: string, file: File) => void;
  label?: string;
}

/** Nút "Tải tệp lên" cạnh ô link — chỉ hiện ở máy dev + tài khoản admin (xem uploadService). */
export function StorageUploadButton({ slug, onUploaded, label = 'Tải tệp lên' }: StorageUploadButtonProps) {
  const { user } = useAuth();
  const { message } = App.useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [percent, setPercent] = useState<number | null>(null);

  if (!UPLOAD_ENABLED || !isAdminEmail(user?.email)) return null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setPercent(0);
    try {
      onUploaded(await uploadSchoolFile(slug, file, setPercent), file);
      message.success(`Đã tải lên: ${file.name}`);
    } catch (e) {
      message.error(e instanceof Error && e.message.startsWith('Tệp quá') ? e.message : 'Tải tệp lên không thành công');
    } finally {
      setPercent(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      <Button
        icon={<UploadOutlined />}
        loading={percent !== null}
        onClick={() => inputRef.current?.click()}
        title={`Tải tệp lên Storage (tối đa ${MAX_UPLOAD_MB} MB) — chỉ hiện ở máy dev`}
      >
        {percent !== null ? `${percent}%` : label}
      </Button>
    </>
  );
}
