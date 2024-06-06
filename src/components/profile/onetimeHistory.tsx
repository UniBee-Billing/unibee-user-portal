import { LoadingOutlined } from '@ant-design/icons';
import { Divider, Pagination, Tag, message } from 'antd';
import Table, { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, showAmount } from '../../helpers';
import { getOnetimePaymentHistoryReq } from '../../requests';
import { IOneTimeHistoryItem } from '../../shared.types';
import { usePagination } from '../hooks';
import { PaymentStatus } from '../ui/statusTag';

const PAGE_SIZE = 10;
const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const [loading, setLoading] = useState(false);
  const { page, onPageChangeNoParams } = usePagination();
  const [total, setTotal] = useState(0);
  const [onetimeHistory, setOneTimeHistory] = useState<IOneTimeHistoryItem[]>(
    [],
  );
  const navigate = useNavigate();
  const fetchData = async () => {
    setLoading(true);
    const [res, err] = await getOnetimePaymentHistoryReq({
      page,
      count: PAGE_SIZE,
    });
    setLoading(false);
    if (err != null) {
      message.error(err.message);
      return;
    }
    console.log('onetime his res: ', res);
    const { paymentItems, total } = res;
    setOneTimeHistory(paymentItems ?? []);
    setTotal(total);
  };

  const columns: ColumnsType<IOneTimeHistoryItem> = [
    {
      title: 'Item name',
      dataIndex: 'name',
      key: 'name',
    },

    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => PaymentStatus(status),
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (ivId) =>
        ivId == '' || ivId == null ? (
          ''
        ) : (
          <div
            className=" w-30 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
            onClick={() => navigate(`${APP_PATH}invoice/${ivId}`)}
          >
            {ivId}
          </div>
        ),
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      width: 140,
    },
    {
      title: 'Payment Id',
      dataIndex: 'paymentId',
      key: 'paymentId',
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => (d == 0 || d == null ? 'N/A' : formatDate(d)), // dayjs(d * 1000).format('YYYY-MMM-DD'),
    },
  ];

  useEffect(() => {
    fetchData();
  }, [page]);

  return (
    <>
      <Divider
        orientation="left"
        style={{ margin: '32px 0', color: '#757575' }}
      >
        One-time Purchase History
      </Divider>
      <Table
        columns={columns}
        dataSource={onetimeHistory}
        rowKey={'uniqueId'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        // scroll={{ x: true, y: 640 }}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {},
          };
        }}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
      />
      <div className="mt-6 flex justify-end">
        <Pagination
          style={{ marginTop: '16px' }}
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          size="small"
          onChange={onPageChangeNoParams}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
    </>
  );
};

export default Index;
