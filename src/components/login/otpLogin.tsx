import { Button, Form, Input, message } from 'antd';
import { useEffect, useState } from 'react';
import OtpInput from 'react-otp-input';
import { useNavigate } from 'react-router-dom';
import { emailValidate } from '../../helpers';
import {
  getAppConfigReq,
  initializeReq,
  loginWithOTPReq,
  loginWithOTPVerifyReq,
} from '../../requests';
import {
  useAppConfigStore,
  useMerchantInfoStore,
  useProfileStore,
  useSessionStore,
} from '../../stores';
import { useCountdown } from '../hooks';

const APP_PATH = import.meta.env.BASE_URL;

const Index = ({
  email,
  onEmailChange,
  triggeredByExpired,
}: {
  email: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggeredByExpired: boolean;
}) => {
  const [currentStep, setCurrentStep] = useState(0); // 0: input email, 1: input code
  const [errMailMsg, setErrMailMsg] = useState('');
  const [sendingMailaddr, setSendingMailaddr] = useState(false);
  const [countVal, counting, startCount, stopCounter] = useCountdown(60);

  const goBackForward = () => setCurrentStep((currentStep + 1) % 2);

  const sendMailaddress = async () => {
    if (email.trim() == '' || !emailValidate(email)) {
      setErrMailMsg('Invalid email adderss!');
      return Promise.reject(new Error('Invalid email address'));
    }

    setSendingMailaddr(true);
    setErrMailMsg('');
    const [loginRes, err] = await loginWithOTPReq(email);
    setSendingMailaddr(false);
    if (null != err) {
      let e = err instanceof Error ? err : new Error('Unkown error');
      setErrMailMsg(e.message);
      return Promise.reject(e);
    }
    stopCounter();
    startCount();
    message.success('Code sent, please check your email');
  };

  return (
    <div>
      {currentStep == 0 ? (
        <MailForm
          email={email}
          onEmailChange={onEmailChange}
          sendMailaddress={sendMailaddress}
          goForward={goBackForward}
        />
      ) : (
        <OTPForm
          email={email}
          errMailMsg={errMailMsg}
          sendMailaddress={sendMailaddress}
          goBack={goBackForward}
          counting={counting}
          countVal={countVal}
          triggeredByExpired={triggeredByExpired}
        />
      )}
    </div>
  );
};

export default Index;

interface IMailFormProps {
  email: string;
  onEmailChange: (evt: React.ChangeEvent<HTMLInputElement>) => void;
  goForward: () => void;
  sendMailaddress: () => Promise<any>;
}
const MailForm = ({
  email,
  onEmailChange,
  goForward,
  sendMailaddress,
}: IMailFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const submit = async () => {
    try {
      setSubmitting(true);
      const res = await sendMailaddress();
      console.log('send mail addre res: ', res);
      setSubmitting(false);
      goForward();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof Error) {
        console.log('err sending mailaddress: ', err.message);
        setErrMsg(err.message);
      } else {
        setErrMsg('Unknown error');
      }
    }
  };

  return (
    <Form
      // form={form}
      // onFinish={sendMail}
      name="login_OTP_email"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      style={{ maxWidth: 640, width: 360 }}
    >
      <Form.Item
        label="Email"
        // name="email"
        rules={[
          {
            required: true,
            message: 'Please input your email!',
          },
        ]}
      >
        <Input value={email} onChange={onEmailChange} onPressEnter={submit} />
      </Form.Item>
      <div className="mb-4 flex justify-center text-red-500">{errMsg}</div>

      <Form.Item
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <Button
          type="primary"
          // htmlType="submit"
          onClick={submit}
          loading={submitting}
          disabled={submitting}
        >
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

// ---------------------------------------------------

interface IOtpFormProps {
  email: string;
  errMailMsg: string;
  counting: boolean;
  countVal: number;
  sendMailaddress: () => Promise<any>;
  goBack: () => void;
  triggeredByExpired: boolean;
}

const NUM_INPUTS = 6;

const OTPForm = ({
  email,
  errMailMsg,
  counting,
  countVal,
  sendMailaddress,
  goBack,
  triggeredByExpired,
}: IOtpFormProps) => {
  const navigate = useNavigate();
  const merchantStore = useMerchantInfoStore();
  const sessionStore = useSessionStore();
  const appConfigStore = useAppConfigStore();
  const profileStore = useProfileStore();
  const [submitting, setSubmitting] = useState(false);
  const [otp, setOtp] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const onOTPchange = (value: string) => {
    setOtp(value.toUpperCase());
  };

  const sendCode = async () => {
    if (otp.length != NUM_INPUTS) {
      setErrMsg('Invalid code');
      return;
    }
    setErrMsg('');
    setSubmitting(true);
    const [loginRes, err] = await loginWithOTPVerifyReq(email, otp);
    if (null != err) {
      setSubmitting(false);
      setErrMsg(err.message);
      return;
    }
    const { user, token } = loginRes;
    localStorage.setItem('token', token);
    user.token = token;
    profileStore.setProfile(user);
    sessionStore.setSession({ expired: false, refresh: null });

    const [initRes, errInit] = await initializeReq();
    setSubmitting(false);
    if (null != errInit) {
      setErrMsg(errInit.message);
      return;
    }

    const { appConfig, gateways, merchantInfo } = initRes;
    appConfigStore.setAppConfig(appConfig);
    appConfigStore.setGateway(gateways);
    merchantStore.setMerchantInfo(merchantInfo);

    if (triggeredByExpired) {
      sessionStore.refresh && sessionStore.refresh();
      message.success('Login succeeded');
    } else {
      navigate(`${APP_PATH}my-subscription`, {
        state: { from: 'login' },
      });
    }
    sessionStore.setSession({ expired: false, refresh: null });
  };

  return (
    <Form
      // form={form}
      // onFinish={submit}
      name="login_OTP_code"
      labelCol={{
        span: 6,
      }}
      wrapperCol={{
        span: 18,
      }}
      style={{
        maxWidth: 600,
      }}
      autoComplete="off"
    >
      <div className="flex h-24 items-center justify-center">
        <h3>Enter verification code for {email}</h3>
      </div>
      <OtpInput
        value={otp}
        onChange={onOTPchange}
        numInputs={NUM_INPUTS}
        shouldAutoFocus={true}
        skipDefaultStyles={true}
        inputStyle={{
          height: '80px',
          width: '60px',
          border: '1px solid gray',
          borderRadius: '6px',
          textAlign: 'center',
          fontSize: '36px',
        }}
        renderSeparator={<span style={{ width: '36px' }}></span>}
        renderInput={(props) => <input {...props} />}
      />
      <div className="mt-8 flex flex-col items-center justify-center">
        <span className="mb-4 text-red-500">{errMailMsg || errMsg}</span>
        <Button
          type="primary"
          block
          htmlType="submit"
          onClick={sendCode}
          loading={submitting}
          disabled={submitting}
        >
          OK
        </Button>
        <div className="mt-2 flex">
          <Button type="link" block onClick={goBack}>
            Go back
          </Button>

          <div className="flex max-w-44 items-center justify-center">
            <Button type="link" onClick={sendMailaddress} disabled={counting}>
              Resend
            </Button>
            {counting && (
              <div style={{ width: '100px' }}> in {countVal} seconds</div>
            )}
          </div>
        </div>
      </div>
    </Form>
  );
};
