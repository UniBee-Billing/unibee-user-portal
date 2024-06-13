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
  plan: IPlan | undefined;
  closeModal: () => void;
}
const Index = ({ closeModal, plan }: Props) => {
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
    const [paymentRes, err] = await onetimePaymentReq({
      planId: plan!.id,
      quantity,
      gatewayId,
      returnUrl: `${window.location.origin}/onetime-payment-result`,
    });
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    console.log('payment res: ', paymentRes);
    if (paymentRes.paid) {
      closeModal();
      message.success('Payment succeeded');
      return;
    }

    window.open(paymentRes.link, '_blank');
    closeModal();
    // Do I need to refresh the parent?
    // Yes, if there are some unpaid fee, parent need to show it.
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
          countryCode: c.countryCode,
          countryName: c.countryName,
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
        countryList.find((c) => c.countryCode == countryCode)!.countryName,
      );
  }, [countryCode]);

  return (
    <Modal
      title="Payment confirm"
      width={'520px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div className="modal-content-wrapper">
        <div>
          <div className=" my-4 h-6">
            Are you sure you want to buy this addon?
          </div>
          <Row style={{ height: '36px' }}>
            <Col span={8}>
              <span className=" font-bold text-gray-500">Addon name</span>
            </Col>
            <Col span={16}>{plan?.planName}</Col>
          </Row>
          <Row style={{ height: '36px' }}>
            <Col span={8}>
              <span className=" font-bold text-gray-500">
                Addon description
              </span>
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
        </div>
      </div>
    </Modal>
  );
};

export default Index;