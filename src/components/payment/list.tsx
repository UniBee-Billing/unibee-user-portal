import { LoadingOutlined } from '@ant-design/icons';
import { Button, Form, Pagination, Table, message } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAYMENT_TYPE } from '../../constants';
import { showAmount } from '../../helpers';
import { getPaymentListReq } from '../../requests';
import '../../shared.css';
import { PaymentItem } from '../../shared.types';
import { useAppConfigStore } from '../../stores';
import { usePagination } from '../hooks';
import { PaymentStatus } from '../ui/statusTag';

const PAGE_SIZE = 10;
const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const { page, onPageChange } = usePagination();
  const appConfig = useAppConfigStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentList, setPaymentList] = useState<PaymentItem[]>([]);

  const columns: ColumnsType<PaymentItem> = [
    {
      title: 'Transaction Id',
      dataIndex: 'paymentId',
      key: 'paymentId',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt, pay) => (
        <div>
          <span>{showAmount(amt, pay.currency)}</span>
        </div>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => PaymentStatus(s),
    },
    {
      title: 'Type',
      dataIndex: 'timelineType',
      key: 'timelineType',
      render: (s) => {
        const title = PAYMENT_TYPE[s as keyof typeof PAYMENT_TYPE];
        if (s == 1) {
          // refund
          return (
            <Button
              type="link"
              style={{ padding: 0 }}
              className="btn-refunded-payment"
            >
              {title}
            </Button>
          );
        } else if (s == 0) {
          // regular payment
          return title;
        }
      },
    },
    {
      title: 'Sub Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
    },
    {
      title: 'Payment Gateway',
      dataIndex: 'gatewayId',
      key: 'gatewayId',
      render: (gatewayId) => (
        <span>
          {appConfig.gateway.find((g) => g.gatewayId == gatewayId)?.gatewayName}
        </span>
      ),
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (iv) =>
        iv == '' || iv == null ? (
          ''
        ) : (
          <Button
            type="link"
            style={{ padding: 0 }}
            className="btn-invoice-id"
            onClick={() => navigate(`${APP_PATH}invoice/${iv}`)}
          >
            {iv}
          </Button>
        ),
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => dayjs(d * 1000).format('YYYY-MMM-DD'),
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    const [paymentList, err] = await getPaymentListReq(
      {
        page,
        count: PAGE_SIZE,
        // ...searchTerm,
      },
      fetchData,
    );
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    setPaymentList(paymentList || []);
  };

  /*
  useEffect(() => {
    fetchData();
  }, []);
  */
  useEffect(() => {
    fetchData();
  }, [page]);

  return (
    <div>
      {/* <Search form={form} goSearch={fetchData} searching={loading} /> */}

      <Table
        columns={columns}
        dataSource={paymentList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
      />
      <div className="mx-0 my-4 flex items-center justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={500}
          size="small"
          onChange={onPageChange}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default Index;
