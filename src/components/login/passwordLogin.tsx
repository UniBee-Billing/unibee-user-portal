import type { InputRef } from 'antd';
import { Button, Form, Input, Modal, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailValidate, passwordRegx, passwordSchema } from '../../helpers';
import {
  forgetPassReq,
  forgetPassVerifyReq,
  getAppConfigReq,
  initializeReq,
  loginWithPasswordReq,
} from '../../requests';
import {
  useAppConfigStore,
  useMerchantInfoStore,
  useProfileStore,
  useSessionStore,
} from '../../stores';
const APP_PATH = import.meta.env.BASE_URL;

const Index = ({
  email,
  onEmailChange,
  triggeredByExpired,
}: {
  email: string;
  onEmailChange: (value: string) => void;
  triggeredByExpired: boolean;
}) => {
  const profileStore = useProfileStore();
  const sessionStore = useSessionStore();
  const appConfigStore = useAppConfigStore();
  const merchantStore = useMerchantInfoStore();
  const [errMsg, setErrMsg] = useState('');
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false); // login submit
  const [submittingForgetPass, setSubmittingForgetPass] = useState(false); // click 'forget password'
  const [forgetPassModalOpen, setForgetPassModalOpen] = useState(false);
  const toggleForgetPassModal = () =>
    setForgetPassModalOpen(!forgetPassModalOpen);
  const [form] = Form.useForm();
  const watchEmail = Form.useWatch('email', form);
  const passwordRef = useRef<InputRef>(null);
  const emailRef = useRef<InputRef>(null);

  const onForgetPass = async () => {
    const isValid = form.getFieldError('email').length == 0;
    if (!isValid) {
      return;
    }
    setSubmittingForgetPass(true);
    const [res, err] = await forgetPassReq(form.getFieldValue('email'));
    setSubmittingForgetPass(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    toggleForgetPassModal();
    message.success('Code sent, please check your email!');
  };

  const onSubmit = async () => {
    setErrMsg('');
    setSubmitting(true);
    const [loginRes, errLogin] = await loginWithPasswordReq(
      form.getFieldsValue(),
    );
    if (null != errLogin) {
      setErrMsg(errLogin.message);
      setSubmitting(false);
      return;
    }
    const { user, token } = loginRes;
    localStorage.setItem('token', token);
    user.token = token;
    profileStore.setProfile(user);
    // sessionStore.setSession({ expired: false, refresh: null });

    const [initRes, errInit] = await initializeReq();
    setSubmitting(false);
    if (null != errInit) {
      setErrMsg(errInit.message);
      return;
    }
    const { appConfig, gateways, merchantInfo } = initRes;
    appConfigStore.setAppConfig(appConfig);
    appConfigStore.setGateway(gateways);
    merchantStore.setMerchantInfo(merchantInfo);

    if (triggeredByExpired) {
      console.log('expired in password login: ', sessionStore);
      sessionStore.refresh && sessionStore.refresh();
      message.success('Login succeeded');
    } else {
      navigate(`${APP_PATH}my-subscription`, {
        state: { from: 'login' },
      });
    }
    sessionStore.setSession({ expired: false, refresh: null });
  };

  useEffect(() => {
    if (triggeredByExpired) {
      passwordRef.current?.focus();
    } else {
      emailRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (watchEmail != null) {
      onEmailChange(watchEmail); // pass the email value to parent
    }
  }, [watchEmail]);

  return (
    <>
      {forgetPassModalOpen && (
        <ForgetPasswordModal
          email={form.getFieldValue('email')}
          closeModal={toggleForgetPassModal}
        />
      )}

      <Form
        form={form}
        onFinish={onSubmit}
        name="login-with-password"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        style={{ maxWidth: 640, width: 360, position: 'relative' }}
        initialValues={{ email, password: '' }}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: 'Please input your Email!',
            },
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (value != null && value != '' && emailValidate(value)) {
                  return Promise.resolve();
                }
                return Promise.reject('Please input valid email address.');
              },
            }),
          ]}
        >
          <Input onPressEnter={form.submit} ref={emailRef} />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            {
              required: true,
              message: 'Please input your password!',
            },
          ]}
        >
          <Input.Password onPressEnter={form.submit} ref={passwordRef} />
        </Form.Item>

        <div style={{ position: 'absolute', right: '-130px', top: '56px' }}>
          <Button
            onClick={onForgetPass}
            loading={submittingForgetPass}
            disabled={submittingForgetPass}
            type="link"
            style={{ fontSize: '11px' }}
          >
            Forgot Password?
          </Button>
        </div>

        <div className="mb-4 flex justify-center text-red-500">{errMsg}</div>

        <Form.Item
          wrapperCol={{
            offset: 8,
            span: 16,
          }}
        >
          <Button
            type="primary"
            onClick={form.submit}
            loading={submitting}
            disabled={submitting}
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default Index;

const ForgetPasswordModal = ({
  email,
  closeModal,
}: {
  email: string;
  closeModal: () => void;
}) => {
  const [form2] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);
    const [res, err] = await forgetPassVerifyReq(
      form2.getFieldValue('email'),
      form2.getFieldValue('verificationCode'),
      form2.getFieldValue('newPassword'),
    );
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    message.success('Password reset succeeded.');
    closeModal();
  };

  return (
    <Modal
      title="Forgot Password"
      open={true}
      width={'640px'}
      footer={null}
      closeIcon={null}
    >
      <Form
        form={form2}
        onFinish={onConfirm}
        name="forget-password"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        // style={{ maxWidth: 640, width: 360 }}
        className="my-6"
        initialValues={{
          email,
          verificationCode: '',
          newPassword: '',
          newPassword2: '',
        }}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: 'Please input your email!',
            },
          ]}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Verification Code"
          name="verificationCode"
          rules={[
            {
              required: true,
              message: 'Please input your verification code!',
            },
          ]}
        >
          <Input />
        </Form.Item>

        {/* <div className="mb-4 flex justify-center text-red-500">{errMsg}</div> */}

        <Form.Item
          label="New Password"
          name="newPassword"
          dependencies={['newPassword2']}
          rules={[
            {
              required: true,
              message: 'Please input your new password!',
            },
            ({ getFieldValue }) => ({
              validator(rule, value) {
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
                return Promise.reject('please retype the same password');
              },
            }),
          ]}
        >
          <Input.Password onPressEnter={form2.submit} />
        </Form.Item>
      </Form>

      <div className="my-6 flex items-center justify-end">
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Button
          type="primary"
          onClick={form2.submit}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};
