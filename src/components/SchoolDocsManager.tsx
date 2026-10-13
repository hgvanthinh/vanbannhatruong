import { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Empty, Grid, Popconfirm, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, ExportOutlined, PlusOutlined, PrinterOutlined, QrcodeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getCategoryMeta } from '../constants/docCategories';
import { getDocFormMeta } from '../constants/docForms';
import { buildDocUrl, buildSchoolUrl } from '../constants/site';
import { createLibraryDoc, deleteLibraryDoc, listDocs, updateLibraryDoc } from '../services/docService';
import { EMPTY_FILTER, filterDocs, sortDocs } from '../utils/libraryFilter';
import { buildPrintListPath } from '../utils/printList';
import { AttachmentList } from './AttachmentList';
import { DocFormModal } from './DocFormModal';
import { LibraryFilterBar } from './LibraryFilterBar';
import { QrCodeModal } from './QrCodeModal';
import type { LibraryDoc, LibraryDocFormValues, LibraryFilter, School } from '../types';

interface QrTarget {
  caption: string;
  url: string;
  fileName: string;
}

function DocTags({ doc }: { doc: LibraryDoc }) {
  const category = getCategoryMeta(doc.category);
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
      <Tag style={{ marginInlineEnd: 0 }}>{getDocFormMeta(doc.docForm).label}</Tag>
      <Tag color={category.color} style={{ marginInlineEnd: 0 }}>
        {category.label}
      </Tag>
    </span>
  );
}

/** Tab "Văn bản" của trang quản lý: đăng / sửa / xoá văn bản + QR. */
export function SchoolDocsManager({ school, uid }: { school: School; uid: string }) {
  const { message } = App.useApp();
  const isMobile = !Grid.useBreakpoint().md;

  const [docs, setDocs] = useState<LibraryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LibraryFilter>(EMPTY_FILTER);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryDoc | null>(null);
  const [qrTarget, setQrTarget] = useState<QrTarget | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDocs(await listDocs(school.slug));
    } catch {
      message.error('Không tải được danh sách văn bản');
    } finally {
      setLoading(false);
    }
  }, [school.slug, message]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visibleDocs = useMemo(() => sortDocs(filterDocs(docs, filter), filter.sort), [docs, filter]);

  function openForm(record: LibraryDoc | null) {
    setEditing(record);
    setFormOpen(true);
  }

  async function handleSubmit(values: LibraryDocFormValues) {
    try {
      if (editing) {
        await updateLibraryDoc(school.slug, editing.id, values);
        message.success('Đã lưu văn bản');
      } else {
        await createLibraryDoc(school.slug, uid, values);
        message.success('Đã đăng văn bản');
      }
      setFormOpen(false);
      refresh();
    } catch {
      message.error('Lưu không thành công, vui lòng thử lại');
    }
  }

  async function handleDelete(record: LibraryDoc) {
    try {
      await deleteLibraryDoc(school.slug, record);
      message.success('Đã xoá văn bản');
      refresh();
    } catch {
      message.error('Xoá không thành công');
    }
  }

  function renderActions(record: LibraryDoc, block: boolean) {
    return [
      <Button key="open" block={block} icon={<ExportOutlined />} href={record.driveUrl} target="_blank" rel="noopener noreferrer">
        Mở
      </Button>,
      <Button
        key="qr"
        block={block}
        icon={<QrcodeOutlined />}
        onClick={() =>
          setQrTarget({ caption: record.title, url: buildDocUrl(school.slug, record.id), fileName: `QR - ${record.title}` })
        }
      >
        QR
      </Button>,
      <Button key="edit" block={block} icon={<EditOutlined />} onClick={() => openForm(record)}>
        Sửa
      </Button>,
      <Popconfirm
        key="del"
        title="Xoá văn bản này?"
        description="QR đã in của văn bản sẽ báo “đã bị gỡ”. File trên Drive không bị xoá."
        okText="Xoá"
        okButtonProps={{ danger: true }}
        cancelText="Huỷ"
        onConfirm={() => handleDelete(record)}
      >
        <Button block={block} danger icon={<DeleteOutlined />}>
          Xoá
        </Button>
      </Popconfirm>,
    ];
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Text type="secondary">
          Giáo viên xem tại{' '}
          <Typography.Link href={buildSchoolUrl(school.slug)} target="_blank" copyable={{ text: buildSchoolUrl(school.slug) }}>
            {buildSchoolUrl(school.slug)}
          </Typography.Link>
        </Typography.Text>
        <Space wrap>
          <Button
            icon={<QrcodeOutlined />}
            onClick={() =>
              setQrTarget({ caption: `Văn bản - ${school.name}`, url: buildSchoolUrl(school.slug), fileName: `QR - ${school.slug}` })
            }
          >
            QR của trường
          </Button>
          {/* Tab mới: giữ nguyên trang quản lý; mang theo bộ lọc đang xem. */}
          <Button icon={<PrinterOutlined />} href={buildPrintListPath(school.slug, filter)} target="_blank" disabled={docs.length === 0}>
            In danh sách
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm(null)}>
            Đăng văn bản
          </Button>
        </Space>
      </div>

      <LibraryFilterBar docs={docs} filter={filter} onChange={setFilter} resultCount={visibleDocs.length} />

      {isMobile ? (
        loading ? (
          <Card size="small">
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        ) : visibleDocs.length === 0 ? (
          <Card size="small">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={docs.length === 0 ? 'Chưa có văn bản nào' : 'Không tìm thấy văn bản'} />
          </Card>
        ) : (
          <Space orientation="vertical" size={10} style={{ width: '100%' }}>
            {visibleDocs.map((d) => (
              <Card key={d.id} size="small" styles={{ body: { padding: 14 } }}>
                <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                  <Typography.Text strong style={{ fontSize: 15 }}>
                    {d.title}
                  </Typography.Text>
                  <AttachmentList attachments={d.attachments} newTab />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <DocTags doc={d} />
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {dayjs(d.createdAt).format('DD/MM/YYYY')}
                    </Typography.Text>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{renderActions(d, true)}</div>
                </Space>
              </Card>
            ))}
          </Space>
        )
      ) : (
        <Table<LibraryDoc>
          rowKey="id"
          loading={loading}
          dataSource={visibleDocs}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          locale={{ emptyText: docs.length === 0 ? 'Chưa có văn bản nào' : 'Không tìm thấy văn bản' }}
          columns={[
            {
              title: 'Tên tài liệu',
              dataIndex: 'title',
              render: (title: string, record) => (
                <>
                  <a href={record.driveUrl} target="_blank" rel="noopener noreferrer">
                    {title}
                  </a>
                  {!!record.attachments?.length && (
                    <div style={{ marginTop: 4 }}>
                      <AttachmentList attachments={record.attachments} newTab />
                    </div>
                  )}
                </>
              ),
            },
            { title: 'Hình thức / Loại', key: 'tags', width: 260, render: (_, record) => <DocTags doc={record} /> },
            {
              title: 'Ngày đăng',
              dataIndex: 'createdAt',
              width: 110,
              render: (createdAt: number) => dayjs(createdAt).format('DD/MM/YYYY'),
            },
            {
              title: '',
              key: 'actions',
              width: 320,
              render: (_, record) => <Space size="small">{renderActions(record, false)}</Space>,
            },
          ]}
        />
      )}

      <DocFormModal slug={school.slug} docs={docs} open={formOpen} editing={editing} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />

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
