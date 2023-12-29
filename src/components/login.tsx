import React, { useState } from "react";
import { Radio } from "antd";
import type { RadioChangeEvent } from "antd";

const Index = () => {
  const [loginType, setLoginType] = useState("password"); // [password, OTP]

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
        }}
      >
        {/* <div style={{ height: "36px" }}></div> */}

        {/* <div style={{ height: "48px" }}></div> */}
        {loginType == "password" ? <Login1 /> : <Login2 />}
      </div>
    </div>
  );
};

export default Index;

const Login1 = () => <div>Password login</div>;

const Login2 = () => <div>OTP login</div>;
