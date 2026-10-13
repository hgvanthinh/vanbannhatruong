import { Modal, Grid } from 'antd';
import type { ModalProps } from 'antd';

/**
 * Modal của antd nhưng ở mobile (< md) thì chiếm gần trọn màn hình, phần thân
 * có vùng cuộn riêng để nút OK/Huỷ luôn nhìn thấy. Desktop giữ nguyên hành vi
 * mặc định (rộng 520px, canh giữa).
 *
 * Dùng thay <Modal> ở mọi form/hộp thoại — API giống hệt, chỉ đổi tên tag.
 */
export function ResponsiveModal({ children, ...props }: ModalProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  if (!isMobile) {
    return <Modal {...props}>{children}</Modal>;
  }

  return (
    <Modal
      {...props}
      width="100%"
      style={{ top: 0, maxWidth: '100%', margin: 0, paddingBottom: 0, ...props.style }}
      styles={(info) => {
        // styles của antd v6 có thể là object hoặc hàm — chuẩn hoá về object
        // rồi mới chèn thêm vùng cuộn cho phần thân.
        const base = typeof props.styles === 'function' ? props.styles(info) : props.styles;
        return {
          ...base,
          body: {
            maxHeight: 'calc(100vh - 150px)',
            overflowY: 'auto',
            ...base?.body,
          },
        };
      }}
    >
      {children}
    </Modal>
  );
}
