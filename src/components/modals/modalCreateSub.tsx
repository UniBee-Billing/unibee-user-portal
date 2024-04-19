import { LoadingOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Divider,
  Input,
  Modal,
  Row,
  Select,
  Spin,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showAmount } from '../../helpers';
import {
  createPreviewReq,
  createSubscriptionReq,
  vatNumberCheckReq,
} from '../../requests';
import { Country, IPlan, IPreview } from '../../shared.types';
import { useAppConfigStore } from '../../stores';
import PaymentSelector from '../ui/paymentSelector';

const APP_PATH = import.meta.env.BASE_URL;

type TVATDetail = {
  companyAddress: string;
  companyName: string;
  countryCode: string;
};

interface Props {
  plan: IPlan;
  countryList: Country[];
  userCountryCode: string;
  closeModal: () => void;
}

const Index = ({ plan, countryList, userCountryCode, closeModal }: Props) => {
  const navigate = useNavigate();
  const appConfig = useAppConfigStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<IPreview | null>(null);
  const [vatNumber, setVatNumber] = useState('');
  const [vatDetail, setVatDetail] = useState<null | TVATDetail>(null);
  const [isVatValid, setIsVatValid] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(userCountryCode);
  const vatChechkingRef = useRef(false);
  const discountChkingRef = useRef(false);
  // set card payment as default gateway
  const [gatewayId, setGatewayId] = useState<undefined | number>(
    appConfig.gateway.find((g) => g.gatewayName == 'stripe')?.gatewayId,
  );
  const onGatewayChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setGatewayId(Number(e.target.value));
  };

  const onVatChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setVatNumber(e.target.value);

  const onCountryChange = (value: string) => {
    setSelectedCountry(value);
  };
  const filterOption = (
    input: string,
    option?: { label: string; value: string },
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  const createPreview = async () => {
    if (null == gatewayId) {
      message.error('Please select your payment method.');
      return;
    }
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];

    setLoading(true);
    const [previewRes, err] = await createPreviewReq(
      plan.id,
      addons.map((a) => ({
        quantity: a.quantity as number,
        addonPlanId: a.id,
      })),
      vatNumber,
      selectedCountry,
      gatewayId as number,
      createPreview,
      discountCode,
    );
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return false;
    }
    setPreview(previewRes);
    return true;
  };

  const onDiscountChecking = async (evt: React.FocusEvent<HTMLElement>) => {
    if (evt.relatedTarget?.classList.contains('confirm-btn-wrapper')) {
      vatChechkingRef.current = true;
    }
    await createPreview();
    vatChechkingRef.current = false;
    setSubmitting(false);
  };

  const onVATCheck = async (evt: React.FocusEvent<HTMLElement>) => {
    if (evt.relatedTarget?.classList.contains('confirm-btn-wrapper')) {
      vatChechkingRef.current = true;
    }

    setSubmitting(true);
    const [vatNumberValidate, err] = await vatNumberCheckReq(vatNumber);
    if (null != err) {
      message.error(err.message);
      setSubmitting(false);
      setVatDetail(null);
      setIsVatValid(false);
      vatChechkingRef.current = false;
      return;
    }
    const v = vatNumberValidate;
    setIsVatValid(v.valid);
    vatChechkingRef.current = false;
    if (!v.valid) {
      setSubmitting(false);
      setVatDetail(null);
      message.error('Invalid VAT, please re-type or leave it blank.');
      return;
    }

    setVatDetail({
      companyAddress: v.companyAddress,
      companyName: v.companyName,
      countryCode: v.countryCode,
    });
    await createPreview();
    setSubmitting(false);
  };

  const onConfirm = async () => {
    if (vatChechkingRef.current) {
      return;
    }

    if (!isVatValid && vatNumber != '') {
      message.error('Invalid VAT, please re-type or leave it blank.');
      return;
    }

    if (null == gatewayId) {
      message.error('Please select a payment method.');
      return;
    }

    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    setSubmitting(true);
    const [createSubRes, err] = await createSubscriptionReq(
      plan.id,
      addons.map((a) => ({
        quantity: a.quantity as number,
        addonPlanId: a.id,
      })),
      preview?.totalAmount as number,
      preview?.currency as string,
      preview?.vatCountryCode as string,
      preview?.vatNumber as string,
      gatewayId,
    );
    setSubmitting(false);
    if (err != null) {
      message.error(err.message);
      return;
    }

    const { link } = createSubRes;
    if (link != '' || link != null) {
      window.open(link, '_blank');
    }
    navigate(`${APP_PATH}profile/subscription`);
  };

  useEffect(() => {
    createPreview();
  }, []);

  useEffect(() => {
    createPreview();
  }, [selectedCountry]);

  return (
    <Modal
      title="Order Preview"
      maskClosable={false}
      open={true}
      footer={null}
      closeIcon={null}
      width={'780px'}
    >
      {preview == null ? (
        <div className="flex items-center justify-center">
          <Spin
            spinning={true}
            indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
          />
        </div>
      ) : (
        <>
          <Row style={{ fontWeight: 'bold', margin: '16px 0' }}>
            <Col span={8}>Description</Col>
            <Col span={4}>Quantity</Col>
            <Col span={4}>Amt(Exc Tax)</Col>
            <Col span={4}>Tax</Col>
            <Col span={4}>Amt</Col>
          </Row>
          {preview.invoice.lines.map((i, idx) => (
            <div key={idx}>
              <Row>
                <Col span={8}>{i.description}</Col>
                <Col span={4}>{i.quantity}</Col>
                <Col span={4}>
                  {showAmount(i.amountExcludingTax, i.currency)}
                </Col>
                <Col span={4}>{showAmount(i.tax, i.currency)}</Col>
                <Col span={4}>{showAmount(i.amount, i.currency)}</Col>
              </Row>
              {idx != preview.invoice.lines.length - 1 && (
                <Divider style={{ margin: '8px 0' }} />
              )}
            </div>
          ))}
          <Divider />
          <Row>
            <Col span={5}>VAT number</Col>
            <Col span={6} style={{ marginLeft: '12px' }}>
              Country
            </Col>
            <Col span={8} style={{ marginLeft: '2px' }}>
              Payment method
            </Col>
          </Row>
          <Row style={{ marginBottom: '12px' }}>
            <Col span={5}>
              <Input
                value={vatNumber}
                style={{ width: '100%' }}
                onChange={onVatChange}
                onBlur={onVATCheck}
                placeholder="Your VAT number"
              />
            </Col>
            <Col span={6} style={{ marginLeft: '12px' }}>
              <Select
                value={selectedCountry}
                style={{ width: '160px' }}
                onChange={onCountryChange}
                showSearch
                placeholder="Type to search"
                optionFilterProp="children"
                filterOption={filterOption}
                options={countryList.map((c) => ({
                  label: c.name,
                  value: c.code,
                }))}
              />
            </Col>
            <Col span={12}>
              <PaymentSelector
                selected={gatewayId}
                onSelect={onGatewayChange}
              />
            </Col>
          </Row>
          {isVatValid && (
            <>
              <Row style={{ fontWeight: 'bold' }}>
                <Col span={6}>Company Address</Col>
                <Col span={6}>Company Name</Col>
                <Col span={6}>Country Code</Col>
              </Row>
              <Row style={{ marginBottom: '12px' }}>
                <Col span={6} style={{ fontSize: '11px' }}>
                  {vatDetail?.companyAddress}
                </Col>
                <Col span={6} style={{ fontSize: '11px' }}>
                  {vatDetail?.companyName}
                </Col>
                <Col span={6} style={{ fontSize: '11px' }}>
                  {vatDetail?.countryCode}
                </Col>
              </Row>
            </>
          )}
          <Row>
            <Col span={4}>Discount code</Col>
          </Row>
          <Row>
            <Col span={6}>
              <Input
                value={discountCode}
                onBlur={onDiscountChecking}
                onChange={(evt) => setDiscountCode(evt.target.value)}
              />
            </Col>
          </Row>

          <Row>
            <Col span={20}>
              <span style={{ fontSize: '18px' }}>Total</span>
            </Col>
            <Col span={4}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {' '}
                {`${showAmount(preview.totalAmount, preview.currency)}`}
              </span>
            </Col>
          </Row>
        </>
      )}
      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading || submitting}>
          Cancel
        </Button>
        <Button
          type="primary"
          className="confirm-btn-wrapper"
          onClick={onConfirm}
          loading={loading || submitting}
          disabled={loading || submitting}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};

export default Index;
