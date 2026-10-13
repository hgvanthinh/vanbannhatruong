# Văn bản nhà trường

## 🔔 VIỆC CÒN DỞ — Claude: NHẮC USER NGAY ĐẦU PHIÊN

> Ở câu trả lời đầu tiên của mỗi phiên, tóm tắt ngắn các mục chưa tick bên dưới cho user (kể cả khi user hỏi việc khác), rồi mới làm việc được yêu cầu. Mục nào user báo đã xong → tick `[x]` hoặc xoá dòng đó. Hết mục thì xoá cả phần này.
> Bối cảnh: dự án dựng ngày 13/10/2026 từ tính năng "Kho văn bản" của repo `danh-gia-giao-vien`, theo yêu cầu làm thành website riêng.

**Bắt buộc trước khi dùng thật:**
- [ ] **Rules CHƯA deploy.** User mở Firebase Console → Firestore → Rules của `bieu-quyet-c964c`, so với khối app Biểu quyết trong `firestore.rules` (3 match: `meeting_documents/.../documents`, `meeting_documents/.../activity_logs`, `delegate_accounts`). Chưa kiểm được tự động vì đọc rules đang chạy phải dùng token đăng nhập của CLI.
  - Khớp → `npm run deploy:rules` (đã có `check:rules` chạy trước).
  - Không khớp → gộp phần trên Console vào khối Biểu quyết, copy sang `../bieu-quyet-hoi-nghi/`, rồi mới deploy.
  - File `../bieu-quyet-hoi-nghi/firestore.rules` ĐÃ được ghi đè bằng bản mới (khớp repo này). Bản gốc 22 dòng = đúng khối "Biểu quyết" trong file hiện tại (bỏ header comment + khối `vb`) — cần khôi phục thì cắt lại từ đó.
- [ ] **Bật đăng nhập Google:** Console → Authentication → Sign-in method → Google.
- [ ] **Khi đưa lên tên miền riêng:** thêm domain vào Authentication → Settings → Authorized domains (thiếu thì nút đăng nhập Google lỗi). Hosting do user tự lo — có sẵn `vercel.json` + `public/_redirects` cho SPA. KHÔNG dùng Firebase Hosting site mặc định (của app Biểu quyết).

**Nên làm:**
- [ ] Chưa chạy thử lần nào (chỉ typecheck + dry-run rules). Sau khi deploy rules, thử theo thứ tự:
  1. `/quan-ly` đăng nhập → đăng ký trường → đăng 2–3 văn bản khác loại/hình thức → sửa/xoá.
  2. Thêm 1 email khác vào tab "Trường & người quản lý" → đăng nhập email đó thấy đúng trường.
  3. Cửa sổ ẩn danh: `/` chọn trường → tải lại `/` phải vào thẳng trường đó; lọc + tìm không dấu; nút Tải xuống (thử file .docx tải lên Drive, Google Docs gốc, PDF).
  4. Quét QR 1 văn bản bằng điện thoại → mở Drive; xoá văn bản đó → QR báo "đã bị gỡ".
  5. `/admin` bằng `thaygiaotin1990@gmail.com`.
- [ ] **Điểm chưa chắc chắn:** rule đọc `vbSchoolEditors` (`vbEmail() in resource.data.emails`) dùng cho query `array-contains` ở `listMySchools()`. Nếu `/quan-ly` báo "Không tải được danh sách trường" (permission-denied) thì đây là chỗ cần sửa — phương án dự phòng: thêm doc chỉ mục ngược theo email.

**Đã chốt với user (đừng hỏi lại):** HT tự đăng ký trường (không qua Admin duyệt); nhiều email/trường, ngang quyền; user tự lo hosting; rules đồng bộ 2 repo rồi deploy; loại + hình thức là danh sách cố định, hình thức mặc định "Kế hoạch".

---

Website kho văn bản cho các trường học. Người quản lý trường (HT, Phó HT, văn thư) đăng nhập Google để đăng văn bản = **tên + hình thức + loại + link Google Drive** (không dùng Storage). Giáo viên xem **công khai, không đăng nhập**: chọn trường lần đầu (nhớ bằng localStorage), lọc theo Loại/Hình thức, tìm không dấu, mở xem hoặc tải xuống. Mỗi văn bản và mỗi trường có QR.

Stack: React 19 + Vite + TypeScript + Ant Design v6 + Firebase (Auth Google + Firestore). Typecheck: `npm run typecheck`. Không có test suite.

## ⚠️ Project Firebase DÙNG CHUNG với app Biểu quyết hội nghị

Project `bieu-quyet-c964c` đồng thời phục vụ `E:\Website\bieu-quyet-hoi-nghi` (Firestore `meeting_documents`, `delegate_accounts` + Realtime Database + **Hosting site mặc định**).

- `firestore.rules` phải **GIỐNG HỆT** ở cả 2 repo. Sửa ở đây → copy nguyên file sang `../bieu-quyet-hoi-nghi/` trong cùng lượt → `npm run check:rules` → `npm run deploy:rules`. Deploy lệch sẽ xoá rules của app kia. Không sửa khối rules của app Biểu quyết.
- `bieu-quyet-hoi-nghi` KHÔNG phải repo git — trước khi ghi đè file bên đó, sao lưu bản cũ.
- `firebase.json` ở đây CHỈ có `firestore.rules` — cố ý không khai báo `hosting`/`database` để `firebase deploy` từ repo này không bao giờ đè site/RTDB rules của app Biểu quyết. Website này tự host nơi khác (có sẵn `vercel.json` và `public/_redirects` cho SPA).
- Mọi collection của app này có tiền tố `vb`.

## Dữ liệu

| Collection | Doc ID | Ghi chú |
|---|---|---|
| `vbSchools/{slug}` | slug = đường dẫn `/truong/{slug}`, KHÔNG đổi được | `name, level, area, createdBy, createdAt, updatedAt`. Đọc công khai. Không chứa email |
| `vbSchools/{slug}/docs/{id}` | auto | `title, docForm, category, driveUrl, createdAt, createdBy, updatedAt`. Đọc công khai |
| `vbSchoolEditors/{slug}` | slug | `emails[]` (lowercase) — ai trong danh sách thì quản lý trường, NGANG QUYỀN nhau, luôn ≥1. Không công khai |

- HT **tự đăng ký** trường: `registerSchool()` ghi `vbSchools` + `vbSchoolEditors` trong 1 batch (rules kiểm chéo bằng `getAfter`). Slug là doc ID nên không trùng; set lên slug có sẵn = update → người lạ bị chặn.
- "Trường của tôi" = query `vbSchoolEditors where emails array-contains email`.
- Admin toàn hệ thống (dọn trường rác): `ADMIN_EMAILS` trong `src/constants/site.ts` **và** `vbIsAdmin()` trong rules — sửa cả 2 nơi.
- Loại (`DOC_CATEGORIES`), Hình thức (`DOC_FORMS`, mặc định Kế hoạch), Cấp học (`SCHOOL_LEVELS`) là danh sách cố định trong `src/constants/` — rules không liệt kê cứng. Không đổi `value` đã dùng.
- QR từng văn bản trỏ link trung gian `/vb/{slug}/{docId}` (đọc doc rồi `location.replace` sang Drive) để sửa link/gỡ văn bản thì QR đã in vẫn đúng. Link tải xuống sinh từ link Drive ở `src/utils/driveLinks.ts`.

## Ant Design v6 — tránh prop deprecated

`Space` dùng `orientation` (không `direction`); `Modal` dùng `destroyOnHidden`; `Alert` dùng `title` (không `message`); `Spin` dùng `description` (không `tip`); không dùng `List` (deprecated). Lấy `message`/`modal` qua `App.useApp()`, không import static.
