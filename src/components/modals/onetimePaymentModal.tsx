import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showAmount } from '../../helpers';
import {
  addonPaymentReq,
  getCountryList,
  onetimePaymentReq,
} from '../../requests';
import { Country, IPlan, IProfile } from '../../shared.types';
import { useAppConfigStore, useProfileStore } from '../../stores';
import PaymentSelector from '../ui/paymentSelector';

interface Props {
  isOpen: boolean;
  plan: IPlan | undefined;
  subscriptionId: string;
  closeModal: () => void;
}
const Index = ({ isOpen, closeModal, plan, subscriptionId }: Props) => {
  const appConfig = useAppConfigStore();
  const [form] = Form.useForm();
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [gatewayId, setGatewayId] = useState<undefined | number>(
    appConfig.gateway.find((g) => g.gatewayName == 'stripe')?.gatewayId,
  );
  const onGatewayChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setGatewayId(Number(e.target.value));
  };

  const onQuantityChange = (value: number | null) =>
    setQuantity(value as number);

  const onConfirm = async () => {
    if (gatewayId == undefined) {
      message.error('Please choose a payment method!');
      return;
    }
    if (plan == undefined) {
      return;
    }

    setLoading(true);
    const [paymentRes, err] = await addonPaymentReq({
      addonId: plan!.id,
      subscriptionId,
      quantity,
      returnUrl: `${window.location.origin}/payment-result`,
    });
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    console.log('payment res: ', paymentRes);
    /*
    if (paymentRes.link != null && paymentRes.link != '') {
      window.open(paymentRes.link, '_blank');
    }
    */
    return;
  };

  useEffect(() => {
    const fetchData = async () => {
      const [list, err] = await getCountryList();
      if (null != err) {
        message.error(err.message);
        return;
      }
      setCountryList(
        list.map((c: any) => ({
          code: c.countryCode,
          name: c.countryName,
        })),
      );
    };
    fetchData();
  }, []);

  const countryCode = Form.useWatch('countryCode', form);
  useEffect(() => {
    countryCode &&
      form.setFieldValue(
        'countryName',
        countryList.find((c) => c.code == countryCode)!.name,
      );
  }, [countryCode]);

  console.log('otp addon detail: ', plan);

  return (
    <Modal
      title="Payment confirm"
      width={'520px'}
      open={isOpen}
      footer={null}
      closeIcon={null}
    >
      <div className=" my-4 h-6">Are you sure you want to buy this addon?</div>
      <Row style={{ height: '36px' }}>
        <Col span={8}>
          <span className=" font-bold text-gray-500">Addon name</span>
        </Col>
        <Col span={16}>{plan?.planName}</Col>
      </Row>
      <Row style={{ height: '36px' }}>
        <Col span={8}>
          <span className=" font-bold text-gray-500">Addon description</span>
        </Col>
        <Col span={16}>{plan?.description}</Col>
      </Row>
      <Row style={{ height: '36px' }}>
        <Col span={8}>
          <span className=" font-bold text-gray-500">Price</span>
        </Col>
        <Col span={16}>
          {showAmount(plan?.amount as number, plan?.currency as string)}
        </Col>
      </Row>
      <Row style={{ height: '36px' }}>
        <Col span={8}>
          <span className=" font-bold text-gray-500">Quantity</span>
        </Col>
        <Col span={16}>
          <InputNumber
            min={1}
            max={100}
            value={quantity}
            onChange={onQuantityChange}
          />
        </Col>
      </Row>

      <div className=" my-4 w-3/4">
        <PaymentSelector selected={gatewayId} onSelect={onGatewayChange} />
      </div>

      <div className="mt-6 flex items-center justify-end gap-4">
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
