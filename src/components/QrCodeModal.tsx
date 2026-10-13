import { useRef } from 'react';
import { Button, Flex, QRCode, Typography, App } from 'antd';
import { CopyOutlined, DownloadOutlined, ExportOutlined } from '@ant-design/icons';
import { ResponsiveModal } from './ResponsiveModal';

interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
  /** Dòng chữ in dưới QR (tên văn bản hoặc "Kho văn bản — Trường ..."). */
  caption: string;
  url: string;
  /** Tên file PNG khi tải về (không kèm đuôi). */
  fileName: string;
}

const QR_SIZE = 240;

/**
 * Ghép QR + chú thích lên nền trắng rồi xuất PNG — để HT in/dán lên văn bản
 * giấy mà người quét vẫn biết QR này là của tài liệu nào.
 */
function exportQrPng(qrCanvas: HTMLCanvasElement, caption: string): string {
  // Canvas của QRCode đã nhân theo devicePixelRatio (màn hình retina rộng gấp
  // 2-3 lần QR_SIZE) — chữ/lề cũng phải nhân theo, không thì chữ bé tí.
  const scale = qrCanvas.width / QR_SIZE;
  const padding = 24 * scale;
  const lineHeight = 22 * scale;
  const font = `600 ${16 * scale}px system-ui, sans-serif`;
  const width = qrCanvas.width + padding * 2;

  const out = document.createElement('canvas');
  const ctx = out.getContext('2d');
  if (!ctx) return qrCanvas.toDataURL('image/png');

  // Ngắt dòng chú thích theo bề rộng ảnh (đo trước khi biết chiều cao canvas).
  ctx.font = font;
  const lines: string[] = [];
  let current = '';
  for (const word of caption.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > width - padding * 2 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);

  // Đổi kích thước canvas sẽ reset context → phải set lại font sau đó.
  out.width = width;
  out.height = qrCanvas.height + padding * 2 + lines.length * lineHeight;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(qrCanvas, padding, padding);

  ctx.font = font;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, padding + qrCanvas.height + padding / 2 + i * lineHeight);
  });
  return out.toDataURL('image/png');
}

export function QrCodeModal({ open, onClose, caption, url, fileName }: QrCodeModalProps) {
  const { message } = App.useApp();
  const qrWrapRef = useRef<HTMLDivElement>(null);

  function handleDownload() {
    const canvas = qrWrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = exportQrPng(canvas, caption);
    a.download = `${fileName}.png`;
    a.click();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      message.success('Đã sao chép link');
    } catch {
      message.error('Không sao chép được — hãy chọn và sao chép link thủ công');
    }
  }

  return (
    <ResponsiveModal title="Mã QR" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      <Flex vertical align="center" gap={16}>
        <div ref={qrWrapRef}>
          <QRCode value={url} type="canvas" size={QR_SIZE} bgColor="#ffffff" errorLevel="M" />
        </div>
        <Typography.Text strong style={{ textAlign: 'center' }}>
          {caption}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ wordBreak: 'break-all', textAlign: 'center' }}>
          {url}
        </Typography.Text>
        <Flex gap={8} wrap justify="center">
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
            Tải ảnh QR
          </Button>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            Sao chép link
          </Button>
          <Button icon={<ExportOutlined />} href={url} target="_blank" rel="noopener noreferrer">
            Mở thử
          </Button>
        </Flex>
      </Flex>
    </ResponsiveModal>
  );
}
