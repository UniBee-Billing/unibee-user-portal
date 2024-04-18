import { Button, Col, Modal, Row, message } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showAmount } from '../../helpers';
import { terminateOrResumeSubReq } from '../../requests';
import { ISubscription } from '../../shared.types';

const APP_PATH = import.meta.env.BASE_URL;

interface Props {
  isOpen: boolean;
  subInfo: ISubscription | null;
  action: 'CANCEL' | 'UN-CANCEL';
  closeModal: () => void;
  refresh: () => void;
}
const ResumeSub = ({ isOpen, subInfo, action, closeModal, refresh }: Props) => {
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);
    const [res, err] = await terminateOrResumeSubReq({
      subscriptionId: subInfo?.subscriptionId as string,
      action,
    });
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    message.success(
      `Subscription ${
        action == 'UN-CANCEL'
          ? 'resumed'
          : 'cancelled at the end of this billing cycle.'
      }`,
    );
    closeModal();
    refresh();
  };

  return (
    <Modal
      title={`${action == 'UN-CANCEL' ? 'Un-cancel' : 'Cancel'} Subscription`}
      width={'780px'}
      open={isOpen}
      footer={null}
      closeIcon={null}
    >
      <div style={{ margin: '16px 0' }}>
        {`Are you sure you want to ${action.toLowerCase()} this subscription `}
        {action == 'UN-CANCEL' && '?'}
        {action == 'CANCEL' && (
          <>
            <span>at the end of this billing cycle </span>
            <span className=" text-red-500">
              {dayjs((subInfo?.currentPeriodEnd as number) * 1000).format(
                'YYYY-MMM-DD',
              )}
            </span>
            &nbsp;?
          </>
        )}
      </div>
      <Row style={{ marginBottom: '12px' }}>
        <Col span={6}>
          <span style={{ fontWeight: 'bold' }}>First name</span>
        </Col>
        <Col span={6}>{subInfo?.user?.firstName}</Col>
        <Col span={5}>
          <span style={{ fontWeight: 'bold' }}> Lastname</span>
        </Col>
        <Col span={6}>{subInfo?.user?.lastName}</Col>
      </Row>
      <Row style={{ marginBottom: '12px' }}>
        <Col span={6}>
          <span style={{ fontWeight: 'bold' }}>Plan</span>
        </Col>
        <Col span={6}>{subInfo?.plan?.planName}</Col>
        <Col span={5}>
          <span style={{ fontWeight: 'bold' }}>Amount</span>
        </Col>
        <Col span={6}>
          {subInfo?.plan?.amount &&
            showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
        </Col>
      </Row>
      <Row style={{ marginBottom: '12px' }}>
        <Col span={6}>
          <span style={{ fontWeight: 'bold' }}>Current due date</span>
        </Col>
        <Col span={6}>
          {dayjs((subInfo?.currentPeriodEnd as number) * 1000).format(
            'YYYY-MMM-DD',
          )}
        </Col>
      </Row>
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

export default ResumeSub;
