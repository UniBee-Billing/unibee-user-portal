import { Button, Form, Input, message } from 'antd';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import OtpInput from 'react-otp-input';
import { useNavigate } from 'react-router-dom';
import { emailValidate, passwordRegx } from '../helpers';
import { signUpReq, signUpVerifyReq } from '../requests';
import AppFooter from './appFooter';
import AppHeader from './appHeader';
import { useCountdown } from './hooks';

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0); // 0: signup-basic-info  |  1: enter verfication code
  const [submitting, setSubmitting] = useState(false);
  const [countVal, isCounting, startCountdown, stopCounter] = useCountdown(60);
  const [otp, setOtp] = useState('');
  const onOTPchange = (value: string) => {
    setOtp(value.toUpperCase());
  };

  const goLogin = () => navigate(`${APP_PATH}login`);

  // send basic signup info
  const onSubmitBasicInfo = async () => {
    setSubmitting(true);

    const [res, err] = await signUpReq(form.getFieldsValue());
    console.log('signup res: ', res);
    setSubmitting(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    message.success('Verification code sent.');
    setCurrentStep(1);
    stopCounter();
    startCountdown();
  };

  // send verification code
  const onSubmitCode = async () => {
    setSubmitting(true);
    const [res, err] = await signUpVerifyReq({
      email: form.getFieldValue('email'),
      verificationCode: otp,
    });
    setSubmitting(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    navigate(`${APP_PATH}login`, {
      state: { msg: 'Thanks for your sign-up.' },
    });
  };

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
          marginTop: '100px',
        }}
      >
        <h1 style={{ marginBottom: '36px', marginTop: '64px' }}>
          Customer Sign-up
        </h1>
        <div
          style={{
            width: '640px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            background: '#FFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '24px',
          }}
        >
          {currentStep == 0 ? (
            <Form
              form={form}
              name="basic"
              onFinish={onSubmitBasicInfo}
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 17 }}
              style={{ maxWidth: 640, width: 480 }}
              initialValues={{
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                password2: '',
              }}
              autoComplete="off"
            >
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[
                  {
                    required: true,
                    message: 'Please input your first name!',
                  },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Last Lame"
                name="lastName"
                rules={[
                  {
                    required: true,
                    message: 'Please input yourn last name!',
                  },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  {
                    required: true,
                    message: 'Please input your Email!',
                  },
                  ({ getFieldValue }) => ({
                    validator(rule, value) {
                      if (
                        value != null &&
                        value != '' &&
                        emailValidate(value)
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject('Invalid email address');
                    },
                  }),
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  {
                    required: true,
                    message: 'Please input your password!',
                  },
                  ({ getFieldValue }) => ({
                    validator(rule, value) {
                      if (passwordRegx.test(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        '8-15 characters with lowercase, uppercase, numeric and special character(@ $ # ! % ? * &  ^)',
                      );
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                label="Password Confirm"
                name="password2"
                rules={[
                  {
                    required: true,
                    message: 'Please retype your password!',
                  },
                  ({ getFieldValue }) => ({
                    validator(rule, value) {
                      if (value == getFieldValue('password')) {
                        return Promise.resolve();
                      }
                      return Promise.reject('Please retype the same password');
                    },
                  }),
                ]}
              >
                <Input.Password onPressEnter={form.submit} />
              </Form.Item>

              <Form.Item
                wrapperCol={{
                  offset: 11,
                  span: 8,
                }}
              >
                <Button
                  type="primary"
                  onClick={form.submit}
                  loading={submitting}
                >
                  Submit
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Form
              name="login_OTP_code"
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 17 }}
              style={{ maxWidth: 640, width: 480 }}
              autoComplete="off"
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '78px',
                }}
              >
                <h3>
                  Enter verification code for {form.getFieldValue('email')}
                </h3>
              </div>
              <OtpInput
                value={otp}
                onChange={onOTPchange}
                numInputs={6}
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  marginTop: '36px',
                }}
              >
                <Button
                  type="primary"
                  onClick={onSubmitCode}
                  loading={submitting}
                  disabled={submitting}
                  size="large"
                >
                  submit
                </Button>
                <div style={{ display: 'flex', margin: '12px 0' }}>
                  <Button
                    type="link"
                    onClick={() => setCurrentStep(0)}
                    disabled={submitting}
                  >
                    Go Back
                  </Button>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      maxWidth: '180px',
                    }}
                  >
                    <Button
                      type="link"
                      onClick={startCountdown}
                      disabled={isCounting as boolean}
                    >
                      Resend
                    </Button>
                    {isCounting && (
                      <div style={{ width: '100px' }}>
                        {' '}
                        in {countVal} seconds
                      </div>
                    )}
                  </div>
                  {/* <Button type="link" onClick={onSubmit} disabled={submitting}>
                  Resend
            </Button> */}
                </div>
              </div>
            </Form>
          )}
        </div>
        <>
          <div
            style={{
              display: 'flex',
              color: '#757575',
              justifyContent: 'center',
              alignItems: 'center',
              // margin: "-12px 0 18px 0",
            }}
          >
            Already have an account?
            <Button type="link" onClick={goLogin}>
              Login
            </Button>
          </div>
        </>
      </div>
      <AppFooter />
    </div>
  );
};

export default Index;
