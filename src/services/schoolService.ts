import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  FieldPath,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SLUG_MAX_LENGTH } from '../utils/text';
import type { EditorRole } from '../constants/editorRoles';
import type { School, SchoolEditor, SchoolFormValues } from '../types';
import { deleteStoredFilesOf } from './uploadService';

// Tiền tố "vb" để không đụng collection của app Biểu quyết dùng chung project.
const SCHOOLS = 'vbSchools';
const EDITORS = 'vbSchoolEditors';

export class SlugTakenError extends Error {}

function toSchool(id: string, data: Record<string, unknown>): School {
  return { slug: id, ...(data as Omit<School, 'slug'>) };
}

/** Danh sách mọi trường — công khai, cho GV chọn trường. */
export async function listSchools(): Promise<School[]> {
  const snap = await getDocs(query(collection(db, SCHOOLS), orderBy('name')));
  return snap.docs.map((d) => toSchool(d.id, d.data()));
}

export async function getSchool(slug: string): Promise<School | null> {
  const snap = await getDoc(doc(db, SCHOOLS, slug));
  return snap.exists() ? toSchool(snap.id, snap.data()) : null;
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  return !(await getDoc(doc(db, SCHOOLS, slug))).exists();
}

/** Thử base, base-2, base-3... tới khi gặp đường dẫn chưa trường nào dùng. */
export async function findAvailableSlug(base: string): Promise<string> {
  for (let i = 1; i <= 50; i++) {
    const suffix = i === 1 ? '' : `-${i}`;
    const candidate = `${base.slice(0, SLUG_MAX_LENGTH - suffix.length)}${suffix}`;
    if (await isSlugAvailable(candidate)) return candidate;
  }
  return `${base.slice(0, SLUG_MAX_LENGTH - 7)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Các trường mà email này được quản lý (1 người có thể quản lý nhiều trường). */
export async function listMySchools(email: string): Promise<School[]> {
  const snap = await getDocs(
    query(collection(db, EDITORS), where('emails', 'array-contains', email.toLowerCase()))
  );
  const schools = await Promise.all(snap.docs.map((d) => getSchool(d.id)));
  return schools.filter((s): s is School => !!s).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

/**
 * HT tự đăng ký trường: tạo vbSchools/{slug} + vbSchoolEditors/{slug} trong
 * CÙNG 1 batch (rules kiểm chéo 2 doc bằng getAfter). Slug là doc ID nên trùng
 * trường khác thì rules chặn (set lên doc có sẵn = update, người lạ không có quyền).
 */
export async function registerSchool(
  slug: string,
  values: SchoolFormValues,
  uid: string,
  email: string,
  role: EditorRole
): Promise<void> {
  if (!(await isSlugAvailable(slug))) throw new SlugTakenError(slug);
  const now = Date.now();
  const batch = writeBatch(db);
  batch.set(doc(db, SCHOOLS, slug), {
    name: values.name.trim(),
    level: values.level,
    area: values.area?.trim() ?? '',
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
  });
  const myEmail = email.toLowerCase();
  batch.set(doc(db, EDITORS, slug), { emails: [myEmail], roles: { [myEmail]: role }, updatedAt: now });
  try {
    await batch.commit();
  } catch (err) {
    if (!(await isSlugAvailable(slug))) throw new SlugTakenError(slug);
    throw err;
  }
}

export async function updateSchoolInfo(slug: string, values: SchoolFormValues): Promise<void> {
  await updateDoc(doc(db, SCHOOLS, slug), {
    name: values.name.trim(),
    level: values.level,
    area: values.area?.trim() ?? '',
    updatedAt: Date.now(),
  });
}

/**
 * Thứ tự = thứ tự thêm (người đăng ký trường đứng đầu). `roles` là map
 * email → vai trò; ghi bằng FieldPath vì email có dấu chấm.
 */
export async function getSchoolEditors(slug: string): Promise<SchoolEditor[]> {
  const snap = await getDoc(doc(db, EDITORS, slug));
  if (!snap.exists()) return [];
  const data = snap.data();
  const roles = (data.roles as Record<string, EditorRole> | undefined) ?? {};
  return ((data.emails as string[]) ?? []).map((email) => ({ email, role: roles[email] }));
}

export async function addSchoolEditor(slug: string, email: string, role: EditorRole): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await updateDoc(
    doc(db, EDITORS, slug),
    'emails',
    arrayUnion(normalized),
    new FieldPath('roles', normalized),
    role,
    'updatedAt',
    Date.now()
  );
}

export async function setSchoolEditorRole(slug: string, email: string, role: EditorRole): Promise<void> {
  await updateDoc(doc(db, EDITORS, slug), new FieldPath('roles', email), role, 'updatedAt', Date.now());
}

export async function removeSchoolEditor(slug: string, email: string): Promise<void> {
  await updateDoc(
    doc(db, EDITORS, slug),
    'emails',
    arrayRemove(email),
    new FieldPath('roles', email),
    deleteField(),
    'updatedAt',
    Date.now()
  );
}

/**
 * Xoá hẳn 1 trường: mọi văn bản + danh sách lớp + QR chung (theo mẻ ≤ 450 thao tác/batch) rồi tới doc
 * trường + danh sách email. File trên Drive KHÔNG bị ảnh hưởng; tệp tải lên Storage thì xoá theo.
 */
export async function deleteSchool(slug: string): Promise<void> {
  const [docsSnap, classesSnap, directorySnap] = await Promise.all([
    getDocs(collection(db, SCHOOLS, slug, 'docs')),
    getDocs(collection(db, SCHOOLS, slug, 'classes')),
    getDocs(collection(db, SCHOOLS, slug, 'classDirectory')),
  ]);
  const refs = [...docsSnap.docs, ...classesSnap.docs, ...directorySnap.docs].map((d) => d.ref);
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
  const batch = writeBatch(db);
  batch.delete(doc(db, SCHOOLS, slug));
  batch.delete(doc(db, EDITORS, slug));
  await batch.commit();
  await Promise.all(docsSnap.docs.map((d) => deleteStoredFilesOf(d.data())));
}
