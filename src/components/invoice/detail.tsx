import { LoadingOutlined } from '@ant-design/icons';
import { Button, Col, Row, Spin, message } from 'antd';
import React, { CSSProperties, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeAmt, showAmount } from '../../helpers';
import { getInvoiceDetailReq } from '../../requests';
import { UserInvoice } from '../../shared.types';
import { useProfileStore } from '../../stores';
import InvoiceItemDetailModal from '../modals/invoiceDetailModal';
import { InvoiceStatus } from '../ui/statusTag';
// import InvoiceItemsModal from './invoiceModal'; // to be revmoed, not used anymore

const APP_PATH = import.meta.env.BASE_URL; // if not specified in build command, default is /
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px',
};
const colStyle: CSSProperties = { fontWeight: 'bold' };

const Index = () => {
  const userProfle = useProfileStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<UserInvoice | null>(null);
  const [showInvoiceItems, setShowInvoiceItems] = useState(false);
  const toggleInvoiceItems = () => setShowInvoiceItems(!showInvoiceItems);

  const goBack = () => navigate(`${APP_PATH}invoice/list`);

  const fetchData = async () => {
    const pathName = window.location.pathname.split('/');
    const ivId = pathName.pop();
    if (ivId == null) {
      message.error('Invalid invoice');
      return;
    }

    setLoading(true);
    const [invoice, err] = await getInvoiceDetailReq(ivId, fetchData);
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    normalizeAmt([invoice]);
    setInvoiceDetail(invoice);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        <InvoiceItemDetailModal
          user={userProfle}
          detail={invoiceDetail}
          closeModal={toggleInvoiceItems}
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
                true,
              )}
          <span className="text-xs text-gray-500">
            {invoiceDetail == null
              ? ''
              : ` (${invoiceDetail.taxPercentage / 100}% tax incl)`}
          </span>
        </Col>
        <Col span={4} style={colStyle}>
          Status
        </Col>
        <Col span={6}>
          {invoiceDetail == null
            ? ''
            : InvoiceStatus(invoiceDetail.status, invoiceDetail.refund != null)}
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
            <span>{invoiceDetail?.subscriptionId}</span>
          )}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Payment Gateway
        </Col>
        <Col span={6}>{invoiceDetail?.gateway.displayName}</Col>
        {/* <Col span={4} style={colStyle}>
          User Id
        </Col>
        <Col span={6}>
          <span
            className="cursor-pointer text-blue-600"
            onClick={goToUser(invoiceDetail?.userId as number)}
          >
            {invoiceDetail &&
              `${invoiceDetail?.userAccount.firstName} ${invoiceDetail.userAccount.lastName}`}
          </span>
            </Col>*/}
      </Row>

      {/* <UserInfo user={userProfile} /> */}
      {/* <Tabs defaultActiveKey="1" items={tabItems} onChange={onTabChange} /> */}

      {invoiceDetail == null ||
      invoiceDetail.sendPdf == null ||
      invoiceDetail.sendPdf == '' ? null : (
        <object
          data={invoiceDetail.sendPdf}
          type="application/pdf"
          style={{
            height: 'calc(100vh - 460px)',
            width: '100%',
            marginTop: '24px',
          }}
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
  );
};

export default Index;
