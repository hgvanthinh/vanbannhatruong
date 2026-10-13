import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Typography } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { SITE_NAME } from '../constants/site';

interface PageShellProps {
  children: ReactNode;
  /** Nội dung góc phải thanh trên cùng (nút đăng nhập, đổi trường...). */
  headerExtra?: ReactNode;
  /** Trang quản lý cần rộng hơn trang xem trên điện thoại. */
  maxWidth?: number;
}

/** Khung chung: thanh tiêu đề mảnh + vùng nội dung canh giữa, lề 16px trên điện thoại. */
export function PageShell({ children, headerExtra, maxWidth = 760 }: PageShellProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)' }}>
      <header style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            maxWidth,
            margin: '0 auto',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Link to="/chon-truong" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', minWidth: 0 }}>
            <FolderOpenOutlined style={{ fontSize: 20, color: '#1677ff' }} />
            <Typography.Text strong style={{ fontSize: 16, whiteSpace: 'nowrap' }}>
              {SITE_NAME}
            </Typography.Text>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{headerExtra}</div>
        </div>
      </header>
      <main style={{ maxWidth, margin: '0 auto', padding: '20px 16px 40px' }}>{children}</main>
    </div>
  );
}
