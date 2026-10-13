/** Cấp học — để GV lọc nhanh danh sách trường lúc chọn trường. */
export const SCHOOL_LEVELS = [
  { value: 'mam-non', label: 'Mầm non' },
  { value: 'tieu-hoc', label: 'Tiểu học' },
  { value: 'thcs', label: 'THCS' },
  { value: 'thpt', label: 'THPT' },
  { value: 'lien-cap', label: 'Liên cấp' },
  { value: 'khac', label: 'Khác' },
] as const;

export type SchoolLevel = (typeof SCHOOL_LEVELS)[number]['value'];

export function getLevelLabel(value: string): string {
  return SCHOOL_LEVELS.find((l) => l.value === value)?.label ?? 'Khác';
}
