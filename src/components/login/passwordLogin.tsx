import { Button, Form, Input, Modal, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailValidate, passwordRegx } from '../../helpers';
import {
  forgetPassReq,
  forgetPassVerifyReq,
  getAppConfigReq,
  loginWithPasswordReq,
} from '../../requests';
import { useAppConfigStore, useProfileStore } from '../../stores';
const APP_PATH = import.meta.env.BASE_URL;

const Index = ({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (value: string) => void;
}) => {
  const profileStore = useProfileStore();
  const appConfigStore = useAppConfigStore();
  const [errMsg, setErrMsg] = useState('');
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false); // login submit
  const [submittingForgetPass, setSubmittingForgetPass] = useState(false); // click 'forget password'
  const [forgetPassModalOpen, setForgetPassModalOpen] = useState(false);
  const toggleForgetPassModal = () =>
    setForgetPassModalOpen(!forgetPassModalOpen);
  const [form] = Form.useForm();
  const watchEmail = Form.useWatch('email', form);

  const onForgetPass = async () => {
    const isValid = form.getFieldError('email').length == 0;
    console.log("form.getFieldError('email');: ", form.getFieldError('email'));
    if (!isValid) {
      return;
    }
    setSubmittingForgetPass(true);
    try {
      const res = await forgetPassReq(form.getFieldValue('email'));
      setSubmittingForgetPass(false);
      console.log('forget pass res: ', res);
      if (res.data.code != 0) {
        throw new Error(res.data.message);
      }
      toggleForgetPassModal();
      message.success('Code sent, please check your email!');
    } catch (err) {
      setSubmittingForgetPass(false);
      if (err instanceof Error) {
        console.log('forget pass err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  const onSubmit = async () => {
    const isInvalid = form.getFieldsError().some((f) => f.errors.length > 0);
    if (isInvalid) {
      return;
    }

    setErrMsg('');
    setSubmitting(true);
    try {
      const loginRes = await loginWithPasswordReq(form.getFieldsValue());
      console.log('login res: ', loginRes);
      if (loginRes.data.code != 0) {
        throw new Error(loginRes.data.message);
      }
      localStorage.setItem('token', loginRes.data.data.Token);
      loginRes.data.data.User.token = loginRes.data.data.Token;
      profileStore.setProfile(loginRes.data.data.User);

      const appConfigRes = await getAppConfigReq();
      setSubmitting(false);
      console.log('app config res: ', appConfigRes);
      if (appConfigRes.data.code != 0) {
        throw new Error(appConfigRes.data.message);
      }
      appConfigStore.setAppConfig(appConfigRes.data.data);

      navigate(`${APP_PATH}profile/subscription`, {
        state: { from: 'login' },
      });
    } catch (err) {
      setSubmitting(false);
      if (err instanceof Error) {
        console.log('login err: ', err.message);
        setErrMsg(err.message);
      } else {
        setErrMsg('Unknown error');
      }
    }
  };

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
        name="login-password"
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
          <Input onPressEnter={onSubmit} />
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
          <Input.Password onPressEnter={onSubmit} />
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
            onClick={onSubmit}
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
    try {
      const res = await forgetPassVerifyReq(
        form2.getFieldValue('email'),
        form2.getFieldValue('verificationCode'),
        form2.getFieldValue('newPassword'),
      );
      setLoading(false);
      console.log('forgot pass verify res: ', res);
      const code = res.data.code;
      if (code != 0) {
        throw new Error(res.data.message);
      }
      message.success('Password reset succeeded, please relogin');
      closeModal();
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
              message: 'Please input your old password!',
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
              message: 'Please input your old password!',
            },
          ]}
        >
          <Input />
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
                return Promise.reject('please retype the same password');
              },
            }),
          ]}
        >
          <Input.Password onPressEnter={onConfirm} />
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
