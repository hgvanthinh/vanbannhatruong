import type { DocCategory } from './constants/docCategories';
import type { DocForm } from './constants/docForms';
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

export interface SchoolFormValues {
  name: string;
  level: SchoolLevel;
  area: string;
}

/** vbSchools/{slug}/docs/{docId} — 1 văn bản; file thật nằm trên Google Drive. */
export interface LibraryDoc {
  id: string;
  title: string;
  docForm: DocForm;
  category: DocCategory;
  driveUrl: string;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
}

export interface LibraryDocFormValues {
  title: string;
  docForm: DocForm;
  category: DocCategory;
  driveUrl: string;
}

export interface LibraryFilter {
  category: DocCategory | 'all';
  docForm: DocForm | 'all';
  keyword: string;
}
