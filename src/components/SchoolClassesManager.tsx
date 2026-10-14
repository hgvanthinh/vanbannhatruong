import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, App, Button, Card, Empty, Popconfirm, Skeleton, Space, Typography } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FileExcelOutlined,
  PlusOutlined,
  PrinterOutlined,
  QrcodeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { buildClassDirectoryUrl, buildClassUrl } from '../constants/site';
import {
  createSchoolClass,
  deleteSchoolClass,
  ensureClassDirectory,
  importClasses,
  listClasses,
  updateSchoolClass,
} from '../services/classService';
import { parseStudentFile, StudentImportError, type ImportedClass, type StudentImportResult } from '../utils/studentImport';
import { ClassFormModal, type ClassFormValues } from './ClassFormModal';
import { ClassImportModal } from './ClassImportModal';
import { QrCodeModal } from './QrCodeModal';
import type { School, SchoolClass } from '../types';

interface QrTarget {
  caption: string;
  url: string;
  fileName: string;
}

/**
 * Tab "Danh sách lớp" của trang quản lý: nhập Excel / thêm tay, mỗi lớp 1 QR
 * dán cửa lớp. Danh sách lớp KHÔNG hiện ở trang công khai của trường — chỉ ai
 * quét QR (có link) mới xem được.
 */
export function SchoolClassesManager({ school, uid }: { school: School; uid: string }) {
  const { message } = App.useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(false);
  const [importResult, setImportResult] = useState<StudentImportResult | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [qrTarget, setQrTarget] = useState<QrTarget | null>(null);
  const [openingSchoolQr, setOpeningSchoolQr] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setClasses(await listClasses(school.slug));
    } catch {
      message.error('Không tải được danh sách lớp');
    } finally {
      setLoading(false);
    }
  }, [school.slug, message]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setReading(true);
    try {
      const result = await parseStudentFile(file);
      setImportFileName(file.name);
      setImportResult(result);
    } catch (err) {
      message.error(err instanceof StudentImportError ? err.message : 'Không đọc được file. Hãy lưu lại dạng .xlsx rồi thử lại.');
    } finally {
      setReading(false);
      // Chọn lại đúng file đó lần nữa vẫn kích hoạt onChange.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleImport(list: ImportedClass[]) {
    try {
      await importClasses(school.slug, uid, classes, list);
      message.success(`Đã lưu ${list.length} lớp`);
      setImportResult(null);
      refresh();
    } catch {
      message.error('Lưu không thành công, vui lòng thử lại');
    }
  }

  async function handleSubmit(values: ClassFormValues) {
    try {
      if (editing) {
        await updateSchoolClass(school.slug, editing.id, values.name, values.students);
      } else {
        await createSchoolClass(school.slug, uid, values.name, values.students);
      }
      message.success('Đã lưu lớp');
      setFormOpen(false);
      refresh();
    } catch {
      message.error('Lưu không thành công, vui lòng thử lại');
    }
  }

  async function handleDelete(c: SchoolClass) {
    try {
      await deleteSchoolClass(school.slug, c.id);
      message.success(`Đã xoá lớp ${c.name}`);
      refresh();
    } catch {
      message.error('Xoá không thành công');
    }
  }

  /** QR chung: tạo danh bạ lần đầu (hoặc ghi lại bản mới nhất) rồi hiện mã. */
  async function openSchoolQr() {
    setOpeningSchoolQr(true);
    try {
      const dirId = await ensureClassDirectory(school.slug);
      setQrTarget({
        caption: `Danh sách lớp - ${school.name}`,
        url: buildClassDirectoryUrl(school.slug, dirId),
        fileName: `QR - Danh sach lop - ${school.slug}`,
      });
    } catch {
      message.error('Không tạo được mã QR chung, vui lòng thử lại');
    } finally {
      setOpeningSchoolQr(false);
    }
  }

  function showClassQr(c: SchoolClass) {
    setQrTarget({
      caption: `Lớp ${c.name} - ${school.name}`,
      url: buildClassUrl(school.slug, c.id),
      fileName: `QR - Lop ${c.name}`,
    });
  }

  function openForm(c: SchoolClass | null) {
    setEditing(c);
    setFormOpen(true);
  }

  const totalStudents = classes.reduce((n, c) => n + c.students.length, 0);

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        title="In mã QR từng lớp dán lên cửa lớp — ai quét cũng xem được danh sách, không cần đăng nhập."
        description="“QR cả trường” mở được mọi lớp, lọc theo khối và tìm tên học sinh toàn trường (dán ở phòng hội đồng, bảng tin...). Danh sách lớp không hiện ở trang văn bản công khai; chỉ người quét QR (có link) mới mở được. Nhập lại Excel hoặc sửa lớp thì mã QR đã dán vẫn giữ nguyên."
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Text type="secondary">
          {loading ? 'Đang tải...' : `${classes.length} lớp · ${totalStudents} học sinh`}
        </Typography.Text>
        <Space wrap>
          <Button icon={<TeamOutlined />} loading={openingSchoolQr} onClick={openSchoolQr} disabled={classes.length === 0}>
            QR cả trường
          </Button>
          <Button href={`/quan-ly/in-qr-lop/${school.slug}`} target="_blank" icon={<PrinterOutlined />} disabled={classes.length === 0}>
            In QR các lớp
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => openForm(null)}>
            Thêm lớp
          </Button>
          <Button type="primary" icon={<FileExcelOutlined />} loading={reading} onClick={() => fileInputRef.current?.click()}>
            Nhập từ Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </Space>
      </div>

      {loading ? (
        <Card size="small">
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
      ) : classes.length === 0 ? (
        <Card size="small">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có lớp nào. Bấm “Nhập từ Excel” và chọn file danh sách học sinh toàn trường (có cột Họ và tên, Lớp, Ngày sinh, Chỗ ở / Địa chỉ)."
          />
        </Card>
      ) : (
        <div className="class-grid">
          {classes.map((c) => (
            <Card key={c.id} size="small" styles={{ body: { padding: 14 } }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  Lớp {c.name}
                </Typography.Title>
                <Typography.Text type="secondary">{c.students.length} HS</Typography.Text>
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Cập nhật {dayjs(c.updatedAt).format('DD/MM/YYYY')}
              </Typography.Text>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                <Button icon={<QrcodeOutlined />} onClick={() => showClassQr(c)}>
                  QR
                </Button>
                <Button icon={<ExportOutlined />} href={buildClassUrl(school.slug, c.id)} target="_blank" rel="noopener noreferrer">
                  Xem
                </Button>
                <Button icon={<EditOutlined />} onClick={() => openForm(c)}>
                  Sửa
                </Button>
                <Popconfirm
                  title={`Xoá lớp ${c.name}?`}
                  description="Mã QR đã dán của lớp này sẽ không mở được nữa."
                  okText="Xoá"
                  okButtonProps={{ danger: true }}
                  cancelText="Huỷ"
                  onConfirm={() => handleDelete(c)}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Xoá
                  </Button>
                </Popconfirm>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ClassImportModal
        result={importResult}
        fileName={importFileName}
        existing={classes}
        onCancel={() => setImportResult(null)}
        onConfirm={handleImport}
      />

      <ClassFormModal open={formOpen} editing={editing} existing={classes} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />

      <QrCodeModal
        open={!!qrTarget}
        onClose={() => setQrTarget(null)}
        caption={qrTarget?.caption ?? ''}
        url={qrTarget?.url ?? ''}
        fileName={qrTarget?.fileName ?? 'QR'}
      />
    </Space>
  );
}
