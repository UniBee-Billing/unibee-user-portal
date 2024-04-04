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
  const [payStatus, setPayStatus] = useState<number | null>(null);
  const result = searchParams.get('success') == 'true';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Result
        status={result ? 'success' : 'error'}
        title={
          result
            ? 'Adding new payment method succeeded'
            : 'Adding new payment method failed'
        }
        // subTitle="Order number: 2017182818828182881."
      />
    </div>
  );
}
