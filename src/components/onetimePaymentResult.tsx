import { Result, Spin, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// import axios from "axios";
import { LoadingOutlined } from '@ant-design/icons';
import { checkOnetimePaymentReq, checkPaymentReq } from '../requests';
import { useProfileStore } from '../stores';

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;
// http://localhost:5173/payment-result?subId=sub20240109hcHUQ1kvcxwICk3&success=true&session_id=cs_test_a193gxY4JlOESP2C8jMHNQmrIJJiLtjl8JSIRFokQHSw9ylF905bdj0Jfw

const STATUS: { [key: number]: string } = {
  10: 'Pending',
  20: 'Succeeded',
  30: 'Failed',
  40: 'Cancelled',
};

export default function PaymentResult() {
  const profileStore = useProfileStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payStatus, setPayStatus] = useState<number | null>(null);
  const [invoiceId, setInvoiceId] = useState('');
  const paymentId = searchParams.get('paymentId');

  const checking = async () => {
    const [chkPayemntRes, err] = await checkOnetimePaymentReq(
      paymentId as string,
    );
    if (null != err) {
      message.error(err.message);
      return;
    }
    const { user, payment, gateway, invoice } = chkPayemntRes;
    setPayStatus(payment.status);
    setInvoiceId(payment.invoiceId);
  };

  useEffect(() => {
    checking();
    const interval = setInterval(checking, 3000);
    if (payStatus != null) {
      // clearInterval(interval);
    }
    return () => clearInterval(interval);
    // I cannot use token from store, because this page was redirected from stripe checkout page.
    // the whole webapp was reloaded without hydrating the store, the store was empty at this moment
    // const token = localStorage.getItem("token");
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1>payment result</h1>
      {payStatus == null ? (
        <span>Checking...</span>
      ) : payStatus != 20 ? (
        <div>{STATUS[payStatus]}</div>
      ) : (
        <Result
          status="success"
          title="Payment succeeded!"
          subTitle={`Invoice Id: ${invoiceId}.`}
        />
      )}
    </div>
  );
}