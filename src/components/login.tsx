import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import type { RadioChangeEvent } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Tabs,
  Radio,
  message,
  Divider,
} from "antd";
import OtpInput from "react-otp-input";
import axios from "axios";
import { useProfileStore } from "../stores";
import { timerBySec } from "../helpers";
import { emailValidate } from "../helpers";
import {
  loginWithPasswordReq,
  loginWithOTPReq,
  loginWithOTPVerifyReq,
} from "../requests";
import AppHeader from "./appHeader";
import AppFooter from "./appFooter";
const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const onEmailChange = (evt: ChangeEvent<HTMLInputElement>) =>
    setEmail(evt.target.value);
  const onPasswordChange = (evt: ChangeEvent<HTMLInputElement>) =>
    setPassword(evt.target.value);
  const [loginType, setLoginType] = useState<"password" | "OTP">("password"); // password | OTP

  const onLoginTypeChange = (e: RadioChangeEvent) => {
    // console.log("radio checked", e.target.value);
    setLoginType(e.target.value);
  };

  const goSignup = () => navigate(`${APP_PATH}signup`);

  useEffect(() => {
    if (location.state && location.state.msg) {
      message.info(location.state.msg);
    }
  }, []);

  return (
    <div
      style={{
        height: "calc(100vh - 164px)",
        overflowY: "auto",
      }}
    >
      {" "}
      <AppHeader />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "200px",
        }}
      >
        <h1 style={{ marginBottom: "36px" }}>Customer Login</h1>
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
          {loginType == "password" ? (
            <LoginWithPassword
              email={email}
              onEmailChange={onEmailChange}
              password={password}
              onPasswordChange={onPasswordChange}
            />
          ) : (
            <LoginWithOTP email={email} onEmailChange={onEmailChange} />
          )}
        </div>
        <div
          style={{
            display: "flex",
            color: "#757575",
            justifyContent: "center",
            alignItems: "center",
            // margin: "-48px 0 18px 0",
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

// email + Pasword Login
const LoginWithPassword = ({
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
  console.log("email1: ", email);
  const profileStore = useProfileStore();
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const onEmailChange = (evt) => setEmail(evt.target.value);
  // const onPasswordChange = (evt) => setPassword(evt.target.value);
  const onSubmit = async () => {
    setErrMsg("");
    setSubmitting(true);
    try {
      const loginRes = await loginWithPasswordReq(email, password);
      setSubmitting(false);
      console.log("login res: ", loginRes);
      if (loginRes.data.code != 0) {
        throw new Error(loginRes.data.message);
      }
      localStorage.setItem("token", loginRes.data.data.Token);
      loginRes.data.data.User.token = loginRes.data.data.Token;
      profileStore.setProfile(loginRes.data.data.User);
      console.log("login res: ", loginRes.data.data.User);
      navigate(`${APP_PATH}profile/subscription`, {
        state: { from: "login" },
      });
    } catch (err) {
      setSubmitting(false);
      if (err instanceof Error) {
        console.log("login err: ", err.message);
        setErrMsg(err.message);
      } else {
        setErrMsg("Unknown error");
      }
    }
  };
  return (
    <Form
      name="basic"
      labelCol={{ span: 10 }}
      wrapperCol={{ span: 14 }}
      style={{ maxWidth: 640 }}
      // autoComplete="off"
    >
      <Form.Item
        label="Email"
        // name="email"
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
        // name="password"
        rules={[
          {
            required: true,
            message: "Please input your password!",
          },
        ]}
      >
        <Input.Password value={password} onChange={onPasswordChange} />
      </Form.Item>

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
        <Button
          type="primary"
          htmlType="submit"
          onClick={onSubmit}
          loading={submitting}
          disabled={submitting}
        >
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

// OTP login
const LoginWithOTP = ({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  console.log("email2: ", email);
  const NUM_INPUTS = 6;
  const [currentStep, setCurrentStep] = useState(0); // 0: input email, 1: input code
  const profileStore = useProfileStore();
  const [otp, setOtp] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [countdownVal, setCountdownVal] = useState(10); // countdown value in second
  const [counting, setCounting] = useState(false);
  const countdownReqId = useRef<number>(0);
  const [form] = Form.useForm();

  const countdown = (val: number) => {
    const valBK = val;
    setCounting(true);
    let lastTime = new Date().getTime();
    (function timer() {
      countdownReqId.current = requestAnimationFrame(timer);
      const currentTime = new Date().getTime();
      if (currentTime - lastTime >= 1000) {
        lastTime = currentTime;
        val--;
        val >= 0 && setCountdownVal(val);
        val == 0 && setCounting(false);
        val < 0 &&
          (setCountdownVal(valBK),
          cancelAnimationFrame(countdownReqId.current));
      }
    })();
  };

  useEffect(() => {
    // timerBySec(10, setCountdownVal);
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    };
    document.addEventListener("keydown", keyDownHandler);
    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, []);

  // console.log("cd val: ", countdownVal);
  const onOTPchange = (value: string) => {
    setOtp(value.toUpperCase());
  };

  // send mail, receive code
  const loginStep1 = async () => {
    setOtp("");
    setSubmitting(true);
    try {
      const loginRes = await loginWithOTPReq(email);
      setSubmitting(false);
      console.log("login res: ", loginRes);
      if (loginRes.data.code != 0) {
        setErrMsg(loginRes.data.message);
        throw new Error(loginRes.data.message);
      }
      setCurrentStep(1);
      message.success("Code sent, please check your email");
    } catch (err) {
      setSubmitting(false);
      if (err instanceof Error) {
        console.log("login err: ", err.message);
        setErrMsg(err.message);
      } else {
        setErrMsg("Unkown error");
      }
    }
  };

  // send code to verify
  const loginStep2 = async () => {
    setSubmitting(true);
    try {
      const loginRes = await loginWithOTPVerifyReq(email, otp);
      setSubmitting(false);
      console.log("otp loginVerify res: ", loginRes);
      if (loginRes.data.code != 0) {
        setErrMsg(loginRes.data.message);
        throw new Error(loginRes.data.message);
      }
      localStorage.setItem("token", loginRes.data.data.Token);
      loginRes.data.data.User.token = loginRes.data.data.Token;
      profileStore.setProfile(loginRes.data.data.User);
      console.log("otp verified user: ", loginRes.data.data.User);
      navigate(`${APP_PATH}profile/subscription`, {
        state: { from: "login" },
      });
    } catch (err) {
      setSubmitting(false);
      if (err instanceof Error) {
        console.log("login err: ", err.message);
        setErrMsg(err.message);
      } else {
        setErrMsg("Unknown error");
      }
    }
  };

  const resend = () => {
    countdown(countdownVal);
    loginStep1();
  };

  const validateFields = () => {
    //
  };

  const submit = async () => {
    if (currentStep == 0) {
      if (!emailValidate(email)) {
        console.log("invalid email in validator, not in rules: ", email);
        return;
      }
    } else {
      if (otp.trim().length != NUM_INPUTS) {
        return;
      }
    }

    if (currentStep == 0) {
      loginStep1();
    } else {
      loginStep2();
    }
  };

  return (
    <div>
      {currentStep == 0 ? (
        <Form
          form={form}
          onFinish={submit}
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
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            // name="email"
            rules={[
              {
                required: true,
                message: "Please input your email!",
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  console.log("form rule: ", email, "/", rule, "//", value);
                  if (emailValidate(email)) {
                    return Promise.resolve();
                  }
                  return Promise.reject("Invalid email address");
                },
              }),
            ]}
          >
            <Input value={email} onChange={onEmailChange} />
          </Form.Item>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "18px",
              color: "red",
            }}
          >
            {errMsg}
          </div>

          <Form.Item
            wrapperCol={{
              offset: 8,
              span: 16,
            }}
          >
            <Button
              type="primary"
              htmlType="submit"
              onClick={submit}
              loading={submitting}
              disabled={submitting}
            >
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
            numInputs={NUM_INPUTS}
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
            <Button
              type="primary"
              block
              onClick={submit}
              loading={submitting}
              disabled={submitting}
            >
              OK
            </Button>
            <div>
              <Button type="link" block onClick={() => setCurrentStep(0)}>
                Go back
              </Button>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Button type="link" onClick={resend} disabled={counting}>
                  Resend
                </Button>
                {counting && <span> in {countdownVal} seconds</span>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
