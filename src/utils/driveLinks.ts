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
