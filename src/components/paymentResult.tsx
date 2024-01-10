import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { message } from "antd";
import axios from "axios";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;
// http://localhost:5173/payment-result?subId=sub20240109hcHUQ1kvcxwICk3&success=true&session_id=cs_test_a193gxY4JlOESP2C8jMHNQmrIJJiLtjl8JSIRFokQHSw9ylF905bdj0Jfw

const STATUS: { [key: number]: string } = {
  1: "processing",
  2: "complete",
  3: "suspended",
  4: "cancelled",
  5: "overdue",
};

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [payStatus, setPayStatus] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const subscriptionId =
      searchParams.get("subId") || "sub20240109hcHUQ1kvcxwICk3";
    console.log("subId: ", subscriptionId);
    axios
      .post(
        `${API_URL}/user/subscription/subscription_pay_check`,
        {
          subscriptionId,
        },
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("pay result res: ", res);
        const statuCode = res.data.code;
        if (statuCode != 0) {
          if (statuCode == 61) {
            console.log("invalid token");
            navigate(`${APP_PATH}login`, {
              state: { msg: "session expired, please re-login" },
            });
            return;
          }
          throw new Error(res.data.message);
        }
        setPayStatus(res.data.data.payStatus);
      })
      .catch((err) => {
        console.log("get subscription list err: ", err);
        messageApi.open({
          type: "error",
          content: err.message,
        });
      });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {contextHolder}
      <h1>payment result</h1>
      {payStatus != null && <div>{STATUS[payStatus]}</div>}
    </div>
  );
}
