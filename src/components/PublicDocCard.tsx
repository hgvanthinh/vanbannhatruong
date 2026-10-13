import { Button, Card, Tag, Typography } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getCategoryMeta } from '../constants/docCategories';
import { getDocFormMeta } from '../constants/docForms';
import { buildDocViewUrl, buildDriveDownloadUrl } from '../utils/driveLinks';
import { AttachmentList } from './AttachmentList';
import type { LibraryDoc } from '../types';

/**
 * 1 văn bản trên trang công khai. Vùng chạm lớn = mở xem trên Drive (cùng tab
 * để nút Back quay lại đúng danh sách); nút Tải xuống tách riêng bên phải
 * (không lồng nút trong thẻ <a>).
 */
export function PublicDocCard({ doc }: { doc: LibraryDoc }) {
  const category = getCategoryMeta(doc.category);
  const downloadUrl = buildDriveDownloadUrl(doc.driveUrl);

  return (
    <Card size="small" hoverable styles={{ body: { padding: 14 } }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <a
          href={buildDocViewUrl(doc.driveUrl)}
          rel="noopener noreferrer"
          style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 0, color: 'inherit' }}
        >
          <FileTextOutlined style={{ fontSize: 22, color: '#1677ff', marginTop: 2 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <Typography.Text strong style={{ fontSize: 15, display: 'block', wordBreak: 'break-word' }}>
              {doc.title}
            </Typography.Text>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <Tag style={{ marginInlineEnd: 0 }}>{getDocFormMeta(doc.docForm).label}</Tag>
              <Tag color={category.color} style={{ marginInlineEnd: 0 }}>
                {category.label}
              </Tag>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {dayjs(doc.createdAt).format('DD/MM/YYYY')}
              </Typography.Text>
            </div>
          </div>
        </a>
        {downloadUrl && (
          <Button
            icon={<DownloadOutlined />}
            href={downloadUrl}
            rel="noopener noreferrer"
            aria-label={`Tải xuống ${doc.title}`}
            style={{ flexShrink: 0 }}
          >
            Tải xuống
          </Button>
        )}
      </div>
      {!!doc.attachments?.length && (
        <div style={{ marginTop: 10, paddingTop: 8, paddingLeft: 34, borderTop: '1px dashed #f0f0f0' }}>
          <AttachmentList attachments={doc.attachments} />
        </div>
      )}
    </Card>
  );
}
