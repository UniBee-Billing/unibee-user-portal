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
import {
  FacebookOutlined,
  GithubOutlined,
  LinkedinOutlined,
  TwitterOutlined,
} from "@ant-design/icons";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const onEmailChange = (evt: ChangeEvent<HTMLInputElement>) =>
    setEmail(evt.target.value);
  const onPasswordChange = (evt: ChangeEvent<HTMLInputElement>) =>
    setPassword(evt.target.value);
  const [loginType, setLoginType] = useState("password"); // password | OTP

  const onLoginTypeChange = (e: RadioChangeEvent) => {
    // console.log("radio checked", e.target.value);
    setLoginType(e.target.value);
  };

  const goSignup = () => navigate(`${APP_PATH}signup`);

  useEffect(() => {
    if (location.state && location.state.msg) {
      messageApi.open({
        type: "info",
        content: location.state.msg,
      });
    }
  }, []);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "200px",
        }}
      >
        {contextHolder}
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
      <div
        style={{
          position: "absolute",
          bottom: "0",
          height: "128px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          background: "#192733",
          color: "#FFF",
        }}
      >
        <div style={{ width: "80%" }}>
          <Divider style={{ border: "#FFF", width: "80%" }}>
            <div style={{ display: "flex", gap: "24px", color: "#FFF" }}>
              <GithubOutlined style={{ fontSize: "24px" }} />
              <TwitterOutlined style={{ fontSize: "24px" }} />
              <LinkedinOutlined style={{ fontSize: "24px" }} />
              <FacebookOutlined style={{ fontSize: "24px" }} />
            </div>
          </Divider>
          <div
            style={{
              color: "#FFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Copyright © 2024 UniBee, Inc.
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;

// email + Pasword
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
  const profileStore = useProfileStore();
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const onEmailChange = (evt) => setEmail(evt.target.value);
  // const onPasswordChange = (evt) => setPassword(evt.target.value);
  const onSubmit = () => {
    setErrMsg("");
    setSubmitting(true);
    axios
      .post(`${API_URL}/user/auth/sso/login`, {
        email,
        password,
      })
      .then((res) => {
        setSubmitting(false);
        console.log("login res: ", res);
        if (res.data.code != 0) {
          throw new Error(res.data.message);
        }
        localStorage.setItem("token", res.data.data.Token);
        res.data.data.User.token = res.data.data.Token;
        profileStore.setProfile(res.data.data.User);
        console.log("res.data.data.User: ", res.data.data.User);
        navigate(`${APP_PATH}profile/subscription`);
      })
      .catch((err) => {
        setSubmitting(false);
        console.log("login err: ", err.message);
        setErrMsg(err.message);
      });
  };
  return (
    <Form
      name="basic"
      labelCol={{ span: 10 }}
      wrapperCol={{ span: 14 }}
      style={{ maxWidth: 640 }}
      // initialValues={{ remember: true}}
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

const LoginWithOTP = ({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
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
      console.log("User pressed: ", event.key, "//", otp);
      if (event.key === "Enter") {
        event.preventDefault();
        if (otp.trim().length < NUM_INPUTS) {
          return;
        }
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

  // duplicate code, refactor it
  const resend = () => {
    countdown(countdownVal);
    setOtp("");
    axios
      .post(`${API_URL}/user/auth/sso/loginOTP`, {
        email,
      })
      .then((res) => {
        console.log("login res: ", res);
        if (res.data.code != 0) {
          setErrMsg(res.data.message);
          throw new Error(res.data.message);
        }
        setCurrentStep(1);
        message.success("Code sent, please check your email");
      })
      .catch((err) => {
        console.log("login err: ", err.message);
        setErrMsg(err.message);
      });
  };

  const submit = () => {
    setErrMsg("");
    console.log("submitting..");
    setSubmitting(true);
    if (currentStep == 0) {
      axios
        .post(`${API_URL}/user/auth/sso/loginOTP`, {
          email,
        })
        .then((res) => {
          setSubmitting(false);
          console.log("login res: ", res);
          if (res.data.code != 0) {
            setErrMsg(res.data.message);
            throw new Error(res.data.message);
          }
          setCurrentStep(1);
        })
        .catch((err) => {
          setSubmitting(false);
          console.log("login err: ", err.message);
          setErrMsg(err.message);
        });
    } else {
      axios
        .post(`${API_URL}/user/auth/sso/loginOTPVerify`, {
          email,
          verificationCode: otp,
        })
        .then((res) => {
          setSubmitting(false);
          console.log("otp loginVerify res: ", res);
          if (res.data.code != 0) {
            setErrMsg(res.data.message);
            throw new Error(res.data.message);
          }
          localStorage.setItem("token", res.data.data.Token);
          res.data.data.User.token = res.data.data.Token;
          profileStore.setProfile(res.data.data.User);
          console.log("res.data.data.User: ", res.data.data.User);
          navigate(`${APP_PATH}profile/subscription`);
        })
        .catch((err) => {
          setSubmitting(false);
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
