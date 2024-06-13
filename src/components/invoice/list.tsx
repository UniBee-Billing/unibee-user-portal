import {
  DownloadOutlined,
  EyeOutlined,
  LoadingOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Form,
  FormInstance,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  message,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CURRENCY, INVOICE_STATUS } from '../../constants';
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
      render: (refund, iv) =>
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

const DEFAULT_TERM = {
  currency: 'EUR',
  status: [],
  amountStart: '',
  amountEnd: '',
  // refunded: false,
};
const Search = ({
  form,
  searching,
  goSearch,
}: {
  form: FormInstance<any>;
  searching: boolean;
  goSearch: () => void;
}) => {
  const statusOpt = Object.keys(INVOICE_STATUS).map((s) => ({
    value: Number(s),
    label: INVOICE_STATUS[Number(s)],
  }));
  const clear = () => form.resetFields();
  const watchCurrency = Form.useWatch('currency', form);
  useEffect(() => {
    // just to trigger rerender when currency changed
  }, [watchCurrency]);

  const currencySymbol =
    CURRENCY[form.getFieldValue('currency') || DEFAULT_TERM.currency].symbol;

  return (
    <div>
      <Form form={form} initialValues={DEFAULT_TERM}>
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={4}>First/Last name</Col>
          <Col span={4}>
            <Form.Item name="firstName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="first name" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="lastName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="last name" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <span></span>
            {/* <Form.Item name="refunded" noStyle={true} valuePropName="checked">
              <Checkbox>Refunded</Checkbox>
  </Form.Item> */}
          </Col>
          <Col span={8} className="flex justify-end">
            <Button onClick={clear} disabled={searching}>
              Clear
            </Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              onClick={goSearch}
              type="primary"
              loading={searching}
              disabled={searching}
            >
              Search
            </Button>
          </Col>
        </Row>

        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={4}>
            <div className="flex items-center">
              <span className="mr-2">Amount</span>
              <Form.Item name="currency" noStyle={true}>
                <Select
                  style={{ width: 80 }}
                  options={[
                    { value: 'EUR', label: 'EUR' },
                    { value: 'USD', label: 'USD' },
                    { value: 'JPY', label: 'JPY' },
                  ]}
                />
              </Form.Item>
            </div>
          </Col>
          <Col span={4}>
            <Form.Item name="amountStart" noStyle={true}>
              <Input
                prefix={`from ${currencySymbol}`}
                onPressEnter={goSearch}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="amountEnd" noStyle={true}>
              <Input prefix={`to ${currencySymbol}`} onPressEnter={goSearch} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <span className="mr-2">Status</span>
            <Form.Item name="status" noStyle={true}>
              <Select
                mode="multiple"
                options={statusOpt}
                style={{ maxWidth: 420, minWidth: 100, margin: '8px 0' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};
