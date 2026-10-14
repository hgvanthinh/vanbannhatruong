# Văn bản nhà trường

Website kho văn bản cho các trường học. Người quản lý trường (HT, Phó HT, văn thư) đăng nhập Google để đăng văn bản = **tên + hình thức + loại + link Google Drive** (Storage chỉ dùng cho nút tải tệp ở máy dev — xem mục Storage). Giáo viên xem **công khai, không đăng nhập**: chọn trường lần đầu (nhớ bằng localStorage), lọc theo Loại/Hình thức, tìm không dấu, mở xem hoặc tải xuống. Mỗi văn bản và mỗi trường có QR.

Stack: React 19 + Vite + TypeScript + Ant Design v6 + Firebase (Auth Google + Firestore). Typecheck: `npm run typecheck`. Không có test suite.

Dựng 13/10/2026 từ tính năng "Kho văn bản" của repo `danh-gia-giao-vien`; đã deploy rules và chạy thử đầy đủ cùng ngày.

**Đã chốt với user (đừng hỏi lại):** HT tự đăng ký trường (không qua Admin duyệt); nhiều email/trường, ngang quyền — mỗi email có Vai trò (người đăng ký tự chọn, không mặc định là HT) nhưng vai trò chỉ để hiển thị, không phân quyền; user tự lo hosting; loại + hình thức là danh sách cố định (người quản lý tự thêm mục riêng được), hình thức mặc định "Kế hoạch".

## ⚠️ Project Firebase DÙNG CHUNG với app Biểu quyết hội nghị

Project `bieu-quyet-c964c` đồng thời phục vụ `E:\Website\bieu-quyet-hoi-nghi` (Firestore `meeting_documents`, `delegate_accounts` + Realtime Database + **Hosting site mặc định**).

- `firestore.rules` **và `storage.rules`** phải **GIỐNG HỆT** ở cả 2 repo. Sửa ở đây → copy nguyên file sang `../bieu-quyet-hoi-nghi/` trong cùng lượt → `npm run check:rules` → `npm run deploy:rules` (deploy cả firestore + storage). Deploy lệch sẽ xoá rules của app kia. Không sửa khối rules của app Biểu quyết (Storage: khối `{allPaths=**}` + `documents/`, chép nguyên từ bản đang chạy 13/10/2026 — repo bên kia trước đó không có file storage.rules).
- `bieu-quyet-hoi-nghi` KHÔNG phải repo git — trước khi ghi đè file bên đó, sao lưu bản cũ.
- `firebase.json` ở đây CHỈ có `firestore.rules` + `storage.rules` — cố ý không khai báo `hosting`/`database` để `firebase deploy` từ repo này không bao giờ đè site/RTDB rules của app Biểu quyết. Website này tự host nơi khác (có sẵn `vercel.json` và `public/_redirects` cho SPA).
- Mọi collection của app này có tiền tố `vb`.

## Dữ liệu

| Collection | Doc ID | Ghi chú |
|---|---|---|
| `vbSchools/{slug}` | slug = đường dẫn `/truong/{slug}`, KHÔNG đổi được | `name, level, area, createdBy, createdAt, updatedAt`. Đọc công khai. Không chứa email |
| `vbSchools/{slug}/docs/{id}` | auto | `title, docForm, category, driveUrl, attachments?, createdAt, createdBy, updatedAt`. `attachments` = phụ lục `[{name, url}]` ≤10 (`MAX_ATTACHMENTS` ở `docService.ts` + `vbValidAttachments()` trong rules), doc cũ có thể thiếu. Đọc công khai |
| `vbSchools/{slug}/classes/{id}` | auto (ngẫu nhiên = mã bí mật) | Danh sách lớp: `name` ("6A"), `students: [{name, dob, address}]` ≤150 (`MAX_STUDENTS_PER_CLASS` + `vbValidClass()`), `createdAt, createdBy, updatedAt`. Rules: `get` công khai, `list` CHỈ người quản lý/admin — xem mục Danh sách lớp |
| `vbSchools/{slug}/classDirectory/{id}` | auto (mã bí mật), 1 doc/trường | QR chung cả trường: `classes: [{id, name, students}]` ≤200, `updatedAt` — BẢN SAO của `classes`, `classService` tự `syncClassDirectory()` sau mọi lần tạo/sửa/xoá/nhập lớp. Rules như `classes` (`get` công khai, `list` chỉ quản lý) |
| `vbSchoolEditors/{slug}` | slug | `emails[]` (lowercase) — ai trong danh sách thì quản lý trường, NGANG QUYỀN nhau, luôn ≥1. `roles` = map email → vai trò (`EDITOR_ROLES` trong `src/constants/editorRoles.ts`), ghi bằng `FieldPath` vì email có dấu chấm; rules chỉ kiểm khoá ⊆ `emails`. Doc cũ có thể thiếu `roles`. Không công khai |

- HT **tự đăng ký** trường: `registerSchool()` ghi `vbSchools` + `vbSchoolEditors` trong 1 batch (rules kiểm chéo bằng `getAfter`). Slug là doc ID nên không trùng; set lên slug có sẵn = update → người lạ bị chặn.
- "Trường của tôi" = query `vbSchoolEditors where emails array-contains email`.
- Admin toàn hệ thống (dọn trường rác): `ADMIN_EMAILS` trong `src/constants/site.ts` **và** `vbIsAdmin()` trong rules — sửa cả 2 nơi.
- Loại (`DOC_CATEGORIES`), Hình thức (`DOC_FORMS`, mặc định Kế hoạch), Cấp học (`SCHOOL_LEVELS`) là danh sách cố định trong `src/constants/` — rules không liệt kê cứng. Không đổi `value` đã dùng.
- **Loại / Hình thức tự thêm**: cuối dropdown ở modal Đăng văn bản có ô "Thêm mục mới" (`AddableSelect`). Value = chính tên mục (VD `"Tờ khai"`, ≤50 ký tự, cấm dấu phẩy vì URL trang in dùng `?loai=a,b`), lưu thẳng vào `docForm`/`category` — không có collection riêng, rules không đổi. Danh sách mục tự thêm của trường = value lạ trong các văn bản đã đăng (`src/utils/docOptions.ts`), chèn trước "Khác" ở dropdown, bộ lọc, trang in; mục thêm mà chưa đăng văn bản nào thì mất khi tải lại trang. `getCategoryMeta`/`getDocFormMeta` gặp value lạ thì trả tên = value.
- Gợi ý "Tên tài liệu" khi đăng văn bản: `src/constants/docTitleSuggestions.ts` (`{NH}` = năm học hiện tại, tháng 8 sang năm mới). Chọn gợi ý thì tự đặt Hình thức theo chữ đầu tên + Loại theo gợi ý.
- Trang in danh sách `/truong/{slug}/in` (`PrintListPage` + `src/utils/printList.ts`): lọc nhiều Loại/Hình thức + khoảng ngày ĐĂNG + từ khoá, in/lưu PDF theo mẫu hồ sơ (STT, ngày đăng, tên loại – trích yếu, QR — không có cột link vì in ra giấy). Web không lưu số/ngày ban hành nên cột "Số, ký hiệu" chỉ để trống ghi tay. Nút "In danh sách" ở trang công khai + trang quản lý mang theo bộ lọc đang xem.
- QR từng văn bản trỏ link trung gian `/vb/{slug}/{docId}` (đọc doc rồi `location.replace` sang Drive) để sửa link/gỡ văn bản thì QR đã in vẫn đúng. Link tải xuống sinh từ link Drive ở `src/utils/driveLinks.ts`.

## Danh sách lớp (QR dán cửa lớp)

- Tab "Danh sách lớp" ở /quan-ly (`SchoolClassesManager`): nhập Excel (`src/utils/studentImport.ts`, SheetJS cài từ tarball cdn.sheetjs.com vì bản npm 0.18 có lỗ hổng; nạp động, chunk riêng) hoặc thêm/sửa tay (`ClassFormModal`). Bộ đọc tìm dòng tiêu đề có "Họ và tên", lấy Lớp / Ngày sinh / "Chỗ ở hiện nay" (ô gộp nhiều cột Thôn–Xã–Tỉnh → nối bằng dấu phẩy); **mọi cột khác (CCCD, cha mẹ, SĐT) bị bỏ, không lên server**. Tên viết hoa toàn bộ → Title Case.
- Nhập lại: lớp trùng tên (`classKey`, bỏ "Lớp ", khoảng trắng, hoa/thường) thì THAY danh sách nhưng giữ doc ID → QR đã dán vẫn đúng. Lớp không có trong file để nguyên.
- QR → `/lop/{slug}/{classId}` (`ClassPublicPage`, mobile, tìm không dấu, `noindex`). Danh sách lớp KHÔNG liên kết từ trang công khai của trường — có dữ liệu cá nhân trẻ em, chỉ ai có link mới xem. Đừng thêm danh sách lớp vào trang công khai hay cho `list` công khai.
- **QR cả trường** → `/ds-lop/{slug}/{dirId}` (`ClassDirectoryPage`): lưới lớp theo khối (khối = số đầu tên lớp, không có số → "Khác"), chạm lớp xem danh sách, tìm tên HS toàn trường/khối/lớp. Bộ lọc trên URL `?khoi=&lop=&q=`. Danh bạ tạo lần đầu khi bấm "QR cả trường" (`ensureClassDirectory`); sửa lớp mà quên sync thì trang này hiện dữ liệu cũ.
- In QR hàng loạt: `/quan-ly/in-qr-lop/{slug}` — kèm tuỳ chọn in thêm QR cả trường (`ClassQrPrintPage`, cần đăng nhập), 1/2/4/6 mã mỗi tờ A4.
- Xoá trường thì xoá luôn `classes`.

## Storage — tải tệp thay link Drive (CHỈ máy dev)

- Nút "Tải tệp lên" cạnh ô link (văn bản chính + từng phụ lục) chỉ hiện khi `import.meta.env.DEV` **và** đăng nhập email admin (`StorageUploadButton`, `UPLOAD_ENABLED` ở `src/services/uploadService.ts`). Bản build đưa lên host không có nút — user sợ người khác tải tệp nặng. Đừng bật ở production.
- Tệp lưu `vb/{slug}/{timestamp}_{tên}`, ≤ `MAX_UPLOAD_MB` (25) — khớp khối `vb/` trong `storage.rules` (chỉ admin ghi/xoá, đọc công khai). Download URL lưu thẳng vào `driveUrl`/`attachments[].url` như link Drive, nên rules Firestore không đổi. Không có nút "Tải xuống" cho tệp Storage (`buildDriveDownloadUrl` trả null).
- **Zalo / Facebook (trình duyệt trong app)**: `/view` của Drive và PDF/Office trên Storage đều bị tải xuống luôn → `buildDocViewUrl()` (`src/utils/driveLinks.ts`) đổi link xem: Drive → `/preview`; Storage PDF → Google Docs Viewer, Office → Office Online. Dùng ở trang công khai, phụ lục, QR (`/vb/...`). Trình duyệt thường giữ link gốc.
- Xoá văn bản / xoá trường thì xoá luôn tệp Storage (best-effort, `deleteStoredFilesOf`). `firebase/storage` nạp động, không vào bundle chính.

## Ant Design v6 — tránh prop deprecated

`Space` dùng `orientation` (không `direction`); `Modal` dùng `destroyOnHidden`; `Alert` dùng `title` (không `message`); `Spin` dùng `description` (không `tip`); không dùng `List` (deprecated). Lấy `message`/`modal` qua `App.useApp()`, không import static.
