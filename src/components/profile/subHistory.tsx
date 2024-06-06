import { LoadingOutlined } from '@ant-design/icons';
import { Col, Divider, Pagination, Popover, Row, Spin, message } from 'antd';
import Table, { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, showAmount } from '../../helpers';
import { getSubHistoryReq } from '../../requests';
import { usePagination } from '../hooks';

import { ISubHistoryItem } from '../../shared.types.ts';
// import { SubscriptionStatus } from '../ui/statusTag';

const PAGE_SIZE = 10;
const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const [loading, setLoading] = useState(false);
  const { page, onPageChangeNoParams } = usePagination();
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const [subHistory, setSubHistory] = useState<ISubHistoryItem[]>([]);

  const columns: ColumnsType<ISubHistoryItem> = [
    {
      title: 'Item name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (_, record) =>
        record.plan == null ? null : record.plan.planName,
    },
    {
      title: 'Start',
      dataIndex: 'periodStart',
      key: 'periodStart',
      render: (d) => (d == 0 || d == null ? 'N/A' : formatDate(d)), // dayjs(d * 1000).format('YYYY-MMM-DD'),
    },
    {
      title: 'End',
      dataIndex: 'periodEnd',
      key: 'periodEnd',
      render: (d) => (d == 0 || d == null ? 'N/A' : formatDate(d)), // dayjs(d * 1000).format('YYYY-MMM-DD'),
    },
    {
      title: 'Addons',
      dataIndex: 'addons',
      key: 'addons',
      render: (addons) =>
        addons == null ? (
          'N/A'
        ) : (
          <Popover
            placement="top"
            title="Addon breakdown"
            content={
              <div style={{ width: '280px' }}>
                {addons.map((a: any, idx: number) => (
                  <Row key={idx}>
                    <Col span={10} className=" font-bold text-gray-500">
                      {a.addonPlan.planName}
                    </Col>
                    <Col span={14}>
                      {showAmount(a.addonPlan.amount, a.addonPlan.currency)} ×{' '}
                      {a.quantity} ={' '}
                      {showAmount(
                        a.addonPlan.amount * a.quantity,
                        a.addonPlan.currency,
                      )}
                    </Col>
                  </Row>
                ))}
              </div>
            }
          >
            <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
              {addons.length}
            </span>
          </Popover>
        ),
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      width: 140,
      // render: (subId) => (subId == '' || subId == null ?  : { subId }),
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, _) => (d === 0 ? 'N/A' : formatDate(d)), // (d * 1000).format('YYYY-MMM-DD'),
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      width: 140,
      render: (invoiceId) =>
        invoiceId == '' || invoiceId == null ? (
          ''
        ) : (
          <div
            className=" w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
            onClick={() => navigate(`${APP_PATH}invoice/${invoiceId}`)}
          >
            {invoiceId}
          </div>
        ),
      // render: (status, _) => UserStatus(status)
    },
  ];

  const getSubHistory = async () => {
    setLoading(true);
    const [res, err] = await getSubHistoryReq({
      page,
      count: PAGE_SIZE,
    });
    setLoading(false);
    if (err != null) {
      message.error(err.message);
      return;
    }
    console.log('sub his res: ', res);
    const { subscriptionTimeLines, total } = res;
    setSubHistory(subscriptionTimeLines ?? []);
    setTotal(total);
  };

  useEffect(() => {
    getSubHistory();
  }, [page]);

  return (
    <div>
      <Divider
        orientation="left"
        style={{ margin: '32px 0', color: '#757575' }}
      >
        Subscription and Add-on History
      </Divider>
      <Table
        columns={columns}
        dataSource={subHistory}
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
    </div>
  );
};

export default Index;
