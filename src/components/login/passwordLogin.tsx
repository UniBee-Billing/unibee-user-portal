import { Button, Form, Input } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailValidate } from '../../helpers';
import { loginWithPasswordReq } from '../../requests';
import { useProfileStore } from '../../stores';
const APP_PATH = import.meta.env.BASE_URL;

const Index = ({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (value: string) => void;
}) => {
  const profileStore = useProfileStore();
  const [errMsg, setErrMsg] = useState('');
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const watchEmail = Form.useWatch('email', form);

  const onSubmit = async () => {
    const isInvalid = form.getFieldsError().some((f) => f.errors.length > 0);
    if (isInvalid) {
      return;
    }

    setErrMsg('');
    setSubmitting(true);
    try {
      const loginRes = await loginWithPasswordReq(form.getFieldsValue());
      setSubmitting(false);
      console.log('login res: ', loginRes);
      if (loginRes.data.code != 0) {
        throw new Error(loginRes.data.message);
      }
      localStorage.setItem('token', loginRes.data.data.Token);
      loginRes.data.data.User.token = loginRes.data.data.Token;
      profileStore.setProfile(loginRes.data.data.User);
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
    <Form
      form={form}
      name="login-password"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      style={{ maxWidth: 640, width: 360 }}
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
  );
};

export default Index;
