import axios from "axios";
import React, { useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Cascader,
  Checkbox,
  ColorPicker,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Slider,
  Switch,
  TreeSelect,
  Upload,
} from "antd";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const normFile = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

const Index = () => {
  const token = localStorage.getItem("token");
  useEffect(() => {
    axios
      .get(`${API_URL}/auth/v1/sso/profile`, {
        headers: {
          Authorization: `${token}`, // Bearer: ******
        },
      })
      .then((res) => {
        console.log("login res: ", res);
        if (res.data.code != 0) {
          throw new Error(res.data.message);
        }
        // if (res.data.code) navigate("/Dashboard");
      })
      .catch((err) => {
        console.log("login err: ", err.message);
        // setErrMsg(err.message);
      });
  }, []);

  return (
    <div>
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 24 }}
        layout="horizontal"
        // disabled={componentDisabled}
        style={{ maxWidth: 600 }}
      >
        {/* <Form.Item label="Checkbox" name="disabled" valuePropName="checked">
          <Checkbox>Checkbox</Checkbox>
  </Form.Item> */}

        <Form.Item label="First name ">
          <Input />
        </Form.Item>
        <Form.Item label="Last name">
          <Input />
        </Form.Item>

        <Form.Item label="Email">
          <Input />
        </Form.Item>

        <Form.Item label="Billing address">
          <Input />
        </Form.Item>

        <Form.Item label="Phone number">
          <Input />
        </Form.Item>

        <Form.Item label="Payment methods">
          <Radio.Group>
            <Radio value="creditCard">Credit Card</Radio>
            <Radio value="crypto">Crypto</Radio>
            <Radio value="paypal">Paypal</Radio>
            <Radio value="wireTransfer">Wire Transfer</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Index;
