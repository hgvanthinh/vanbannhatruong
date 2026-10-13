import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { DocAttachment, LibraryDoc, LibraryDocFormValues } from '../types';
import { deleteStoredFilesOf } from './uploadService';

/** Khớp vbValidAttachments() trong firestore.rules — sửa thì sửa cả 2 nơi. */
export const MAX_ATTACHMENTS = 10;

/** Bỏ dòng trống link; dòng thiếu tên thì đặt "Phụ lục n". Luôn ghi mảng (kể cả rỗng) để sửa mà xoá hết phụ lục thì mất thật. */
function cleanAttachments(list: DocAttachment[] | undefined): DocAttachment[] {
  return (list ?? [])
    .filter((a) => a?.url?.trim())
    .slice(0, MAX_ATTACHMENTS)
    .map((a, i) => ({ name: a.name?.trim() || `Phụ lục ${i + 1}`, url: a.url.trim() }));
}

function docsCollection(slug: string) {
  return collection(db, 'vbSchools', slug, 'docs');
}

export async function listDocs(slug: string): Promise<LibraryDoc[]> {
  const snap = await getDocs(query(docsCollection(slug), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LibraryDoc));
}

export async function getLibraryDoc(slug: string, docId: string): Promise<LibraryDoc | null> {
  const snap = await getDoc(doc(docsCollection(slug), docId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as LibraryDoc) : null;
}

export async function createLibraryDoc(slug: string, uid: string, values: LibraryDocFormValues): Promise<void> {
  const now = Date.now();
  await setDoc(doc(docsCollection(slug)), {
    title: values.title.trim(),
    docForm: values.docForm,
    category: values.category,
    driveUrl: values.driveUrl.trim(),
    attachments: cleanAttachments(values.attachments),
    createdAt: now,
    createdBy: uid,
    updatedAt: now,
  });
}

export async function updateLibraryDoc(slug: string, docId: string, values: LibraryDocFormValues): Promise<void> {
  await updateDoc(doc(docsCollection(slug), docId), {
    title: values.title.trim(),
    docForm: values.docForm,
    category: values.category,
    driveUrl: values.driveUrl.trim(),
    attachments: cleanAttachments(values.attachments),
    updatedAt: Date.now(),
  });
}

export async function deleteLibraryDoc(slug: string, libraryDoc: LibraryDoc): Promise<void> {
  await deleteDoc(doc(docsCollection(slug), libraryDoc.id));
  await deleteStoredFilesOf(libraryDoc);
}
