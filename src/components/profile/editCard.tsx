import {
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Empty,
  Popconfirm,
  Row,
  Spin,
  Tooltip,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import {
  addPaymentMethodReq,
  changeGlobalPaymentMethodReq,
  getPaymentMethodListReq,
  removePaymentMethodReq,
} from '../../requests';

type TCard = {
  id: string;
  type: string;
  brand: string;
  country: string;
  expiredAt: string;
  last4: string;
};

interface Props {
  defaultPaymentId: string | undefined;
}
const Index = ({ defaultPaymentId }: Props) => {
  // const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<TCard[]>([]);
  const [defaultPaymentMethodId, setDefaultPaymentMethod] =
    useState(defaultPaymentId);

  // set default payment card for auto-billing
  const onConfirm = async () => {
    if (defaultPaymentMethodId == undefined || defaultPaymentMethodId == '') {
      return;
    }
    setLoading(true);
    const [changePaymentMethodRes, err] = await changeGlobalPaymentMethodReq({
      paymentMethodId: defaultPaymentMethodId,
    });
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    console.log('changePaymentMethodRes: ', changePaymentMethodRes);
    message.success('Your auto payment card changed');
    // refresh();
  };

  const addCard = async () => {
    setLoading(true);
    const [addCardRes, err] = await addPaymentMethodReq({
      redirectUrl: `${window.location.origin}/add-payment-method-result`,
    });
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    console.log('payment method add res: ', addCardRes);
    window.open(addCardRes.url, '_blank');
  };

  const removeCard = async (paymentMethodId: string) => {
    console.log('removing....', paymentMethodId);
    setLoading(true);
    const [res, err] = await removePaymentMethodReq({
      paymentMethodId,
    });
    if (null != err) {
      message.error(err.message);
      setLoading(false);
      return;
    }
    console.log('payment method remove res: ', res);
    fetchCards();
  };

  const onPaymentMethodChange: React.ChangeEventHandler<HTMLInputElement> = (
    evt,
  ) => {
    setDefaultPaymentMethod(evt.target.value);
  };

  const onPaymentMethodChange2 = (methodId: string) => (evt: any) => {
    setDefaultPaymentMethod(methodId);
  };

  const fetchCards = async () => {
    setLoading(true);
    const [methodList, err] = await getPaymentMethodListReq(fetchCards);
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
    <div>
      <Row gutter={[16, 16]} style={{ fontWeight: 'bold', color: 'gray' }}>
        <Col span={4}>Current</Col>
        <Col span={4}>Brand</Col>
        <Col span={4}>Country</Col>
        <Col span={4}>Expired at</Col>
        <Col span={5}>Last 4 digits</Col>
        <Col span={3}>
          <div className="flex justify-start gap-2">
            <Tooltip title="Add new card">
              <span className=" cursor-pointer" onClick={addCard}>
                <PlusOutlined />
              </span>
            </Tooltip>
            <Tooltip title="Refresh">
              <span className=" ml-2 cursor-pointer" onClick={fetchCards}>
                <SyncOutlined />
              </span>
            </Tooltip>
          </div>
        </Col>
      </Row>
      <div className="flex w-full flex-col" style={{ minHeight: '140px' }}>
        {loading ? (
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        ) : cards.length == 0 ? (
          <div>
            <Empty
              description="No cards"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          cards.map((c) => (
            <Row
              onClick={onPaymentMethodChange2(c.id)}
              gutter={[16, 16]}
              key={c.id}
              style={{
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontWeight: defaultPaymentMethodId == c.id ? 'bold' : 'unset',
              }}
            >
              <Col span={4}>
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
              <Col span={4}>{c.expiredAt}</Col>
              <Col span={5}>{c.last4}</Col>
              <Col span={3}>
                <div className="flex justify-start gap-2">
                  <Popconfirm
                    title="Deletion Confirm"
                    description="Are you sure to delete this card?"
                    onConfirm={() => removeCard(c.id)}
                    showCancel={false}
                    okText="Yes"
                  >
                    <div className="  h-6 w-6 cursor-pointer">
                      <MinusOutlined />
                    </div>
                  </Popconfirm>
                </div>
              </Col>
            </Row>
          ))
        )}
      </div>

      <div className="my-2 flex items-center justify-end">
        <Button
          onClick={onConfirm}
          loading={loading}
          // size="small"
          disabled={
            loading ||
            defaultPaymentMethodId == '' ||
            defaultPaymentMethodId == undefined
          }
        >
          Set as auto payment card
        </Button>
      </div>
    </div>
  );
};

export default Index;
