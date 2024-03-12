import { Modal } from 'antd';
import { useSessionStore } from '../../stores';
import LoginContainer from './loginContainer';

const Index = ({ email }: { email: string }) => {
  const session = useSessionStore();
  console.log('sessin in password login modal: ', session);
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
