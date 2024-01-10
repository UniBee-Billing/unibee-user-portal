import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "../../stores";

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
  message,
} from "antd";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const APP_PATH = import.meta.env.BASE_URL; // default is / (if no --base specified in build cmd)
const API_URL = import.meta.env.VITE_API_URL;

const normFile = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

const Index = () => {
  const profileStore = useProfileStore();
  const [errMsg, setErrMsg] = useState("");
  const [firstLoading, setFirstLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({});
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const onSave = () => {
    console.log("form: ", form.getFieldsValue());
    setUpdating(true);
    axios
      .post(`${API_URL}/user/profile`, form.getFieldsValue(), {
        headers: {
          Authorization: `${profileStore.token}`, // Bearer: ******
        },
      })
      .then((res) => {
        console.log("profile update res: ", res);
        setUpdating(false);
        if (res.data.code != 0) {
          if (res.data.code == 61) {
            // TODO: save all statu code in a constant
            navigate(`${APP_PATH}login`, {
              state: { msg: "Session expired, please re-login" },
            });
            return;
          }
          throw new Error(res.data.message);
        }
        messageApi.open({
          type: "success",
          content: "saved",
        });
        // setProfile(res.data.data.User);
        // console.log("profile: ", res.data.data.User);
      })
      .catch((err) => {
        setUpdating(false);
        console.log("profile update err: ", err.message);
        setErrMsg(err.message);
        messageApi.open({
          type: "error",
          content: err.message,
        });
      });
  };

  useEffect(() => {
    setFirstLoading(true);
    axios
      .get(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `${profileStore.token}`, // Bearer: ******
        },
      })
      .then((res) => {
        console.log("profile res: ", res);
        setFirstLoading(false);
        if (res.data.code != 0) {
          if (res.data.code == 61) {
            // TODO: save all statu code in a constant
            navigate(`${APP_PATH}login`, {
              state: { msg: "Session expired, please re-login" },
            });
            return;
          }
          throw new Error(res.data.message);
        }
        setProfile(res.data.data.User);
        console.log("profile: ", res.data.data.User);
        // populate profile data in table
      })
      .catch((err) => {
        setFirstLoading(false);
        console.log("profile err: ", err.message);
        setErrMsg(err.message);
      });
  }, []);

  return (
    <div>
      {contextHolder}
      {firstLoading ? null : (
        <Form
          form={form}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 24 }}
          layout="horizontal"
          // disabled={componentDisabled}
          style={{ maxWidth: 600 }}
          initialValues={profile}
        >
          <Form.Item label="ID" name="id" hidden>
            <Input disabled />
          </Form.Item>

          <Form.Item label="First name" name="firstName">
            <Input />
          </Form.Item>

          <Form.Item label="Last name" name="lastName">
            <Input />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input disabled />
          </Form.Item>

          <Form.Item label="Billing address" name="address">
            <Input />
          </Form.Item>

          <Form.Item label="Company name" name="companyName">
            <Input />
          </Form.Item>

          <Form.Item label="VAT number" name="vATNumber">
            <Input />
          </Form.Item>

          <Form.Item label="Phone number" name="mobile">
            <Input />
          </Form.Item>

          <Form.Item label="Telegram" name="telegram">
            <Input />
          </Form.Item>

          <Form.Item label="WhatsApp" name="whatsAPP">
            <Input />
          </Form.Item>

          <Form.Item label="WeChat" name="weChat">
            <Input />
          </Form.Item>

          <Form.Item label="LinkedIn" name="linkedIn">
            <Input />
          </Form.Item>

          <Form.Item label="Facebook" name="facebook">
            <Input />
          </Form.Item>

          <Form.Item label="TikTok" name="tikTok">
            <Input />
          </Form.Item>

          <Form.Item label="Other social info" name="otherSocialInfo">
            <Input />
          </Form.Item>

          <Form.Item label="Payment methods" name="paymentMethod">
            <Radio.Group>
              <Radio value="creditCard">Credit Card</Radio>
              <Radio value="crypto">Crypto</Radio>
              <Radio value="paypal">Paypal</Radio>
              <Radio value="wireTransfer">Wire Transfer</Radio>
            </Radio.Group>
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "36px",
            }}
          >
            <Button type="primary" onClick={onSave} disabled={updating}>
              Save
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default Index;
