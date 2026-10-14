import type { EditorRole } from './constants/editorRoles';
import type { SchoolLevel } from './constants/schoolLevels';

/**
 * vbSchools/{slug} — đọc CÔNG KHAI (GV chọn trường không cần đăng nhập). Không
 * chứa email người quản lý: danh sách email để riêng ở vbSchoolEditors/{slug}
 * (không công khai).
 */
export interface School {
  /** = doc ID, cũng là đường dẫn /truong/{slug}. Không đổi được sau khi tạo. */
  slug: string;
  name: string;
  level: SchoolLevel;
  /** Địa bàn (xã/phường, huyện...) — giúp phân biệt trường trùng tên. Có thể rỗng. */
  area: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

/** 1 người quản lý trường (vbSchoolEditors/{slug}: emails[] + roles{email: role}). */
export interface SchoolEditor {
  email: string;
  /** Chỉ để hiển thị, không phân quyền. Có thể thiếu ở email thêm trước khi có vai trò. */
  role?: EditorRole;
}

export interface SchoolFormValues {
  name: string;
  level: SchoolLevel;
  area: string;
}

/** Phụ lục / văn bản kèm theo của 1 văn bản — cũng chỉ là tên + link Drive. */
export interface DocAttachment {
  name: string;
  url: string;
}

/** vbSchools/{slug}/docs/{docId} — 1 văn bản; file thật nằm trên Google Drive. */
export interface LibraryDoc {
  id: string;
  title: string;
  /** Value trong DOC_FORMS / DOC_CATEGORIES, hoặc tên mục người quản lý tự thêm (utils/docOptions.ts). */
  docForm: string;
  category: string;
  driveUrl: string;
  /** Doc cũ có thể thiếu. Tối đa MAX_ATTACHMENTS (khớp vbValidAttachments() trong rules). */
  attachments?: DocAttachment[];
  createdAt: number;
  createdBy: string;
  updatedAt: number;
}

export interface LibraryDocFormValues {
  title: string;
  docForm: string;
  category: string;
  driveUrl: string;
  attachments?: DocAttachment[];
}

export type DocSort = 'newest' | 'oldest' | 'title';

export interface LibraryFilter {
  category: string | 'all';
  docForm: string | 'all';
  /** Năm học theo ngày đăng, VD "2026-2027". */
  schoolYear: string | 'all';
  keyword: string;
  sort: DocSort;
}

/** 1 học sinh trong danh sách lớp — chỉ 4 thông tin dán cửa lớp, không lưu gì thêm từ file Excel. */
export interface Student {
  name: string;
  /** Chuỗi "dd/mm/yyyy" (giữ nguyên như file nhập), có thể rỗng. */
  dob: string;
  address: string;
}

/**
 * vbSchools/{slug}/classes/{classId} — danh sách 1 lớp. Ai có link (QR dán cửa
 * lớp) thì xem được, nhưng KHÔNG liệt kê công khai: rules chỉ cho `get`, còn
 * `list` dành cho người quản lý → doc ID ngẫu nhiên đóng vai mã bí mật.
 */
export interface SchoolClass {
  id: string;
  /** VD "1A", "9B" — duy nhất trong trường (nhập Excel khớp lớp theo tên). */
  name: string;
  students: Student[];
  createdAt: number;
  createdBy: string;
  updatedAt: number;
}
