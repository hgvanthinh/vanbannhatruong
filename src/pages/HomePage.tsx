import { Navigate } from 'react-router-dom';
import { getLastSchool } from '../utils/lastSchool';
import { SchoolPickerPage } from './SchoolPickerPage';

/** Trang chủ: đã chọn trường lần trước → vào thẳng trường đó; chưa thì chọn trường. */
export function HomePage() {
  const last = getLastSchool();
  return last ? <Navigate to={`/truong/${last}`} replace /> : <SchoolPickerPage />;
}
