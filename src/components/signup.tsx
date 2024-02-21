import { Button, Form, Input, message } from 'antd';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import OtpInput from 'react-otp-input';
import { useNavigate } from 'react-router-dom';
import { emailValidate, passwordRegx } from '../helpers';
import { signUpReq, singUpVerifyReq } from '../requests';
import AppFooter from './appFooter';
import AppHeader from './appHeader';
import { useCountdown } from './hooks';

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

// const passwordRegx =
//   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,15}$/;

const Index = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  // const [firstName, setFirstName] = useState('');
  // const [lastName, setLastName] = useState('');
  // const [email, setEmail] = useState('');
  // const [phone, setPhone] = useState("");
  // const [address, setAddress] = useState("");
  // const [password, setPassword] = useState('');
  // const [password2, setPassword2] = useState('');
  // const [country, setCountry] = useState("");
  // const [verificationCode, setVerificationCode] = useState("");
  const [currentStep, setCurrentStep] = useState(0); // 0: signup-basic-info  |  1: enter verfication code
  const [submitting, setSubmitting] = useState(false);
  // const [countryList, setCountryList] = useState<Country[]>([]);

  // const onEmailChange = (evt: ChangeEvent<HTMLInputElement>) =>
  //     setEmail(evt.target.value);

  /*
  const onFirstNameChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setFirstName(evt.target.value);
  const onLastNameChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setLastName(evt.target.value);
  const onEmailChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(evt.target.value);
  const onPasswordChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(evt.target.value);
  const onPassword2Change = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setPassword2(evt.target.value);
  */

  const [countVal, isCounting, startCountdown, stopCounter] = useCountdown(60);

  const [otp, setOtp] = useState('');
  const onOTPchange = (value: string) => {
    setOtp(value.toUpperCase());
  };

  const goLogin = () => navigate(`${APP_PATH}login`);

  // send basic signup info
  const onSubmit = async () => {
    /*
    if (
      firstName == "" ||
      lastName == "" ||
      email == "" ||
      // country == "" ||
      password == "" ||
      password2 == "" ||
      password != password2 ||
      !passwordRegx.test(password)
    ) {
      return;
    }
*/
    console.log(
      'form value: ',
      form.getFieldsError(),
      '//',
      form.getFieldsValue(),
    );

    const isInvalid = form.getFieldsError().some((f) => f.errors.length > 0);
    if (isInvalid) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await signUpReq(form.getFieldsValue());
      console.log('signup res: ', res);
      setSubmitting(false);
      if (res.data.code != 0) {
        throw new Error(res.data.message);
      }
      message.success('Verification code sent.');
      setCurrentStep(1);
      stopCounter();
      startCountdown();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof Error) {
        console.log('err signup: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  // send verification code
  const onSubmit2 = async () => {
    setSubmitting(true);
    try {
      const res = await singUpVerifyReq({
        email: form.getFieldValue('email'),
        verificationCode: otp,
      });
      setSubmitting(false);
      console.log('reg res: ', res);
      if (res.data.code != 0) {
        throw new Error(res.data.message);
      }
      navigate(`${APP_PATH}login`, {
        state: { msg: 'Thanks for your sign-up on UniBee' },
      });
    } catch (err) {
      setSubmitting(false);
      if (err instanceof Error) {
        console.log('err signup: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
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
              onFinish={onSubmit}
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
                {/* <Input value={firstName} onChange={onFirstNameChange} /> */}
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
                {/* <Input value={lastName} onChange={onLastNameChange} /> */}
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
                {/* <Input value={email} onChange={onEmailChange} /> */}
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
                {/* <Input.Password
              value={password}
              onChange={onPasswordChange}
          /> */}
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
                      return Promise.reject('please retype the same password');
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                wrapperCol={{
                  offset: 11,
                  span: 8,
                }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  // onClick={onSubmit}
                  loading={submitting}
                >
                  Submit
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Form
              // form={form}
              // onFinish={submit}
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
                  onClick={onSubmit2}
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
