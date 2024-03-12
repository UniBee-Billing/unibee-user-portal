import { Button, Col, Modal, Row, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { showAmount } from '../../helpers';
import { cancelSubReq } from '../../requests';
import { ISubscription } from '../../shared.types';

const APP_PATH = import.meta.env.BASE_URL;

interface Props {
  subInfo: ISubscription | null;
  closeModal: () => void;
  refresh: () => void;
}
const Index = ({ subInfo, closeModal, refresh }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: 'session expired, please re-login' },
    });

  const onConfirm = async () => {
    setLoading(true);
    const [res, err] = await cancelSubReq(subInfo?.subscriptionId as string);
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    message.success(`Subscription cancelled`);
    closeModal();
    refresh();
    // setTimeout(refresh, 2000);
  };

  return (
    <Modal
      title={'Cancel Subscription'}
      width={'640px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div style={{ margin: '16px 0' }}>
        {`Are you sure you want to cancel this subscription?`}
      </div>
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
          No
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          Yes, Cancel it
        </Button>
      </div>
    </Modal>
  );
};

export default Index;
