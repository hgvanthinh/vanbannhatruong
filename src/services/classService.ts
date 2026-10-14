import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import type { ClassDirectory, SchoolClass, Student } from '../types';

/** Khớp vbValidClass() trong firestore.rules — sửa thì sửa cả 2 nơi. */
export const MAX_STUDENTS_PER_CLASS = 150;
export const CLASS_NAME_MAX_LENGTH = 30;
/** Khớp vbValidClassDirectory() trong firestore.rules. */
export const MAX_CLASSES_IN_DIRECTORY = 200;

function classesCollection(slug: string) {
  return collection(db, 'vbSchools', slug, 'classes');
}

function directoryCollection(slug: string) {
  return collection(db, 'vbSchools', slug, 'classDirectory');
}

/** "1A" < "2A" < "10A" (so số tự nhiên, không theo chữ cái). */
export function compareClassNames(a: string, b: string): number {
  return a.localeCompare(b, 'vi', { numeric: true, sensitivity: 'base' });
}

/** So tên lớp khi nhập Excel: "Lớp 1A", "1a", " 1A " cùng là 1 lớp. */
export function classKey(name: string): string {
  return name.trim().replace(/^lớp\s+/i, '').replace(/\s+/g, '').toLowerCase();
}

function cleanStudents(list: Student[]): Student[] {
  return list
    .map((s) => ({ name: s.name?.trim() ?? '', dob: s.dob?.trim() ?? '', address: s.address?.trim() ?? '' }))
    .filter((s) => s.name)
    .slice(0, MAX_STUDENTS_PER_CLASS);
}

/** Chỉ người quản lý gọi được (rules chặn `list` công khai). */
export async function listClasses(slug: string): Promise<SchoolClass[]> {
  const snap = await getDocs(classesCollection(slug));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as SchoolClass)
    .sort((a, b) => compareClassNames(a.name, b.name));
}

/** Công khai cho ai có link (trang /lop/:slug/:classId). */
export async function getSchoolClass(slug: string, classId: string): Promise<SchoolClass | null> {
  const snap = await getDoc(doc(classesCollection(slug), classId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as SchoolClass) : null;
}

export async function createSchoolClass(slug: string, uid: string, name: string, students: Student[]): Promise<void> {
  const now = Date.now();
  await setDoc(doc(classesCollection(slug)), {
    name: name.trim(),
    students: cleanStudents(students),
    createdAt: now,
    createdBy: uid,
    updatedAt: now,
  });
  await syncClassDirectory(slug);
}

/** Giữ nguyên doc ID → QR đã dán cửa lớp vẫn đúng sau khi sửa / nhập lại. */
export async function updateSchoolClass(slug: string, classId: string, name: string, students: Student[]): Promise<void> {
  await updateDoc(doc(classesCollection(slug), classId), {
    name: name.trim(),
    students: cleanStudents(students),
    updatedAt: Date.now(),
  });
  await syncClassDirectory(slug);
}

export async function deleteSchoolClass(slug: string, classId: string): Promise<void> {
  await deleteDoc(doc(classesCollection(slug), classId));
  await syncClassDirectory(slug);
}

/**
 * Nhập từ Excel: lớp đã có (trùng tên theo classKey) thì THAY danh sách học sinh
 * nhưng giữ doc ID (QR cũ vẫn dùng được), lớp mới thì tạo. Lớp không có trong
 * file thì để nguyên.
 */
export async function importClasses(
  slug: string,
  uid: string,
  existing: SchoolClass[],
  incoming: { name: string; students: Student[] }[]
): Promise<void> {
  const byKey = new Map(existing.map((c) => [classKey(c.name), c]));
  const now = Date.now();
  // Mỗi lớp 1 thao tác, ≤ 450/batch như deleteSchool.
  for (let i = 0; i < incoming.length; i += 450) {
    const batch = writeBatch(db);
    for (const c of incoming.slice(i, i + 450)) {
      const old = byKey.get(classKey(c.name));
      if (old) {
        batch.update(doc(classesCollection(slug), old.id), { students: cleanStudents(c.students), updatedAt: now });
      } else {
        batch.set(doc(classesCollection(slug)), {
          name: c.name.trim(),
          students: cleanStudents(c.students),
          createdAt: now,
          createdBy: uid,
          updatedAt: now,
        });
      }
    }
    await batch.commit();
  }
  await syncClassDirectory(slug);
}

/**
 * Danh bạ cả trường (QR chung): vbSchools/{slug}/classDirectory/{dirId} — 1 doc
 * chứa bản sao mọi lớp để trang /ds-lop đọc 1 lần là lọc/tìm được toàn trường.
 * Như từng lớp: `get` công khai, `list` chỉ người quản lý → dirId ngẫu nhiên là
 * mã bí mật. Là BẢN SAO nên mọi hàm sửa lớp ở trên đều gọi sync sau khi ghi.
 */
async function findDirectoryId(slug: string): Promise<string | null> {
  const snap = await getDocs(directoryCollection(slug));
  // Hiếm khi có 2 doc (2 người bấm cùng lúc lần đầu) — luôn chọn cùng 1 doc.
  return snap.docs.map((d) => d.id).sort()[0] ?? null;
}

async function writeDirectory(slug: string, dirId: string): Promise<void> {
  const classes = await listClasses(slug);
  await setDoc(doc(directoryCollection(slug), dirId), {
    classes: classes.slice(0, MAX_CLASSES_IN_DIRECTORY).map((c) => ({ id: c.id, name: c.name, students: c.students })),
    updatedAt: Date.now(),
  });
}

/** Cập nhật bản sao sau khi sửa lớp; trường chưa tạo QR chung thì bỏ qua. */
export async function syncClassDirectory(slug: string): Promise<void> {
  const dirId = await findDirectoryId(slug);
  if (dirId) await writeDirectory(slug, dirId);
}

/** Lấy (hoặc tạo lần đầu) mã QR chung của trường; luôn ghi lại dữ liệu mới nhất. */
export async function ensureClassDirectory(slug: string): Promise<string> {
  const dirId = (await findDirectoryId(slug)) ?? doc(directoryCollection(slug)).id;
  await writeDirectory(slug, dirId);
  return dirId;
}

/** Công khai cho ai có link (trang /ds-lop/:slug/:dirId). */
export async function getClassDirectory(slug: string, dirId: string): Promise<ClassDirectory | null> {
  const snap = await getDoc(doc(directoryCollection(slug), dirId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ClassDirectory) : null;
}
