import { App as AntdApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { AdminPage } from './pages/AdminPage';
import { ClassDirectoryPage } from './pages/ClassDirectoryPage';
import { ClassPublicPage } from './pages/ClassPublicPage';
import { ClassQrPrintPage } from './pages/ClassQrPrintPage';
import { DocRedirectPage } from './pages/DocRedirectPage';
import { HomePage } from './pages/HomePage';
import { ManagePage } from './pages/ManagePage';
import { PrintListPage } from './pages/PrintListPage';
import { PublicSchoolPage } from './pages/PublicSchoolPage';
import { SchoolPickerPage } from './pages/SchoolPickerPage';

// Lịch chọn ngày (DatePicker) hiện thứ/tháng tiếng Việt.
dayjs.locale('vi');

export default function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          borderRadius: 10,
          // Vùng chạm ~44px cho điện thoại (GV xem bằng điện thoại là chính).
          controlHeight: 40,
        },
      }}
    >
      <AntdApp>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Công khai — không cần đăng nhập */}
              <Route path="/" element={<HomePage />} />
              <Route path="/chon-truong" element={<SchoolPickerPage />} />
              <Route path="/truong/:slug" element={<PublicSchoolPage />} />
              <Route path="/truong/:slug/in" element={<PrintListPage />} />
              <Route path="/vb/:slug/:docId" element={<DocRedirectPage />} />
              {/* Danh sách lớp — chỉ ai có link (QR cửa lớp) mới mở được */}
              <Route path="/lop/:slug/:classId" element={<ClassPublicPage />} />
              <Route path="/ds-lop/:slug/:dirId" element={<ClassDirectoryPage />} />
              {/* Nhà trường + quản trị — đăng nhập Google */}
              <Route path="/quan-ly" element={<ManagePage />} />
              <Route path="/quan-ly/in-qr-lop/:slug" element={<ClassQrPrintPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
