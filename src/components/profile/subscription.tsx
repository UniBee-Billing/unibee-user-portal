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
  }, []);

  return <div>my subscription detail page</div>;
};

export default Index;
