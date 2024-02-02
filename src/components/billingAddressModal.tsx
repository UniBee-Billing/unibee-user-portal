import { Button, Form, Modal, Input, Select, message } from "antd";
import { useProfileStore } from "../stores";
import { getCountryList, saveProfile } from "../requests";
import { useEffect, useState } from "react";
import { Country, IProfile } from "../shared.types";
import { useNavigate } from "react-router-dom";
const APP_PATH = import.meta.env.BASE_URL;

interface Props {
  isOpen: boolean;
  closeModal: () => void;
  openPreviewModal: () => void;
}
const Index = ({ isOpen, closeModal, openPreviewModal }: Props) => {
  const navigate = useNavigate();
  const profile = useProfileStore.getState();
  const [form] = Form.useForm();
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const hiddenFields = [
    "id",
    "countryName",
    "vATNumber",
    "telegram",
    "whatsAPP",
    "weChat",
    "linkedIn",
    "facebook",
    "tikTok",
    "otherSocialInfo",
    "paymentMethod",
  ];

  const onConfirm = async () => {
    const user: IProfile = form.getFieldsValue();
    setLoading(true);
    try {
      const saveProfileRes = await saveProfile(user);
      setLoading(false);
      console.log("save profile res: ", saveProfileRes);
      const code = saveProfileRes.data.code;
      if (code != 0) {
        code == 61 && relogin();
        // TODO: save all statu code in a constant
        throw new Error(saveProfileRes.data.message);
      }
      message.success("saved");
      profile.setProfile(user);
      closeModal();
      openPreviewModal();
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("profile update err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    const fetchData = async () => {
      let countryListRes;
      try {
        countryListRes = await getCountryList(15621); // merchantId
        console.log("country list res: ", countryListRes);
        if (countryListRes.data.code != 0) {
          throw new Error(countryListRes.data.message);
        }
        setCountryList(
          countryListRes.data.data.vatCountryList.map((c: any) => ({
            code: c.countryCode,
            name: c.countryName,
          }))
        );
      } catch (err) {
        if (err instanceof Error) {
          console.log("err: ", err.message);
          message.error(err.message);
        } else {
          message.error("Unknown error");
        }
        return;
      }
    };
    fetchData();
  }, []);

  const countryCode = Form.useWatch("countryCode", form);
  useEffect(() => {
    countryCode &&
      form.setFieldValue(
        "countryName",
        countryList.find((c) => c.code == countryCode)!.name
      );
  }, [countryCode]);

  return (
    <Modal
      title="Fill out your billing address"
      width={"640px"}
      open={isOpen}
      footer={null}
      closeIcon={null}
    >
      <div style={{ height: "24px" }}></div>
      <Form
        form={form}
        name="basic"
        labelCol={{
          span: 5,
        }}
        wrapperCol={{
          span: 16,
        }}
        style={{
          maxWidth: 600,
        }}
        initialValues={profile}
        autoComplete="off"
      >
        {hiddenFields.map((f, idx) => (
          <Form.Item key={idx} label={f} name={f} hidden>
            <Input disabled />
          </Form.Item>
        ))}
        <Form.Item label="First name" name="firstName">
          <Input disabled />
        </Form.Item>

        <Form.Item label="Last name" name="lastName">
          <Input disabled />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Phone"
          name="phone"
          rules={[
            {
              required: true,
              message: "Please input your phone!",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Country"
          name="countryCode"
          rules={[
            {
              required: true,
              message: "Please select your country!",
            },
          ]}
        >
          <Select
            // value={country}
            // onChange={onCountryChange}
            showSearch
            placeholder="Type to search"
            optionFilterProp="children"
            // onSearch={onSearch}
            filterOption={filterOption}
            options={countryList.map((c) => ({
              label: c.name,
              value: c.code,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Billing address"
          name="address"
          rules={[
            {
              required: true,
              message: "Please input your billing address!",
            },
          ]}
        >
          <Input />
        </Form.Item>

        {/*
              <Form.Item
                wrapperCol={{
                  offset: 8,
                  span: 16,
                }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  // onClick={onSubmit}
                  // loading={submitting}
                >
                  Submit
                </Button>
              </Form.Item>
            */}
      </Form>
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          alignItems: "center",
          gap: "18px",
          marginTop: "24px",
        }}
      >
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};

export default Index;
