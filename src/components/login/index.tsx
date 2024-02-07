import type { RadioChangeEvent } from 'antd';
import { Button, Radio, message } from 'antd';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppFooter from '../appFooter';
import AppHeader from '../appHeader';
import OTPLogin from './otpLogin';
import PasswordLogin from './passwordLogin';

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(''); // email need to be shared on passwordLogin and OtpLogin, so it has to be defined in parent.
  const onEmailChange = (evt: ChangeEvent<HTMLInputElement> | string) => {
    typeof evt == 'string' ? setEmail(evt) : setEmail(evt.target.value);
  };

  const [loginType, setLoginType] = useState<'password' | 'OTP'>('password');

  const onLoginTypeChange = (e: RadioChangeEvent) =>
    setLoginType(e.target.value);
  const goSignup = () => navigate(`${APP_PATH}signup`);

  useEffect(() => {
    if (location.state && location.state.msg) {
      message.info(location.state.msg);
    }
  }, []);

  return (
    <div
      style={{
        height: 'calc(100vh - 142px)',
        overflowY: 'auto',
      }}
    >
      <AppHeader />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '200px',
        }}
      >
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
            <PasswordLogin email={email} onEmailChange={onEmailChange} />
          ) : (
            <OTPLogin email={email} onEmailChange={onEmailChange} />
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
      <AppFooter />
    </div>
  );
};

export default Index;
