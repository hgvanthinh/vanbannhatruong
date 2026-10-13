import { app } from '../firebase';

/**
 * Tải tệp thẳng lên Firebase Storage thay cho link Drive — CHỈ ở máy dev
 * (`npm run dev`); bản build đưa lên host không có nút này (sợ người dùng tải
 * tệp nặng). Storage rules chỉ cho admin ghi, nên UI cũng chỉ hiện cho admin.
 * `firebase/storage` nạp động: bản build không kéo SDK Storage vào bundle chính.
 */
export const UPLOAD_ENABLED = import.meta.env.DEV;

/** Khớp giới hạn kích thước trong storage.rules. */
export const MAX_UPLOAD_MB = 25;

/** Tệp do app này tải lên: vb/{slug}/... trên bucket của project. */
export function isStoredFileUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === 'firebasestorage.googleapis.com' && u.pathname.includes('/o/vb%2F');
  } catch {
    return false;
  }
}

/** Trả về link tải công khai (https) — lưu vào `driveUrl`/`attachments[].url` như link Drive. */
export async function uploadSchoolFile(slug: string, file: File, onProgress?: (percent: number) => void): Promise<string> {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`Tệp quá ${MAX_UPLOAD_MB} MB`);
  const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
  // Bỏ ký tự gây rối đường dẫn; tên gốc vẫn giữ trong contentDisposition để khi lưu về đúng tên.
  const safeName = file.name.replace(/[/\\#?[\]*]/g, '_');
  const fileRef = ref(getStorage(app), `vb/${slug}/${Date.now()}_${safeName}`);
  const task = uploadBytesResumable(fileRef, file, {
    contentType: file.type || undefined,
    contentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
  });
  task.on('state_changed', (s) => onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)));
  await task;
  return getDownloadURL(fileRef);
}

/** Xoá mọi tệp Storage của 1 văn bản (văn bản chính + phụ lục) — gọi SAU khi đã xoá doc. */
export async function deleteStoredFilesOf(d: { driveUrl?: string; attachments?: { url: string }[] }): Promise<void> {
  await Promise.all([d.driveUrl, ...(d.attachments ?? []).map((a) => a.url)].filter(Boolean).map((u) => deleteStoredFile(u!)));
}

/** Xoá tệp đã tải lên khi gỡ văn bản. Không chặn việc xoá văn bản: lỗi (VD không phải admin) thì bỏ qua. */
export async function deleteStoredFile(url: string): Promise<void> {
  if (!isStoredFileUrl(url)) return;
  try {
    const { getStorage, ref, deleteObject } = await import('firebase/storage');
    await deleteObject(ref(getStorage(app), url));
  } catch {
    // Tệp mồ côi chỉ tốn chỗ, không ảnh hưởng người xem.
  }
}
