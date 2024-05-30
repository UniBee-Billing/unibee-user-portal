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
import { passwordSchema } from '../../helpers';
import {
  getProfileWithMoreReq,
  logoutReq,
  resetPassReq,
  saveProfileReq,
} from '../../requests';
import { Country, IProfile } from '../../shared.types';
import {
  useAppConfigStore,
  useMerchantInfoStore,
  useProfileStore,
  useSessionStore,
} from '../../stores';
import PaymentSelector from '../ui/paymentSelector';
import './basicInfo.css';
import EditCard from './editCard';

const APP_PATH = import.meta.env.BASE_URL; // default is / (if no --base specified in build cmd)

const Index = () => {
  const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [form] = Form.useForm();
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const togglePasswordModal = () => setResetPasswordModal(!resetPasswordModal);
  const profileStore = useProfileStore();
  const [gatewayId, setGatewayId] = useState(0); // payment gateway is not a antd native radio component, I have to manually update its value here

  const filterOption = (
    input: string,
    option?: { label: string; value: string },
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  const onGatewayChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setGatewayId(Number(e.target.value));
  };

  const onSave = async () => {
    console.log(' saving...', form.getFieldsValue(), '//', gatewayId);
    let u = JSON.parse(JSON.stringify(form.getFieldsValue()));
    u.gatewayId = gatewayId;
    setLoading(true);
    const [saveProfileRes, err] = await saveProfileReq(u);
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    message.success('saved');
    const { user } = saveProfileRes;
    setGatewayId(user.gatewayId);
    setProfile(user);
    profileStore.setProfile(user);
  };

  const fetchData = async () => {
    setLoading(true);
    const [res, err] = await getProfileWithMoreReq(fetchData);
    setLoading(false);
    if (err != null) {
      message.error(err.message);
      return;
    }
    const { user, countryList } = res;
    setProfile(user);
    setGatewayId(user.gatewayId);
    setCountryList(
      countryList.map((c: any) => ({
        code: c.countryCode,
        name: c.countryName,
      })),
    );
  };

  useEffect(() => {
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

  const isCardPaymentSelected =
    appConfigStore.gateway.find(
      (g) => g.gatewayId == gatewayId && g.gatewayName == 'stripe',
    ) != null;
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
          onFinish={onSave}
          initialValues={profile ?? {}}
          labelCol={{ span: 7 }}
          disabled={loading}
        >
          <Form.Item label="ID" name="id" hidden>
            <Input disabled />
          </Form.Item>
          <Form.Item label="gatewayId" name="gatewayId" hidden>
            <Input disabled />
          </Form.Item>

          <Form.Item label="paymentMethod" name="paymentMethod" hidden>
            <Input disabled />
          </Form.Item>

          <Divider
            orientation="left"
            style={{ margin: '32px 0', color: '#757575' }}
          >
            General Info
          </Divider>
          <Row>
            <Col span={12}>
              <Form.Item label="Account Type" name="type">
                <Radio.Group>
                  <Radio value={1}>Individual</Radio>
                  <Radio value={2}>Business</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item label="First name" name="firstName">
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Last name" name="lastName">
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input disabled style={{ width: '300px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
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
                <Input.TextArea rows={4} style={{ width: '300px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Country Name" name="countryName" hidden>
            <Input />
          </Form.Item>
          <Row>
            <Col span={12}>
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
                  style={{ width: '300px' }}
                  showSearch
                  placeholder="Type to search"
                  optionFilterProp="children"
                  filterOption={filterOption}
                  options={countryList.map((c) => ({
                    label: c.name,
                    value: c.code,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Comapany name" name="companyName">
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={12}>
              <Form.Item label="VAT number" name="vATNumber">
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone number" name="phone">
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={12}>
              <Form.Item label="Payment Method" name="gatewayId">
                <PaymentSelector
                  selected={gatewayId}
                  onSelect={onGatewayChange}
                  showWTtips={false}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <div
                style={{
                  visibility: isCardPaymentSelected ? 'visible' : 'hidden',
                  position: 'relative',
                  display: 'flex',
                  maxWidth: '560px',
                  height: '100%',
                }}
              >
                <div className="triangle-left" />
                <div
                  style={{
                    left: '6px',
                    width: '100%',
                    borderRadius: '6px',
                    padding: '16px',
                    background: '#f5f5f5',
                    position: 'relative',
                    // border: '1px solid #eee',
                  }}
                >
                  <EditCard defaultPaymentId={profile?.paymentMethod} />
                </div>
              </div>
            </Col>
          </Row>

          <Divider
            orientation="left"
            style={{ margin: '32px 0', color: '#757575' }}
          >
            Social Media Contact
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
            <Row key={idx}>
              <Col span={12}>
                <Form.Item label={s[0].label} name={s[0].name}>
                  <Input style={{ width: '300px' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                {s[1] != null && (
                  <Form.Item label={s[1].label} name={s[1].name}>
                    <Input style={{ width: '300px' }} />
                  </Form.Item>
                )}
              </Col>
            </Row>
          ))}

          <div className="mx-8 my-8 flex justify-center">
            <Button onClick={togglePasswordModal}>Change Password</Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              type="primary"
              onClick={form.submit}
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
  const navigate = useNavigate();
  const profile = useProfileStore();
  const merchant = useMerchantInfoStore();
  const appConfig = useAppConfigStore();
  const sessionStore = useSessionStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    const [res, err] = await logoutReq();
    if (null != err) {
      message.error(err.message);
      return;
    }
    profile.reset();
    merchant.reset();
    appConfig.reset();
    sessionStore.reset();
    localStorage.removeItem('appConfig');
    localStorage.removeItem('merchantInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
    localStorage.removeItem('session');
    navigate(`${APP_PATH}login`, {
      state: { msg: 'Password reset succeeded, please relogin.' },
    });
  };

  const onConfirm = async () => {
    const formValues = form.getFieldsValue();
    setLoading(true);
    const [res, err] = await resetPassReq(
      formValues.oldPassword,
      formValues.newPassword,
    );
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    await logout();
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
          dependencies={['newPassword']}
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
          dependencies={['newPassword2', 'oldPassword']}
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
                if (!passwordSchema.validate(value)) {
                  return Promise.reject(
                    'At least 8 characters containing lowercase, uppercase, number and special character.',
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="New Password Confirm"
          name="newPassword2"
          dependencies={['newPassword']}
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
