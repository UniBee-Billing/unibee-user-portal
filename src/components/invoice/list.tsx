import {
  DownloadOutlined,
  EyeOutlined,
  LoadingOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Button,
  Pagination,
  Space,
  Table,
  Tooltip,
  message,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, showAmount } from '../../helpers';
import { downloadInvoice, getInvoiceListReq } from '../../requests';
import '../../shared.css';
import { UserInvoice } from '../../shared.types';
import { usePagination } from '../hooks';
import RefundModal from '../payment/refundModal';
import { InvoiceStatus } from '../ui/statusTag';
import PreviewModal from './invoicePreviewModal';

const PAGE_SIZE = 10;
const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const { page, onPageChange } = usePagination();
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invoiceList, setInvoiceList] = useState<UserInvoice[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const togglePreviewModal = () => setPreviewModalOpen(!previewModalOpen);
  const [previewLink, setPreviewLink] = useState('');
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [invoiceIdx, setInvoiceIdx] = useState(-1);
  const toggleRefundModal = () => setRefundModalOpen(!refundModalOpen);

  const openPreview = (ivLink: string) => {
    setPreviewLink(ivLink);
    togglePreviewModal();
  };

  const fetchData = async () => {
    setLoading(true);
    const [res, err] = await getInvoiceListReq(
      {
        page,
        count: PAGE_SIZE,
      },
      fetchData,
    );
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    const { invoices, total } = res;
    setInvoiceList(invoices ?? []);
    setTotal(total);
  };

  const columns: ColumnsType<UserInvoice> = [
    {
      title: 'Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt, iv) => (
        <div>
          <span>{showAmount(amt, iv.currency)}</span>
          <span
            style={{ fontSize: '11px', color: '#757575' }}
          >{` (tax: ${showAmount(iv.taxAmount, iv.currency)})`}</span>
        </div>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s, iv) => InvoiceStatus(s, iv.refund != null),
    },
    {
      title: 'Document Type',
      dataIndex: 'refund',
      key: 'refund',
      render: (refund) =>
        refund == null ? (
          'Invoice'
        ) : (
          <Button
            type="link"
            size="small"
            className="btn-refund-modal-wrapper"
            style={{ padding: 0 }}
          >
            Credit Note
          </Button>
        ),
    },
    {
      title: 'Issue date',
      dataIndex: 'periodStart',
      key: 'periodStart',
      render: (d, iv) =>
        iv.refund == null
          ? d == 0
            ? ''
            : formatDate(d)
          : formatDate(iv.refund.refundTime), // dayjs(d * 1000).format('YYYY-MMM-DD'),
      // sorter: (a, b) => a.periodStart - b.periodStart,
    },
    {
      /*
      title: 'End',
      dataIndex: 'periodEnd',
      key: 'periodEnd',
      render: (d, plan) =>
        d == 0 ? '' : dayjs(d * 1000).format('YYYY-MMM-DD'),
      sorter: (a, b) => a.periodEnd - b.periodEnd,
*/
    },
    {
      title: (
        <>
          <span>Actions</span>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchData}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      dataIndex: 'actions',
      key: 'actions',
      render: (_, iv) => (
        <Space size="middle">
          <span className="btn-preview-download-iv">
            <Tooltip title="Preview">
              <Button
                className="btn-preview-download-iv"
                disabled={iv.sendPdf == '' || iv.sendPdf == null}
                onClick={() => openPreview(iv.sendPdf)}
                icon={<EyeOutlined />}
              ></Button>
            </Tooltip>
          </span>
          <span className="btn-preview-download-iv">
            <Tooltip title="Download">
              <Button
                className="btn-preview-download-iv"
                disabled={iv.sendPdf == '' || iv.sendPdf == null}
                onClick={() => downloadInvoice(iv.sendPdf)}
                icon={<DownloadOutlined />}
              ></Button>
            </Tooltip>
          </span>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, [page]);

  return (
    <div>
      {previewModalOpen && (
        <PreviewModal closeModal={togglePreviewModal} ivLink={previewLink} />
      )}
      {refundModalOpen && invoiceList[invoiceIdx].refund != null && (
        <RefundModal
          detail={invoiceList[invoiceIdx].refund!}
          closeModal={toggleRefundModal}
          ignoreAmtFactor={false}
        />
      )}
      <Table
        columns={columns}
        dataSource={invoiceList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
        onRow={(iv, rowIndex) => {
          return {
            onClick: (evt) => {
              if (
                evt.target instanceof Element &&
                evt.target.closest('.btn-preview-download-iv') != null
              ) {
                return;
              }
              if (
                evt.target instanceof Element &&
                evt.target.closest('.btn-refund-modal-wrapper') != null
              ) {
                setInvoiceIdx(rowIndex as number);
                toggleRefundModal();
                return;
              }
              navigate(`${APP_PATH}invoice/${iv.invoiceId}`);
            },
          };
        }}
      />
      <div className="mx-0 my-4 flex items-center justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          size="small"
          onChange={onPageChange}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default Index;
