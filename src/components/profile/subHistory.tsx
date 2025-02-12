import { LoadingOutlined } from '@ant-design/icons'
import { Col, Divider, Pagination, Popover, Row, Spin, message } from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate, showAmount } from '../../helpers'
import { getProductListReq, getSubHistoryReq } from '../../requests'
import { usePagination } from '../hooks'

import { IProduct, ISubAddon, ISubHistoryItem } from '../../shared.types.ts'
import LongTextPopover from '../ui/longTextPopover.tsx'
import { SubHistoryStatus } from '../ui/statusTag.tsx'
// import { SubscriptionStatus } from '../ui/statusTag';

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

const Index = () => {
  const [loading, setLoading] = useState(false)
  const { page, onPageChangeNoParams } = usePagination()
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()
  const [subHistory, setSubHistory] = useState<ISubHistoryItem[]>([])
  const [productList, setProductList] = useState<IProduct[]>([])
  const [loadignProducts, setLoadingProducts] = useState(false)

  const getColumns = (): ColumnsType<ISubHistoryItem> => [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      render: (_, record) => {
        const product = productList.find((p) => p.id == record.plan.productId)
        return product != null ? product.productName : ''
      }
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 180,
      render: (_, record) =>
        record.plan == null ? null : (
          <LongTextPopover text={record.plan.planName} width="180px" />
        )
    },
    {
      title: 'Start Time',
      dataIndex: 'periodStart',
      key: 'periodStart',
      render: (d) => (d == 0 || d == null ? '―' : formatDate(d)) // dayjs(d * 1000).format('YYYY-MMM-DD'),
    },
    {
      title: 'End Time',
      dataIndex: 'periodEnd',
      key: 'periodEnd',
      render: (d) => (d == 0 || d == null ? '―' : formatDate(d)) // dayjs(d * 1000).format('YYYY-MMM-DD'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => SubHistoryStatus(s)
    },
    {
      title: 'Addons',
      dataIndex: 'addons',
      key: 'addons',
      render: (addons) =>
        addons == null ? (
          '―'
        ) : (
          <Popover
            placement="top"
            title="Addon breakdown"
            content={
              <div style={{ width: '280px' }}>
                {addons.map((a: ISubAddon, idx: number) => (
                  <Row key={idx}>
                    <Col span={10} className=" font-bold text-gray-500">
                      {a.addonPlan?.planName}
                    </Col>
                    <Col span={14}>
                      {showAmount(a.addonPlan!.amount, a.addonPlan!.currency)} ×{' '}
                      {a.quantity} ={' '}
                      {showAmount(
                        a.addonPlan!.amount * a.quantity,
                        a.addonPlan!.currency
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
        )
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      width: 140
      // render: (subId) => (subId == '' || subId == null ?  : { subId }),
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, _) => (d === 0 ? '―' : formatDate(d, true))
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
        )
      // render: (status, _) => UserStatus(status)
    },
    { title: 'Payment Id', dataIndex: 'paymentId', key: 'paymentId' }
  ]

  const getSubHistory = async () => {
    setLoading(true)
    const [res, err] = await getSubHistoryReq({
      page,
      count: PAGE_SIZE
    })
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { subscriptionTimeLines, total } = res
    setSubHistory(subscriptionTimeLines ?? [])
    setTotal(total)
  }

  const getProductList = async () => {
    setLoadingProducts(true)
    const [res, err] = await getProductListReq()
    setLoadingProducts(false)
    if (null != err) {
      return
    }
    setProductList(res.products ?? [])
  }

  useEffect(() => {
    getSubHistory()
  }, [page])

  useEffect(() => {
    getProductList()
  }, [])

  return (
    <div>
      <Divider
        orientation="left"
        style={{ margin: '32px 0', color: '#757575' }}
      >
        Subscription and Add-on History
      </Divider>
      {loadignProducts ? (
        <Spin
          indicator={<LoadingOutlined spin />}
          size="large"
          style={{
            width: '100%',
            height: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      ) : (
        <Table
          columns={getColumns()}
          dataSource={subHistory}
          rowKey={'uniqueId'}
          rowClassName="clickable-tbl-row"
          pagination={false}
          scroll={{ x: 1280 }}
          onRow={() => {
            return {
              onClick: () => {}
            }
          }}
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
        />
      )}
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
  )
}

export default Index
