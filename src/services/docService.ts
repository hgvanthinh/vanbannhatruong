import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { LibraryDoc, LibraryDocFormValues } from '../types';

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
    updatedAt: Date.now(),
  });
}

export async function deleteLibraryDoc(slug: string, docId: string): Promise<void> {
  await deleteDoc(doc(docsCollection(slug), docId));
}
