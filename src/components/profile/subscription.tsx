import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

const Index = () => {
  const [errMsg, setErrMsg] = useState("");
  const [firstLoading, setFirstLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({});
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = Number(localStorage.getItem("userId"));
    console.log("userId: ", userId, "///", typeof userId);
    axios
      .post(
        `${API_URL}/user/subscription/subscription_list`,
        {
          merchantId: 15621,
          userId,
          // status: 0,
          page: 0,
          count: 100,
        },
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("user subscription list res: ", res);
        const statuCode = res.data.code;
        if (statuCode != 0) {
          if (statuCode == 61) {
            console.log("invalid token");
            navigate(`${APP_PATH}login`, {
              state: { msg: "session expired, please re-login" },
            });
            return;
          }
          throw new Error(res.data.message);
        }
        // setPreview(res.data.data);
      })
      .catch((err) => {
        console.log("user subscription list err: ", err);
        messageApi.open({
          type: "error",
          content: err.message,
        });
      });
  }, []);

  return (
    <div>
      {contextHolder}
      <h1>Subscription list</h1>
    </div>
  );
};

export default Index;
