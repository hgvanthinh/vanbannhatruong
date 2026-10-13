import { App as AntdApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { AdminPage } from './pages/AdminPage';
import { DocRedirectPage } from './pages/DocRedirectPage';
import { HomePage } from './pages/HomePage';
import { ManagePage } from './pages/ManagePage';
import { PublicSchoolPage } from './pages/PublicSchoolPage';
import { SchoolPickerPage } from './pages/SchoolPickerPage';

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
              <Route path="/vb/:slug/:docId" element={<DocRedirectPage />} />
              {/* Nhà trường + quản trị — đăng nhập Google */}
              <Route path="/quan-ly" element={<ManagePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
