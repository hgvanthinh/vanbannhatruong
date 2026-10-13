// Project Firebase "bieu-quyet-c964c" dùng chung với repo bieu-quyet-hoi-nghi.
// Deploy rules từ 1 repo sẽ GHI ĐÈ TOÀN BỘ rules của project — nên firestore.rules
// phải giống hệt nhau ở cả 2 repo, lệch là chặn deploy.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SIBLING = resolve(import.meta.dirname, '../../bieu-quyet-hoi-nghi');
const FILES = ['firestore.rules'];

if (!existsSync(SIBLING)) {
  console.error(`Không tìm thấy repo dùng chung: ${SIBLING}`);
  process.exit(1);
}

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const mismatched = FILES.filter(
  (file) => read(resolve(import.meta.dirname, '..', file)) !== read(resolve(SIBLING, file)),
);

if (mismatched.length > 0) {
  console.error(`Lệch với ${SIBLING}:\n  - ${mismatched.join('\n  - ')}`);
  console.error('Đồng bộ cả 2 repo trước khi deploy.');
  process.exit(1);
}
console.log('firestore.rules khớp giữa vanbannhatruong và bieu-quyet-hoi-nghi.');
