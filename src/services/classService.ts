import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import type { SchoolClass, Student } from '../types';

/** Khớp vbValidClass() trong firestore.rules — sửa thì sửa cả 2 nơi. */
export const MAX_STUDENTS_PER_CLASS = 150;
export const CLASS_NAME_MAX_LENGTH = 30;

function classesCollection(slug: string) {
  return collection(db, 'vbSchools', slug, 'classes');
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
}

/** Giữ nguyên doc ID → QR đã dán cửa lớp vẫn đúng sau khi sửa / nhập lại. */
export async function updateSchoolClass(slug: string, classId: string, name: string, students: Student[]): Promise<void> {
  await updateDoc(doc(classesCollection(slug), classId), {
    name: name.trim(),
    students: cleanStudents(students),
    updatedAt: Date.now(),
  });
}

export async function deleteSchoolClass(slug: string, classId: string): Promise<void> {
  await deleteDoc(doc(classesCollection(slug), classId));
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
}
