import { Button, Typography } from 'antd';
import { DownloadOutlined, PaperClipOutlined } from '@ant-design/icons';
import { buildDriveDownloadUrl } from '../utils/driveLinks';
import type { DocAttachment } from '../types';

/**
 * Phụ lục / văn bản kèm theo của 1 văn bản: mỗi dòng = tên (mở xem) + nút tải.
 * `newTab`: trang quản lý mở tab mới; trang công khai mở cùng tab (như văn bản chính).
 */
export function AttachmentList({ attachments, newTab = false }: { attachments: DocAttachment[] | undefined; newTab?: boolean }) {
  if (!attachments?.length) return null;
  const target = newTab ? '_blank' : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {attachments.map((a, i) => {
        const downloadUrl = buildDriveDownloadUrl(a.url);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <PaperClipOutlined style={{ color: '#8c8c8c', flexShrink: 0 }} />
            <Typography.Link
              href={a.url}
              target={target}
              rel="noopener noreferrer"
              style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}
            >
              {a.name}
            </Typography.Link>
            {downloadUrl && (
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                href={downloadUrl}
                rel="noopener noreferrer"
                aria-label={`Tải xuống ${a.name}`}
                style={{ flexShrink: 0 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
