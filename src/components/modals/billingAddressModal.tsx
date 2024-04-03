import { Button, Form, Input, Modal, Select, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCountryList, saveProfileReq } from '../../requests';
import { Country, IProfile } from '../../shared.types';
import { useAppConfigStore, useProfileStore } from '../../stores';

const APP_PATH = import.meta.env.BASE_URL;

interface Props {
  isOpen: boolean;
  closeModal: () => void;
  openPreviewModal: () => void;
}
const Index = ({ isOpen, closeModal, openPreviewModal }: Props) => {
  // const appConfigStore = useAppConfigStore();
  const navigate = useNavigate();
  const profile = useProfileStore.getState();
  const [form] = Form.useForm();
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: 'session expired, please re-login' },
    });

  const hiddenFields = [
    'id',
    'countryName',
    'vATNumber',
    'telegram',
    'whatsAPP',
    'weChat',
    'linkedIn',
    'facebook',
    'tikTok',
    'otherSocialInfo',
    'paymentMethod',
  ];

  const onConfirm = async () => {
    const user: IProfile = form.getFieldsValue();
    setLoading(true);
    const [saveProfileRes, err] = await saveProfileReq(user);
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    message.success('saved');
    profile.setProfile(user);
    closeModal();
    openPreviewModal();
  };

  const filterOption = (
    input: string,
    option?: { label: string; value: string },
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    const fetchData = async () => {
      const [list, err] = await getCountryList();
      if (null != err) {
        message.error(err.message);
        return;
      }
      setCountryList(
        list.map((c: any) => ({
          code: c.countryCode,
          name: c.countryName,
        })),
      );
    };
    fetchData();
  }, []);

  const countryCode = Form.useWatch('countryCode', form);
  useEffect(() => {
    countryCode &&
      form.setFieldValue(
        'countryName',
        countryList.find((c) => c.code == countryCode)!.name,
      );
  }, [countryCode]);

  return (
    <Modal
      title="Fill out your billing address"
      width={'640px'}
      open={isOpen}
      footer={null}
      closeIcon={null}
    >
      <div style={{ height: '24px' }}></div>
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
          <Input />
        </Form.Item>

        <Form.Item label="Last name" name="lastName">
          <Input />
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
              message: 'Please input your phone!',
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
              message: 'Please select your country!',
            },
          ]}
        >
          <Select
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
              message: 'Please input your billing address!',
            },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
      <div
        style={{
          display: 'flex',
          justifyContent: 'end',
          alignItems: 'center',
          gap: '18px',
          marginTop: '24px',
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
