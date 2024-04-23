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
import { CURRENCY } from '../../constants';
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
  console.log('countr code: ', userCountryCode);
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
  const [discountChecking, setDiscountChecking] = useState(false);
  const [vatChecking, setVatChecking] = useState(false);

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

  const getDiscountDesc = () => {
    if (preview == null || preview.discount == null) {
      return '';
    }
    const code = preview.discount;
    console.log('code det: ', code);
    // return '';
    let amt =
      code.discountType == 1 // 1: percentage, 2: fixed amt
        ? String(code.discountPercentage / 100) + '% off'
        : showAmount(code.discountAmount, code.currency) + ' off';

    return `${amt}`;
  };

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
    console.log('previewRes: ', previewRes);
    if (null != err) {
      message.error(err.message);
      return false;
    }
    setPreview(previewRes);
    return true;
  };

  const onDiscountChecking = async (evt: React.FocusEvent<HTMLElement>) => {
    console.log('discount blur ele: ', evt);
    if (evt.relatedTarget?.classList.contains('cancel-btn-wrapper')) {
      // closeModal();
      return;
    }

    setDiscountChecking(true);
    if (evt.relatedTarget?.classList.contains('confirm-btn-wrapper')) {
      discountChkingRef.current = true;
    }
    await createPreview(); // I should insert **ref.current = true/false into createPreview
    discountChkingRef.current = false;
    setDiscountChecking(false);
    setSubmitting(false);
  };

  const onCodeEnter = async () => {
    discountChkingRef.current = true;
    setDiscountChecking(true);
    await createPreview(); // I should insert **ref.current = true/false into createPreview
    discountChkingRef.current = false;
    setDiscountChecking(false);
  };

  const onDiscountCodeChange: React.ChangeEventHandler<HTMLInputElement> = (
    evt,
  ) => {
    setDiscountCode(evt.target.value);
  };

  const onVATCheck = async (evt: React.FocusEvent<HTMLElement>) => {
    if (evt.relatedTarget?.classList.contains('cancel-btn-wrapper')) {
      closeModal();
      return;
    }

    setVatChecking(true);
    if (evt.relatedTarget?.classList.contains('confirm-btn-wrapper')) {
      vatChechkingRef.current = true;
    }

    setSubmitting(true);
    const [vatNumberValidate, err] = await vatNumberCheckReq(vatNumber);
    setVatChecking(false);
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
    if (vatChechkingRef.current || discountChkingRef.current) {
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

  /*
  useEffect(() => {
    console.log('did mount, calling preview');
    createPreview();
  }, []);
  */

  useEffect(() => {
    console.log('country changed, calling preview');
    createPreview();
  }, [selectedCountry]);

  // console.log('discount/vat checking: ', discountChecking, '//', vatChecking);
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
                <Col span={4}>
                  <div style={{ marginLeft: '12px' }}>{i.quantity}</div>
                </Col>
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
                onPressEnter={onCodeEnter}
                onChange={onDiscountCodeChange}
              />
              <div className=" text-xs text-gray-500">
                {discountChecking ? 'calculating...' : getDiscountDesc()}
              </div>
            </Col>
            <Col span={14}>
              <div className="mr-8 flex h-full items-end justify-end text-xl">
                Total
              </div>
            </Col>
            <Col span={4}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {preview && preview.discount != null && (
                  <>
                    <div className=" text-gray-400 line-through">{`${showAmount(preview.originAmount, preview.currency)}`}</div>
                    <div style={{ marginLeft: '-12px' }}>
                      -{' '}
                      {`${showAmount(preview.discountAmount, preview.currency)}`}
                    </div>
                  </>
                )}

                <div>
                  {`${showAmount(preview.totalAmount, preview.currency)}`}
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col span={8}></Col>
          </Row>

          <Row style={{ marginTop: '12px' }}></Row>
        </>
      )}
      <div className="mt-6 flex items-center justify-end gap-4">
        <button style={{ opacity: 0 }}>ee</button>
        <Button
          className="cancel-btn-wrapper"
          onClick={closeModal}
          disabled={loading || submitting}
        >
          Cancel
        </Button>
        <div className="confirm-btn-wrapper">
          <Button
            type="primary"
            className="confirm-btn-wrapper"
            onClick={onConfirm}
            loading={loading || submitting}
            disabled={loading || submitting}
          >
            {discountChecking
              ? 'Discount checking'
              : vatChecking
                ? 'VAT checking'
                : 'OK'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Index;
