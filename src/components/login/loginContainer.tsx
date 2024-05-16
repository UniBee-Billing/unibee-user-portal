import type { RadioChangeEvent } from 'antd';
import { Button, Radio } from 'antd';
import React, { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OTPLogin from './otpLogin';
import PasswordLogin from './passwordLogin';

const APP_PATH = import.meta.env.BASE_URL;

const Index = ({
  triggeredByExpired,
  initialEmail,
}: {
  triggeredByExpired: boolean;
  initialEmail: string;
}) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(initialEmail); // email need to be shared on passwordLogin and OtpLogin, so it has to be defined in parent.
  const onEmailChange = (evt: ChangeEvent<HTMLInputElement> | string) => {
    typeof evt == 'string' ? setEmail(evt) : setEmail(evt.target.value);
  };

  const [loginType, setLoginType] = useState<'password' | 'OTP'>('password');

  const onLoginTypeChange = (e: RadioChangeEvent) =>
    setLoginType(e.target.value);
  const goSignup = () => navigate(`${APP_PATH}signup`);

  return (
    <div className="flex h-full items-center justify-center ">
      <div className="flex flex-col items-center justify-center">
        <h1 style={{ marginBottom: '36px' }}>Customer Login</h1>
        <Radio.Group
          options={[
            { label: 'Password', value: 'password' },
            { label: 'OTP', value: 'OTP' },
          ]}
          onChange={onLoginTypeChange}
          value={loginType}
        />
        <div
          style={{
            width: '640px',
            height: '320px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            marginTop: '36px',
            background: '#FFF',
          }}
        >
          {loginType == 'password' ? (
            <PasswordLogin
              email={email}
              onEmailChange={onEmailChange}
              triggeredByExpired={triggeredByExpired}
            />
          ) : (
            <OTPLogin
              email={email}
              onEmailChange={onEmailChange}
              triggeredByExpired={triggeredByExpired}
            />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            color: '#757575',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          Don't have an account?
          <Button type="link" onClick={goSignup}>
            Free signup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
