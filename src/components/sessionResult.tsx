import { LoadingOutlined } from '@ant-design/icons';
import { Result, Spin, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { checkSessionReq, getAppConfigReq, initializeReq } from '../requests';
import {
  useAppConfigStore,
  useMerchantInfoStore,
  useProfileStore,
  useSessionStore,
} from '../stores';

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;
// https://user.unibee.top/session_result?session=1fMsrPDzxmv5mwYxukfCpQUlHtUnB1zaMCe6GeOr

export default function SessionResult() {
  const profileStore = useProfileStore();
  const sessionStore = useSessionStore();
  const appConfigStore = useAppConfigStore();
  const merchantStore = useMerchantInfoStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loginStatus, setLoginStatus] = useState<number | null>(null);
  const session = searchParams.get('session');

  const checking = async () => {
    const [res, err] = await checkSessionReq(session as string);
    if (null != err) {
      message.error(err.message);
      return;
    }
    const { user, token } = res;
    localStorage.setItem('token', token);
    user.token = token;
    profileStore.setProfile(user);
    sessionStore.setSession({ expired: false, refresh: null });

    const [initRes, errInit] = await initializeReq();
    if (null != errInit) {
      message.error(errInit.message);
      return;
    }
    const { appConfig, gateways, merchantInfo } = initRes;
    appConfigStore.setAppConfig(appConfig);
    appConfigStore.setGateway(gateways);
    merchantStore.setMerchantInfo(merchantInfo);
    navigate(`${APP_PATH}profile/subscription`, {
      state: { from: 'login' },
    });
  };

  useEffect(() => {
    checking();
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
      <h1>session result</h1>
      {loginStatus == null ? (
        <span>Checking...</span>
      ) : (
        <Result status="success" title="Login succeeded!" subTitle="" />
      )}
    </div>
  );
}
