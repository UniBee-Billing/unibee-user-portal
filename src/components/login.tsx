import React, { ChangeEvent, useState } from "react";
import type { RadioChangeEvent } from "antd";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, Form, Input, Tabs, Radio } from "antd";
import OtpInput from "react-otp-input";
import axios from "axios";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const onEmailChange = (evt: ChangeEvent<HTMLInputElement>) =>
    setEmail(evt.target.value);
  const onPasswordChange = (evt: ChangeEvent<HTMLInputElement>) =>
    setPassword(evt.target.value);
  const [loginType, setLoginType] = useState("password"); // [password, OTP]
  // const { state } = useLocation();

  const onLoginTypeChange = (e: RadioChangeEvent) => {
    console.log("radio checked", e.target.value);
    setLoginType(e.target.value);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "200px",
      }}
    >
      <Radio.Group
        options={[
          { label: "Password", value: "password" },
          { label: "OTP", value: "OTP" },
        ]}
        onChange={onLoginTypeChange}
        value={loginType}
      />
      <div
        style={{
          width: "640px",
          height: "320px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          marginTop: "36px",
          background: "#FFF",
        }}
      >
        {/* <div style={{ height: "36px" }}></div> */}
        {/* <div style={{ height: "48px" }}></div> */}
        {loginType == "password" ? (
          <Login1
            email={email}
            onEmailChange={onEmailChange}
            password={password}
            onPasswordChange={onPasswordChange}
          />
        ) : (
          <Login2 email={email} onEmailChange={onEmailChange} />
        )}
      </div>
    </div>
  );
};

export default Index;

// email + Pasword
const Login1 = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
}: {
  email: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  password: string;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const onEmailChange = (evt) => setEmail(evt.target.value);
  // const onPasswordChange = (evt) => setPassword(evt.target.value);
  const onSubmit = () => {
    setErrMsg("");
    axios
      .post(`${API_URL}/auth/v1/sso/login`, {
        email,
        password,
      })
      .then((res) => {
        console.log("login res: ", res);
        if (res.data.code != 0) {
          throw new Error(res.data.message);
        }
        localStorage.setItem("token", res.data.data.Token);
        navigate(`${APP_PATH}profile`);
        // if (res.data.code) navigate("/Dashboard");
      })
      .catch((err) => {
        console.log("login err: ", err.message);
        setErrMsg(err.message);
      });
  };
  return (
    <Form
      name="basic"
      labelCol={{
        span: 10,
      }}
      wrapperCol={{
        span: 14,
      }}
      style={{
        maxWidth: 640,
      }}
      initialValues={{
        remember: true,
      }}
      autoComplete="off"
    >
      <Form.Item
        label="Email"
        name="email"
        rules={[
          {
            required: true,
            message: "Please input your Email!",
          },
        ]}
      >
        <Input value={email} onChange={onEmailChange} />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          {
            required: true,
            message: "Please input your password!",
          },
        ]}
      >
        <Input.Password value={password} onChange={onPasswordChange} />
      </Form.Item>

      {/* <Form.Item
        name="remember"
        valuePropName="checked"
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <Checkbox>Remember me</Checkbox>
      </Form.Item>*/}

      <Form.Item
        name="errMsg"
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <span style={{ color: "red" }}>{errMsg}</span>
      </Form.Item>

      <Form.Item
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <Button type="primary" htmlType="submit" onClick={onSubmit}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

// email + OTP
const Login2 = ({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const [currentStep, setCurrentStep] = useState(0); // 0: email, 1: code
  const [otp, setOtp] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  const onOTPchange = (value: string) => {
    setOtp(value.toUpperCase());
  };

  const resend = () => {
    setOtp("");
    axios
      .post(`${API_URL}/auth/v1/sso/loginOTP`, {
        email,
      })
      .then((res) => {
        console.log("login res: ", res);
        if (res.data.code != 0) {
          setErrMsg(res.data.message);
          throw new Error(res.data.message);
        }
        setCurrentStep(1);
      })
      .catch((err) => {
        console.log("login err: ", err.message);
        setErrMsg(err.message);
      });
  };

  const submit = () => {
    setErrMsg("");
    console.log("submitting..");
    if (currentStep == 0) {
      axios
        .post(`${API_URL}/auth/v1/sso/loginOTP`, {
          email,
        })
        .then((res) => {
          console.log("login res: ", res);
          if (res.data.code != 0) {
            setErrMsg(res.data.message);
            throw new Error(res.data.message);
          }
          setCurrentStep(1);
        })
        .catch((err) => {
          console.log("login err: ", err.message);
          setErrMsg(err.message);
        });
    } else {
      axios
        .post(`${API_URL}/auth/v1/sso/loginOTPVerify`, {
          email,
          verificationCode: otp,
        })
        .then((res) => {
          console.log("otp loginVerify res: ", res);
          if (res.data.code != 0) {
            setErrMsg(res.data.message);
            throw new Error(res.data.message);
          }
          localStorage.setItem("token", res.data.data.Token);
          navigate(`${APP_PATH}dashboard`);
          // if (res.data.code) navigate("/Dashboard");
        })
        .catch((err) => {
          console.log("login err: ", err.message);
          setErrMsg(err.message);
        });
    }
  };

  return (
    <div>
      {currentStep == 0 ? (
        <Form
          name="basic"
          labelCol={{
            span: 6,
          }}
          wrapperCol={{
            span: 18,
          }}
          style={{
            maxWidth: 600,
          }}
          initialValues={{
            remember: true,
          }}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Please input your Email!",
              },
            ]}
          >
            <Input value={email} onChange={onEmailChange} />
          </Form.Item>

          <Form.Item
            wrapperCol={{
              offset: 8,
              span: 16,
            }}
          >
            <Button type="primary" htmlType="submit" onClick={submit}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "78px",
            }}
          >
            <h3>Enter verification code for {email}</h3>
          </div>
          <OtpInput
            value={otp}
            onChange={onOTPchange}
            numInputs={6}
            shouldAutoFocus={true}
            skipDefaultStyles={true}
            inputStyle={{
              height: "80px",
              width: "60px",
              border: "1px solid gray",
              borderRadius: "6px",
              textAlign: "center",
              fontSize: "36px",
            }}
            renderSeparator={<span style={{ width: "36px" }}></span>}
            renderInput={(props) => <input {...props} />}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "48px",
            }}
          >
            <span style={{ marginBottom: "18px", color: "red" }}>{errMsg}</span>
            <Button type="primary" block onClick={submit}>
              OK
            </Button>
            <Button type="link" block onClick={resend}>
              Resend
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
