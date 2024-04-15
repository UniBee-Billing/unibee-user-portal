import { LoadingOutlined } from '@ant-design/icons'
import { Button, Col, Row, Spin, message } from 'antd'
import React, { CSSProperties, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { INVOICE_STATUS } from '../../constants'
import { showAmount } from '../../helpers'
import { getInvoiceDetailReq } from '../../requests'
import { IProfile, TInvoicePerm, UserInvoice } from '../../shared.types.d'
import { normalizeAmt } from '../helpers'
import InvoiceItemsModal from '../subscription/modals/newInvoice'

const invoicePerm: TInvoicePerm = {
  editable: false,
  savable: false,
  creatable: false,
  publishable: false,
  revokable: false,
  deletable: false,
  refundable: false,
  downloadable: true,
  sendable: false
}

const APP_PATH = import.meta.env.BASE_URL // if not specified in build command, default is /
const API_URL = import.meta.env.VITE_API_URL
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }

const Index = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [invoiceDetail, setInvoiceDetail] = useState<UserInvoice | null>(null)
  const [userProfile, setUserProfile] = useState<IProfile | null>(null)
  const [showInvoiceItems, setShowInvoiceItems] = useState(false)
  const toggleInvoiceItems = () => setShowInvoiceItems(!showInvoiceItems)

  const goBack = () => navigate(`${APP_PATH}invoice/list`)
  const goToUser = (userId: number) => () =>
    navigate(`${APP_PATH}customer/${userId}`)
  const goToSub = (subId: string) => () =>
    navigate(`${APP_PATH}subscription/${subId}`)

  const fetchData = async () => {
    const pathName = window.location.pathname.split('/')
    console.log('path name: ', pathName)
    const ivId = pathName.pop()
    if (ivId == null) {
      message.error('Invalid invoice')
      return
    }
    setLoading(true)
    const [res, err] = await getInvoiceDetailReq(ivId)
    console.log('get invoicde detail res: ', res)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { invoice } = res
    normalizeAmt([invoice])
    setInvoiceDetail(invoice)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      {invoiceDetail && showInvoiceItems && (
        <InvoiceItemsModal
          user={invoiceDetail.userAccount}
          isOpen={true}
          detail={invoiceDetail}
          closeModal={toggleInvoiceItems}
          refresh={() => {}}
          refundMode={false}
          permission={invoicePerm}
        />
      )}

      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Invoice Id
        </Col>
        <Col span={6}>{invoiceDetail?.invoiceId}</Col>
        <Col span={4} style={colStyle}>
          Invoice Name
        </Col>
        <Col span={6}>{invoiceDetail?.invoiceName}</Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Invoice Amount
        </Col>
        <Col span={6}>
          {invoiceDetail == null
            ? ''
            : showAmount(
                invoiceDetail?.totalAmount,
                invoiceDetail?.currency,
                true
              )}
          <span className="text-xs text-gray-500">
            {invoiceDetail == null
              ? ''
              : ` (${invoiceDetail.taxScale / 100}% tax incl)`}
          </span>
        </Col>
        <Col span={4} style={colStyle}>
          Status
        </Col>
        <Col span={6}>
          {invoiceDetail == null ? '' : INVOICE_STATUS[invoiceDetail.status]}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Invoice Items
        </Col>
        <Col span={6}>
          <Button onClick={toggleInvoiceItems}>Show Detail</Button>
        </Col>

        <Col span={4} style={colStyle}>
          Subscription Id
        </Col>
        <Col span={6}>
          {' '}
          {invoiceDetail == null ||
          invoiceDetail.subscriptionId == null ||
          invoiceDetail.subscriptionId == '' ? null : (
            <span
              className="cursor-pointer text-blue-600"
              onClick={goToSub(invoiceDetail.subscriptionId)}
            >
              {' '}
              {invoiceDetail?.subscriptionId}
            </span>
          )}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Payment Gateway
        </Col>
        <Col span={6}>{invoiceDetail?.gateway.gatewayName}</Col>
        <Col span={4} style={colStyle}>
          User Id{' '}
        </Col>
        <Col span={6}>
          <span
            className="cursor-pointer text-blue-600"
            onClick={goToUser(invoiceDetail?.userId as number)}
          >
            {invoiceDetail &&
              `${invoiceDetail?.userAccount.firstName} ${invoiceDetail.userAccount.lastName}`}
          </span>
        </Col>
      </Row>

      {/* <UserInfo user={userProfile} /> */}
      {/* <Tabs defaultActiveKey="1" items={tabItems} onChange={onTabChange} /> */}

      {invoiceDetail == null ||
      invoiceDetail.sendPdf == null ||
      invoiceDetail.sendPdf == '' ? null : (
        <object
          data={invoiceDetail.sendPdf}
          type="application/pdf"
          width="100%"
          height="100%"
        >
          <p>
            <a href={invoiceDetail.sendPdf}>Download invoice</a>
          </p>
        </object>
      )}
      <div className="m-8 flex justify-center">
        <Button onClick={goBack}>Go Back</Button>
      </div>
    </div>
  )
}

export default Index
