import { LoadingOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Spin,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addPaymentMethodReq,
  changePaymentMethodReq,
  getCountryList,
  getPaymentMethodListReq,
  saveProfileReq,
} from '../../requests';
import { Country, IProfile } from '../../shared.types';
import { useAppConfigStore, useProfileStore } from '../../stores';

type TCard = {
  id: string;
  type: string;
  brand: string;
  country: string;
  expiredAt: string;
  last4: string;
};

interface Props {
  defaultPaymentId: string;
  subscriptionId: string;
  currency: string;
  closeModal: () => void;
  refresh: () => void;
}
const Index = ({
  defaultPaymentId,
  subscriptionId,
  currency,
  closeModal,
  refresh,
}: Props) => {
  // const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<TCard[]>([]);
  const [defaultPaymentMethodId, setDefaultPaymentMethod] =
    useState(defaultPaymentId);

  const onConfirm = async () => {
    setLoading(true);
    const [changePaymentMethodRes, err] = await changePaymentMethodReq({
      paymentMethodId: defaultPaymentMethodId,
      subscriptionId,
    });
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    message.success('Your default payment card changed');
    refresh();
    closeModal();
  };

  const addCard = async () => {
    setLoading(true);
    const [addCardRes, err] = await addPaymentMethodReq({
      currency,
      subscriptionId,
    });
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    console.log('payment method add res: ', addCardRes);
    window.open(addCardRes.url, '_blank');
  };

  const onPaymentMethodChange: React.ChangeEventHandler<HTMLInputElement> = (
    evt,
  ) => {
    console.log('evt radio: ', evt.target);
    setDefaultPaymentMethod(evt.target.value);
  };

  const onPaymentMethodChange2 = (methodId: string) => (evt) => {
    setDefaultPaymentMethod(methodId);
  };

  const fetchCards = async () => {
    setLoading(true);
    const [methodList, err] = await getPaymentMethodListReq();
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    console.log('payment method list: ', methodList);
    const cards = methodList.map((m: any) => ({
      id: m.id,
      type: m.type,
      ...m.data,
      expiredAt: m.data.expYear + '-' + m.data.expMonth,
    }));
    setCards(cards);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return (
    <Modal
      title="Edit your card"
      width={'640px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div style={{ height: '24px' }}></div>
      <Row gutter={[16, 16]} style={{ fontWeight: 'bold', color: 'gray' }}>
        <Col span={2}></Col>
        <Col span={4}>Brand</Col>
        <Col span={4}>Country</Col>
        <Col span={6}>Expired at</Col>
        <Col span={4}>Last 4 digits</Col>
        <Col span={4}>
          <div className="flex justify-evenly gap-2">
            <span className=" cursor-pointer" onClick={addCard}>
              <PlusOutlined />
            </span>
            <span className=" cursor-pointer" onClick={fetchCards}>
              <SyncOutlined />
            </span>
          </div>
        </Col>
      </Row>
      <div className="flex w-full flex-col">
        {loading ? (
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        ) : (
          cards.map((c) => (
            <Row
              onClick={onPaymentMethodChange2(c.id)}
              gutter={[16, 16]}
              key={c.id}
              style={{
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <Col span={2}>
                <input
                  type="radio"
                  name="payment-methods"
                  id={c.id}
                  value={c.id}
                  checked={defaultPaymentMethodId == c.id}
                  onChange={onPaymentMethodChange}
                />
              </Col>
              <Col span={4}>{c.brand}</Col>
              <Col span={4}>{c.country}</Col>
              <Col span={6}>{c.expiredAt}</Col>
              <Col span={4}>{c.last4}</Col>
            </Row>
          ))
        )}
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

export default Index;
