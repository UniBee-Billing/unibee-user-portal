import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "../../stores";
import { getProfile, saveProfile } from "../../requests";
import { Country } from "../../shared.types";
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
import { getCountryList } from "../../requests";

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
  const [firstLoading, setFirstLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({}); // ?????????? why do I need this??????
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [countryList, setCountryList] = useState<Country[]>([]);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const onSave = async () => {
    console.log("form: ", form.getFieldsValue());
    setUpdating(true);
    let saveProfileRes;
    try {
      saveProfileRes = await saveProfile(form.getFieldsValue());
      console.log("save profile res: ", saveProfileRes);
      const code = saveProfileRes.data.code;
      if (code != 0) {
        code == 61 && relogin();
        // TODO: save all statu code in a constant
        throw new Error(saveProfileRes.data.message);
      }
      message.success("saved");
      setProfile(saveProfileRes.data.data.User);
      setUpdating(false);
    } catch (err) {
      setUpdating(false);
      if (err instanceof Error) {
        console.log("profile update err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }
  };

  useEffect(() => {
    setFirstLoading(true);
    const fetchData = async () => {
      let profileRes, countryListRes;
      try {
        const res = ([profileRes, countryListRes] = await Promise.all([
          getProfile(),
          getCountryList(15621),
        ]));
        console.log("profile/country: ", profileRes, "//", countryListRes);
        res.forEach((r) => {
          const code = r.data.code;
          code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
          if (code != 0) {
            // TODO: save all the code as ENUM in constant,
            throw new Error(r.data.message);
          }
        });
        setUpdating(false);
        setFirstLoading(false);
      } catch (err) {
        setUpdating(false);
        setFirstLoading(false);
        if (err instanceof Error) {
          console.log("profile update err: ", err.message);
          message.error(err.message);
        } else {
          message.error("Unknown error");
        }
        return;
      }
      setProfile(profileRes.data.data.User);
      setCountryList(
        countryListRes.data.data.vatCountryList.map((c: any) => ({
          code: c.countryCode,
          name: c.countryName,
        }))
      );
    };

    fetchData();
  }, []);

  const countryCode = Form.useWatch("countryCode", form);
  console.log("country code watch: ", countryCode);
  useEffect(() => {
    countryCode &&
      form.setFieldValue(
        "countryName",
        countryList.find((c) => c.code == countryCode)!.name
      );
  }, [countryCode]);

  return (
    <div>
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

          <Form.Item label="Country" name="countryCode">
            <Select
              showSearch
              placeholder="Type to search"
              optionFilterProp="children"
              // value={country}
              // onChange={onCountryChange}
              // onSearch={onSearch}
              filterOption={filterOption}
              options={countryList.map((c) => ({
                label: c.name,
                value: c.code,
              }))}
            />
          </Form.Item>

          <Form.Item label="Country Name" name="countryName" hidden>
            <Input />
          </Form.Item>

          <Form.Item label="Company name" name="companyName">
            <Input />
          </Form.Item>

          <Form.Item label="VAT number" name="vATNumber">
            <Input />
          </Form.Item>

          <Form.Item label="Phone number" name="phone">
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
              <Radio value="CreditCard">Credit Card</Radio>
              <Radio value="Crypto">Crypto</Radio>
              <Radio value="PayPal">PayPal</Radio>
              <Radio value="WireTransfer">Wire Transfer</Radio>
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
