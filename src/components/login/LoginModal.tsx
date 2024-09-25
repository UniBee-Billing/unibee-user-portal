import { Modal } from 'antd';
import LoginContainer from './loginContainer';

const Index = ({ email }: { email: string }) => {
  return (
    <Modal
      title="Session expired"
      width={680}
      open={true}
      footer={false}
      closeIcon={null}
    >
      <LoginContainer triggeredByExpired={true} initialEmail={email} />
    </Modal>
  );
};

export default Index;
