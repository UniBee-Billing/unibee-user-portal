import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spin, message, Result } from "antd";
import { checkSession } from "../requests";
import { useProfileStore } from "../stores";
import { LoadingOutlined } from "@ant-design/icons";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;
// https://user.unibee.top/session_result?session=1fMsrPDzxmv5mwYxukfCpQUlHtUnB1zaMCe6GeOr


export default function SessionResult() {
  const profileStore = useProfileStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loginStatus, setLoginStatus] = useState<number | null>(null);
  const session = searchParams.get("session");
  console.log("session: ", session);

  const checking = async () => {
    try {
      const res = await checkSession(session as string);
      console.log("session result res: ", res);
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
      setLoginStatus(res.data.data.payStatus);
      localStorage.setItem('token', res.data.data.Token);
      res.data.data.User.token = res.data.data.Token;
      profileStore.setProfile(res.data.data.User);

      navigate(`${APP_PATH}profile/subscription`, {
        state: { from: 'login' },
      });
    } catch (err) {
      if (err instanceof Error) {
        console.log("err checking session result: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  useEffect(() => {
    checking();
    const interval = setInterval(checking, 3000);
    
    return () => clearInterval(interval);
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
      <h1>session result</h1>
      {loginStatus == null ? (
        <span>Checking...</span>
      ) : (
        <Result
          status="success"
          title="Login succeeded!"
          subTitle=""
        />
      )}
    </div>
  );
}
