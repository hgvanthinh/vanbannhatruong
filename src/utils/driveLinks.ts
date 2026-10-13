/**
 * Đổi link chia sẻ Google Drive/Docs thành link TẢI XUỐNG trực tiếp. Trả null
 * khi không tải được bằng link (thư mục Drive, link không phải Google) — UI ẩn
 * nút "Tải xuống".
 *
 * 2 loại file trên Drive tải theo 2 cách khác nhau:
 *  - File tải lên (PDF, ảnh, .docx/.xlsx/...): drive.google.com/uc?export=download.
 *    File Office mở bằng trình soạn Docs có link docs.google.com/... kèm
 *    `rtpof=true` — vẫn là file tải lên, KHÔNG export được, phải dùng uc.
 *  - File Google gốc (Docs/Sheets/Slides): uc không tải được, phải gọi
 *    /export kèm định dạng Office để GV mở được bằng app trên điện thoại.
 */
export function buildDriveDownloadUrl(shareUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(shareUrl.trim());
  } catch {
    return null;
  }

  const ucDownload = (id: string) => `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;

  if (url.hostname === 'drive.google.com') {
    // /file/d/{id}/view, /file/d/{id}/edit...
    const fileMatch = url.pathname.match(/^\/file\/d\/([^/]+)/);
    if (fileMatch) return ucDownload(fileMatch[1]);
    // /open?id={id}, /uc?id={id} — thư mục (/drive/folders/...) không có id ở query nên rơi xuống null.
    const id = url.searchParams.get('id');
    if (id && (url.pathname === '/open' || url.pathname === '/uc')) return ucDownload(id);
    return null;
  }

  if (url.hostname === 'docs.google.com') {
    const match = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
    if (!match) return null;
    const [, kind, id] = match;
    // /document/d/e/{publishId}/pub = bản "Xuất bản lên web", không phải file ID → không export được.
    if (id === 'e') return null;
    if (url.searchParams.get('rtpof') === 'true') return ucDownload(id);

    const base = `https://docs.google.com/${kind}/d/${encodeURIComponent(id)}`;
    if (kind === 'document') return `${base}/export?format=docx`;
    if (kind === 'spreadsheets') return `${base}/export?format=xlsx`;
    return `${base}/export/pptx`;
  }

  return null;
}

/**
 * Trình duyệt nhúng trong app chat (Zalo, Facebook/Messenger, Instagram). Ở đây
 * trang /view của Drive hay không hiển thị được và rơi sang tải tệp luôn.
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Zalo|FBAN|FBAV|FB_IAB|Messenger|Instagram/i.test(navigator.userAgent);
}

/**
 * Đổi link Drive/Docs sang trang /preview (trình xem dạng nhúng, chạy được trong
 * WebView của app). Giữ `resourcekey` của link chia sẻ cũ. Link khác (thư mục,
 * không phải Google) giữ nguyên.
 */
export function buildDrivePreviewUrl(shareUrl: string): string {
  let url: URL;
  try {
    url = new URL(shareUrl.trim());
  } catch {
    return shareUrl;
  }

  const resourceKey = url.searchParams.get('resourcekey');
  const withKey = (base: string) => (resourceKey ? `${base}?resourcekey=${encodeURIComponent(resourceKey)}` : base);
  const filePreview = (id: string) => withKey(`https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`);

  if (url.hostname === 'drive.google.com') {
    const fileMatch = url.pathname.match(/^\/file\/d\/([^/]+)/);
    if (fileMatch) return filePreview(fileMatch[1]);
    const id = url.searchParams.get('id');
    if (id && (url.pathname === '/open' || url.pathname === '/uc')) return filePreview(id);
    return shareUrl;
  }

  if (url.hostname === 'docs.google.com') {
    const match = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
    if (!match) return shareUrl;
    const [, kind, id] = match;
    if (id === 'e') return shareUrl;
    // File Office tải lên (mở bằng trình soạn Docs) xem qua trình xem của Drive.
    if (url.searchParams.get('rtpof') === 'true') return filePreview(id);
    return withKey(`https://docs.google.com/${kind}/d/${encodeURIComponent(id)}/preview`);
  }

  return shareUrl;
}

/** Link "mở xem" cho người xem công khai: trong app chat dùng /preview, ngoài ra giữ link gốc. */
export function buildDocViewUrl(shareUrl: string): string {
  return isInAppBrowser() ? buildDrivePreviewUrl(shareUrl) : shareUrl;
}
