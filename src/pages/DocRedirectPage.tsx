import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Result, Spin } from 'antd';
import { getLibraryDoc } from '../services/docService';

type State = { kind: 'loading' } | { kind: 'redirecting'; title: string } | { kind: 'missing' } | { kind: 'error' };

/**
 * Link trung gian của QR từng văn bản (/vb/:slug/:docId): đọc doc rồi chuyển
 * thẳng sang Drive. QR trỏ vào đây thay vì link Drive để HT sửa link / gỡ văn
 * bản thì QR đã in vẫn đúng.
 */
export function DocRedirectPage() {
  const { slug = '', docId = '' } = useParams<{ slug: string; docId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    getLibraryDoc(slug, docId)
      .then((d) => {
        if (!d) {
          setState({ kind: 'missing' });
          return;
        }
        setState({ kind: 'redirecting', title: d.title });
        // replace: Back từ Drive không quay lại trang trung gian này rồi bị đẩy đi tiếp.
        window.location.replace(d.driveUrl);
      })
      .catch(() => setState({ kind: 'error' }));
  }, [slug, docId]);

  const schoolButton = (
    <Button type="primary" onClick={() => navigate(`/truong/${slug}`)}>
      Xem kho văn bản của trường
    </Button>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {state.kind === 'missing' ? (
        <Result status="404" title="Văn bản đã bị gỡ" subTitle="Văn bản này không còn trong kho văn bản của trường." extra={schoolButton} />
      ) : state.kind === 'error' ? (
        <Result status="warning" title="Không mở được văn bản" subTitle="Kiểm tra kết nối mạng rồi quét lại mã QR." extra={schoolButton} />
      ) : (
        <Spin size="large" description={state.kind === 'redirecting' ? `Đang mở: ${state.title}` : 'Đang mở văn bản...'}>
          <div style={{ width: 240, height: 120 }} />
        </Spin>
      )}
    </div>
  );
}
