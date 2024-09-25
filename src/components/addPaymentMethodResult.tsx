import { Result } from 'antd'
import { useSearchParams } from 'react-router-dom'
// import axios from "axios";

// http://localhost:5173/payment-result?subId=sub20240109hcHUQ1kvcxwICk3&success=true&session_id=cs_test_a193gxY4JlOESP2C8jMHNQmrIJJiLtjl8JSIRFokQHSw9ylF905bdj0Jfw

export default function PaymentResult() {
  const [searchParams] = useSearchParams()
  const result = searchParams.get('success') == 'true'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
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
  )
}
