import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Cấu hình web của Firebase là thông tin CÔNG KHAI (nằm sẵn trong bundle JS gửi
// cho trình duyệt) — bảo vệ dữ liệu là việc của firestore.rules, không phải giấu key.
// Project "bieu-quyet-c964c" DÙNG CHUNG với app Biểu quyết hội nghị — xem CLAUDE.md.
const firebaseConfig = {
  apiKey: 'AIzaSyCy8G6Jj2sDRLDb8PufZwI2wN8lWEPAI-I',
  authDomain: 'bieu-quyet-c964c.firebaseapp.com',
  projectId: 'bieu-quyet-c964c',
  storageBucket: 'bieu-quyet-c964c.firebasestorage.app',
  messagingSenderId: '859742543265',
  appId: '1:859742543265:web:c0835cbcdce32a25d87fe0',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
