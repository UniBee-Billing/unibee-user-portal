import { Result, Spin, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// import axios from "axios";
import { LoadingOutlined } from '@ant-design/icons';
import { checkPaymentReq } from '../requests';
import { useProfileStore } from '../stores';

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;
// http://localhost:5173/payment-result?subId=sub20240109hcHUQ1kvcxwICk3&success=true&session_id=cs_test_a193gxY4JlOESP2C8jMHNQmrIJJiLtjl8JSIRFokQHSw9ylF905bdj0Jfw

const STATUS: { [key: number]: string } = {
  1: 'processing',
  2: 'complete',
  3: 'suspended',
  4: 'cancelled',
  5: 'overdue',
};

export default function PaymentResult() {
  const profileStore = useProfileStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [payStatus, setPayStatus] = useState<number | null>(null);
  const subscriptionId = searchParams.get('subId');

  const checking = async () => {
    const [chkPayemntRes, err] = await checkPaymentReq(
      subscriptionId as string,
    );
    if (null != err) {
      message.error(err.message);
      return;
    }
    const { payStatus } = chkPayemntRes;
    setPayStatus(payStatus);
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
      {contextHolder}
      <h1>payment result</h1>
      {payStatus == null ? (
        <span>Checking...</span>
      ) : payStatus != 2 ? (
        <div>{STATUS[payStatus]}</div>
      ) : (
        <Result
          status="success"
          title="Payment succeeded!"
          subTitle="Order number: 2017182818828182881."
        />
      )}
    </div>
  );
}
