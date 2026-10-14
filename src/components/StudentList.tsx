import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { Student } from '../types';

export interface StudentRow extends Student {
  /** STT trong lớp (giữ nguyên khi lọc để khớp danh sách giấy). */
  no: number;
  /** Có thì hiện nhãn lớp cạnh tên — dùng khi tìm trên cả trường. */
  className?: string;
  key: string;
}

/** Danh sách học sinh cho điện thoại: STT tròn | họ tên đậm, ngày sinh, địa chỉ. */
export function StudentList({ rows, emptyText }: { rows: StudentRow[]; emptyText: string }) {
  return (
    <ol className="student-list">
      {rows.map((s) => (
        <li key={s.key} className="student-item">
          <span className="student-no">{s.no}</span>
          <div className="student-body">
            <div className="student-name">
              {s.name}
              {s.className && <span className="student-class">Lớp {s.className}</span>}
            </div>
            {s.dob && (
              <div className="student-meta">
                <CalendarOutlined /> {s.dob}
              </div>
            )}
            {s.address && (
              <div className="student-meta">
                <EnvironmentOutlined /> <span>{s.address}</span>
              </div>
            )}
          </div>
        </li>
      ))}
      {rows.length === 0 && <li className="student-empty">{emptyText}</li>}
    </ol>
  );
}
