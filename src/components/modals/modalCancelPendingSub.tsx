import { Button, Col, Modal, Row, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showAmount } from '../../helpers';
import { cancelSubReq, terminateOrResumeSubReq } from '../../requests';
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
    try {
      console.log('cancelling ....', subInfo?.subscriptionId);
      setLoading(true);
      const res = await cancelSubReq(subInfo?.subscriptionId as string);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      message.success(`Subscription cancelled`);
      setLoading(false);
      closeModal();
      refresh();
      // setTimeout(refresh, 2000);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log(`err cancelling sub: `, err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
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
      {/* <Row>
        <Col span={6}>
          <span style={{ fontWeight: "bold" }}>First name</span>
        </Col>
        <Col span={6}>{subInfo?.user?.firstName}</Col>
        <Col span={5}>
          <span style={{ fontWeight: "bold" }}> Lastname</span>
        </Col>
        <Col span={6}>{subInfo?.user?.lastName}</Col>
      </Row>
      <Row>
        <Col span={6}>
          <span style={{ fontWeight: "bold" }}>Plan</span>
        </Col>
        <Col span={6}>{subInfo?.plan?.planName}</Col>
        <Col span={5}>
          <span style={{ fontWeight: "bold" }}>Amount</span>
        </Col>
        <Col span={6}>
          {subInfo?.plan?.amount &&
            showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
        </Col>
      </Row>
      <Row>
        <Col span={6}>
          <span style={{ fontWeight: "bold" }}>Current due date</span>
        </Col>
        <Col span={6}>
          {new Date(
            (subInfo?.currentPeriodEnd as number) * 1000
          ).toDateString()}
        </Col>
          </Row> */}
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
