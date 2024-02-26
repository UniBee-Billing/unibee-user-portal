import { LoadingOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Spin,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { passwordRegx } from '../../helpers';
import {
  getCountryList,
  getProfile,
  logoutReq,
  resetPassReq,
  saveProfile,
} from '../../requests';
import { Country, IProfile } from '../../shared.types';
import { useAppConfigStore, useProfileStore } from '../../stores';
import { useRelogin } from '../hooks';

const APP_PATH = import.meta.env.BASE_URL; // default is / (if no --base specified in build cmd)
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  // const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<IProfile | null>(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const togglePasswordModal = () => setResetPasswordModal(!resetPasswordModal);
  const profileStore = useProfileStore();
  const relogin = useRelogin();

  const filterOption = (
    input: string,
    option?: { label: string; value: string },
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  const onSave = async () => {
    console.log('form: ', form.getFieldsValue());
    setLoading(true);
    let saveProfileRes;
    try {
      saveProfileRes = await saveProfile(form.getFieldsValue());
      setLoading(false);
      console.log('save profile res: ', saveProfileRes);
      const code = saveProfileRes.data.code;
      if (code != 0) {
        code == 61 && relogin();
        throw new Error(saveProfileRes.data.message);
      }
      message.success('saved');
      setProfile(saveProfileRes.data.data.User);
      profileStore.setProfile(saveProfileRes.data.data.User);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('profile update err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
      return;
    }
  };

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      let profileRes, countryListRes;
      try {
        const res = ([profileRes, countryListRes] = await Promise.all([
          getProfile(),
          getCountryList(),
        ]));
        setLoading(false);
        console.log('res: ', res);
        res.forEach((r) => {
          const code = r.data.code;
          code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
          if (code != 0) {
            throw new Error(r.data.message);
          }
        });
      } catch (err) {
        setLoading(false);
        if (err instanceof Error) {
          console.log('profile update err: ', err.message);
          message.error(err.message);
        } else {
          message.error('Unknown error');
        }
        return;
      }
      setProfile(profileRes.data.data.User);
      setCountryList(
        countryListRes.data.data.vatCountryList.map((c: any) => ({
          code: c.countryCode,
          name: c.countryName,
        })),
      );
    };
    fetchData();
  }, []);

  const countryCode = Form.useWatch('countryCode', form);
  console.log('country code watch: ', countryCode);
  useEffect(() => {
    countryCode &&
      form.setFieldValue(
        'countryName',
        countryList.find((c) => c.code == countryCode)!.name,
      );
  }, [countryCode]);

  return (
    <div>
      {resetPasswordModal && (
        <ResetPasswordModal
          closeModal={togglePasswordModal}
          email={profileStore.email}
        />
      )}
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      {loading ? null : (
        <Form
          form={form}
          // labelCol={{ span: 6 }}
          // wrapperCol={{ span: 24 }}
          // layout="horizontal"
          // disabled={componentDisabled}
          // style={{ maxWidth: 600 }}
          initialValues={profile ?? {}}
        >
          <Form.Item label="ID" name="id" hidden>
            <Input disabled />
          </Form.Item>

          <Row className="my-4 flex items-center" gutter={[8, 8]}>
            <Col span={4}>First Name</Col>
            <Col span={6}>
              <Form.Item name="firstName" noStyle={true}>
                <Input style={{ width: '80%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>Last Name</Col>
            <Col span={6}>
              <Form.Item name="lastName" noStyle={true}>
                <Input style={{ width: '80%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row className="my-4 flex items-center" gutter={[8, 8]}>
            <Col span={4}>Email </Col>
            <Col span={6}>
              <Form.Item name="email" noStyle={true}>
                <Input disabled style={{ width: '80%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>Billing Address</Col>
            <Col span={6}>
              <Form.Item
                noStyle={true}
                name="address"
                rules={[
                  {
                    required: true,
                    message: 'Please input your billing address!',
                  },
                ]}
              >
                <Input style={{ width: '80%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Country Name" name="countryName" hidden>
            <Input />
          </Form.Item>

          <Row className="my-4 flex items-center" gutter={[8, 8]}>
            <Col span={4}>Country </Col>
            <Col span={6}>
              <Form.Item
                name="countryCode"
                noStyle={true}
                rules={[
                  {
                    required: true,
                    message: 'Please select your country!',
                  },
                ]}
              >
                <Select
                  style={{ width: '80%' }}
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
            </Col>
            <Col span={4}>Comapny Name</Col>
            <Col span={6}>
              {' '}
              <Form.Item name="companyName" noStyle={true}>
                <Input style={{ width: '80%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row className="my-4 flex items-center" gutter={[8, 8]}>
            <Col span={4}>VAT Number</Col>
            <Col span={6}>
              {' '}
              <Form.Item name="vATNumber" noStyle={true}>
                <Input style={{ width: '80%' }} />
              </Form.Item>{' '}
            </Col>
            <Col span={4}>Phone Number</Col>
            <Col span={6}>
              <Form.Item name="phone" noStyle={true}>
                <Input style={{ width: '80%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider
            orientation="left"
            style={{ margin: '32px 0', color: '#757575' }}
          >
            Social Info{' '}
          </Divider>
          {[
            [
              { label: 'Telegram', name: 'telegram' },
              { label: 'WhatsApp', name: 'whatsAPP' },
            ],
            [
              { label: 'WeChat', name: 'weChat' },
              { label: 'LinkedIn', name: 'linkedIn' },
            ],
            [
              { label: 'Facebook', name: 'facebook' },
              { label: 'TikTok', name: 'tikTok' },
            ],
            [{ label: 'Other Social Info', name: 'otherSocialInfo' }],
          ].map((s, idx) => (
            <Row key={idx} className="my-4 flex items-center" gutter={[8, 8]}>
              <Col span={4}>{s[0].label}</Col>
              <Col span={6}>
                <Form.Item name={s[0].name} noStyle={true}>
                  <Input style={{ width: '80%' }} />
                </Form.Item>
              </Col>
              {s[1] != null && (
                <>
                  <Col span={4}>{s[1].label}</Col>
                  <Col span={6}>
                    <Form.Item name={s[1].name} noStyle={true}>
                      <Input />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>
          ))}

          <Row className="my-4 flex items-center" gutter={[8, 8]}>
            <Col span={4}>Payment Methods</Col>
            <Col span={10}>
              <Form.Item name="paymentMethod" noStyle={true}>
                <Radio.Group>
                  <Radio value="CreditCard">Credit Card</Radio>
                  <Radio value="Crypto">Crypto</Radio>
                  <Radio value="PayPal">PayPal</Radio>
                  <Radio value="WireTransfer">Wire Transfer</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <div className="mx-8 my-8 flex justify-center">
            <Button onClick={togglePasswordModal}>Change Password</Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              type="primary"
              onClick={onSave}
              disabled={loading}
              loading={loading}
            >
              Save
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default Index;

interface IResetPassProps {
  email: string;
  closeModal: () => void;
}
const ResetPasswordModal = ({ email, closeModal }: IResetPassProps) => {
  const relogin = useRelogin();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    localStorage.removeItem('token');
    try {
      await logoutReq();
      navigate(`${APP_PATH}login`, {
        state: { msg: 'Password reset succeeded, please relogin.' },
      });
    } catch (err) {
      if (err instanceof Error) {
        console.log('logout err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  const onConfirm = async () => {
    const formValues = form.getFieldsValue();
    setLoading(true);
    try {
      const res = await resetPassReq(
        formValues.oldPassword,
        formValues.newPassword,
      );
      setLoading(false);
      console.log('reset pass res: ', res);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      await logout();
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('reset password err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  return (
    <Modal
      title="Change Password"
      open={true}
      width={'640px'}
      footer={null}
      closeIcon={null}
    >
      <Form
        form={form}
        onFinish={onConfirm}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        className="my-6"
        initialValues={{
          email,
          oldPassword: '',
          newPassword: '',
          newPassword2: '',
        }}
      >
        <Form.Item
          label="Old Password"
          name="oldPassword"
          rules={[
            {
              required: true,
              message: 'Please input your old password!',
            },
          ]}
        >
          <Input.Password />
        </Form.Item>

        {/* <div className="mb-4 flex justify-center text-red-500">{errMsg}</div> */}

        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[
            {
              required: true,
              message: 'Please input your new password!',
            },
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (getFieldValue('oldPassword') == value) {
                  return Promise.reject(
                    'New password should not be the same as old password.',
                  );
                }
                if (passwordRegx.test(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  '8-15 characters with lowercase, uppercase, numeric and special character(@ $ # ! % ? * &  ^)',
                );
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="New Password Confirm"
          name="newPassword2"
          rules={[
            {
              required: true,
              message: 'Please retype your new password!',
            },
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (value == getFieldValue('newPassword')) {
                  return Promise.resolve();
                }
                return Promise.reject('Please retype the same password');
              },
            }),
          ]}
        >
          <Input.Password onPressEnter={form.submit} />
        </Form.Item>
      </Form>

      <div className="my-6 flex items-center justify-end">
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Button
          type="primary"
          onClick={form.submit}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};
