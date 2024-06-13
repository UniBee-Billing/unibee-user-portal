import { LoadingOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
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
import update from 'immutability-helper';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CURRENCY } from '../../constants';
import { showAmount } from '../../helpers';
import {
  createPreviewReq,
  createSubscriptionReq,
  markWireCompleteReq,
  vatNumberCheckReq,
} from '../../requests';
import { Country, IPlan, IPreview } from '../../shared.types';
import { useAppConfigStore, useProfileStore } from '../../stores';
import PaymentSelector from '../ui/paymentSelector';
import './modalCreateSub.css';

const APP_PATH = import.meta.env.BASE_URL;

interface Props {
  plan: IPlan;
  countryList: Country[];
  userCountryCode: string;
  defaultVatNumber: string;
  closeModal: () => void;
}

const Index = ({
  plan,
  countryList,
  userCountryCode,
  defaultVatNumber,
  closeModal,
}: Props) => {
  const navigate = useNavigate();
  const appConfig = useAppConfigStore();
  const profileStore = useProfileStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<IPreview | null>(null);
  const [vatNumber, setVatNumber] = useState(defaultVatNumber);
  const [selectedCountry, setSelectedCountry] = useState(userCountryCode);
  const vatChechkingRef = useRef(false);
  const discountChkingRef = useRef(false);
  const discountInputRef = useRef<InputRef>(null);
  const [discountChecking, setDiscountChecking] = useState(false);
  const [vatChecking, setVatChecking] = useState(false);

  const subscriptionId = useRef(''); // fore wire transfer, we need this Id(after creating sub) to mark transfer as complete

  // set card payment as default gateway
  const [gatewayId, setGatewayId] = useState<undefined | number>(
    appConfig.gateway.find((g) => g.gatewayName == 'stripe')?.gatewayId,
  );
  const onGatewayChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setGatewayId(Number(e.target.value));
  };

  // is wire-transfer selected? Yes, then extra step is needed
  const [wireConfirmStep, setWireConfirmStep] = useState(false);
  const wireSetup = appConfig.gateway.find(
    (g) => g.gatewayName == 'wire_transfer',
  );
  const isWireSelected = wireSetup != null && wireSetup.gatewayId == gatewayId;

  const onVatChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setVatNumber(e.target.value);

  // vat number and vatCountry are exclusive to each other,
  // when one is selected/input, the other need to be disabled(or cleared)
  const onCountryChange = (value: string) => {
    setSelectedCountry(value);
  };
  const filterOption = (
    input: string,
    option?: { label: string; value: string },
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  const getDiscountDesc = () => {
    if (preview == null) {
      return '';
    }
    if (preview.discountMessage != '') {
      return <span className=" text-red-700">{preview.discountMessage}</span>;
    }
    // return '';
    if (preview.discount == null) {
      return '';
    }
    const code = preview.discount;
    let amt =
      code.discountType == 1 // 1: percentage, 2: fixed amt
        ? String(code.discountPercentage / 100) + '% off'
        : showAmount(code.discountAmount, code.currency) + ' off';
    amt += `, number of billing cycles you can use this code: ${code.cycleLimit == 0 ? 'unlimited' : code.cycleLimit}`;
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

    // return;
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
      discountInputRef.current?.input?.value,
    );
    setLoading(false);
    console.log('previewRes: ', previewRes);
    if (null != err) {
      message.error(err.message);
      return false;
    }

    setDiscountChecking(false);
    setPreview(previewRes);
    return true;
  };

  // although we have a Apply button to check discount code, but users might not click it,
  // so onBlur is used to force check.
  // discount <input /> onBlur handler
  const onDiscountChecking = async (evt: React.FocusEvent<HTMLElement>) => {
    // console.log('discount blur ele: ', evt);
    // if onBlur is happening on Cancel button, that means users want to close the Modal
    // then, we don't need to createPreview
    if (evt.relatedTarget?.classList.contains('cancel-btn-wrapper')) {
      return;
    }
    // Apply button's job is also to createPreview, it's duplicate onblur's job
    if (evt.relatedTarget?.classList.contains('apply-btn-wrapper')) {
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

  // discount's Apply button onClick handler
  // refactor this with the above into one
  const onDiscountChecking2: React.MouseEventHandler<HTMLElement> = async (
    evt,
  ) => {
    setDiscountChecking(true);
    discountChkingRef.current = true;
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

  const onVATCheck = async (evt: React.FocusEvent<HTMLElement>) => {
    if (evt.relatedTarget?.classList.contains('cancel-btn-wrapper')) {
      closeModal();
      return;
    }

    setVatChecking(true);
    if (evt.relatedTarget?.classList.contains('confirm-btn-wrapper')) {
      vatChechkingRef.current = true;
    }

    if (vatNumber == '') {
      setVatChecking(false);
      vatChechkingRef.current = false;
      await createPreview();
      return;
    }

    setSubmitting(true);
    const [vatNumberValidate, err] = await vatNumberCheckReq(vatNumber);
    setVatChecking(false);
    if (null != err) {
      message.error(err.message);
      setSubmitting(false);
      vatChechkingRef.current = false;
      return;
    }
    vatChechkingRef.current = false;
    const newPreview = update(preview, {
      vatNumberValidate: { $set: vatNumberValidate },
    });
    setPreview(newPreview);
    if (!vatNumberValidate.valid) {
      setSubmitting(false);
      message.error('Invalid VAT, please re-type or leave it blank.');
      return;
    }

    await createPreview();
    setSubmitting(false);
  };

  const confirmCheck = () => {
    if (preview == null) {
      return false;
    }
    if (preview.vatNumberValidate != null && !preview.vatNumberValidate.valid) {
      message.error('Invalid VAT number');
      return false;
    }
    if (preview.discountMessage != '') {
      message.error('Invalid discount code');
      return false;
    }
    return true;
  };

  const onConfirm = async () => {
    if (!confirmCheck()) {
      return;
    }

    if (wireConfirmStep) {
      setLoading(true);
      const [res, err] = await markWireCompleteReq(subscriptionId.current);
      setLoading(false);
      if (null != err) {
        message.error(err.message);
        return;
      }
      console.log('mark wire complete res: ', res);
      closeModal();
      message.success('Subscription created.');
      navigate(`${APP_PATH}my-subscription`);
      return;
    }

    if (vatChechkingRef.current || discountChkingRef.current) {
      return;
    }

    if (null == gatewayId) {
      message.error('Please select a payment method.');
      return;
    }

    // this is a trial-enabled plan, and requires billing info, card info
    if (plan.trialDurationTime > 0 && plan.trialDemand != '') {
      if (
        appConfig.gateway.find((g) => g.gatewayName == 'stripe')?.gatewayId !=
        gatewayId
      ) {
        message.error(
          'This payment method is not supported to enable the trial.',
        );
        return;
      }
    }

    if (isWireSelected) {
      const wire = appConfig.gateway.find(
        (g) => g.gatewayName == 'wire_transfer',
      );
      // console.log('total amt/wire-mim amt: ', wire, '//', preview?.totalAmount);
      if (wire?.currency != preview?.currency) {
        message.error(`Wire transfer currency is ${wire?.currency}`);
        return;
      }
      if (wire!.minimumAmount! > preview!.totalAmount) {
        message.error(
          `Minimum amount of wire transfer is: ,
          ${showAmount(
            wire!.minimumAmount as number,
            wire!.currency as string,
            false,
          )}`,
        );
        return;
      }
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
      selectedCountry, // preview?.vatCountryCode as string,
      vatNumber, // preview?.vatNumber as string,
      gatewayId,
      discountInputRef.current?.input?.value,
    );
    console.log('create sub res: ', createSubRes);
    setSubmitting(false);
    if (err != null) {
      message.error(err.message);
      return;
    }

    // user has updated either one of them, need to update the local store. Backend will also update these values.
    if (defaultVatNumber != vatNumber || userCountryCode != selectedCountry) {
      const p = update(profileStore.getProfile(), {
        vATNumber: { $set: vatNumber },
        countryCode: { $set: selectedCountry },
      });
      console.log('new profile: ', p);
      profileStore.setProfile(p);
    }

    if (isWireSelected) {
      console.log(
        'setting sub id after create sub: ',
        createSubRes.subscription.subscriptionId,
      );
      subscriptionId.current = createSubRes.subscription.subscriptionId;
      setWireConfirmStep(!wireConfirmStep);
      return;
    }

    const { link, paid } = createSubRes;
    if (link != '' && link != null) {
      window.open(link, '_blank');
    }
    navigate(`${APP_PATH}my-subscription`);
  };

  const onClose = () => {
    closeModal();
    if (wireConfirmStep) {
      message.success('Subscription created.');
      navigate(`${APP_PATH}my-subscription`);
    }
  };

  useEffect(() => {
    createPreview();
  }, [selectedCountry, gatewayId]);

  // console.log('discount/vat checking: ', discountChecking, '//', vatChecking);
  return (
    <Modal
      title={wireConfirmStep ? 'Wire Transfer Account' : 'Order Preview'}
      maskClosable={false}
      open={true}
      footer={null}
      closeIcon={null}
      width={'820px'}
      style={{ overflow: 'hidden' }}
    >
      {preview == null ? (
        <div className="flex items-center justify-center">
          <Spin
            spinning={true}
            indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
          />
        </div>
      ) : (
        <div
          className="order-preview-wrapper relative flex"
          style={{ width: '1590px', left: wireConfirmStep ? '-800px' : 0 }}
        >
          <div className="relative w-3/6">
            <Row style={{ fontWeight: 'bold', margin: '16px 0' }}>
              <Col span={10}>Description</Col>
              <Col span={6}>
                <span className="ml-3">Price</span>
              </Col>
              <Col span={4}>Quantity</Col>
              <Col span={4}>Amount</Col>
            </Row>
            {preview.invoice.lines.map((i, idx) => (
              <div key={idx}>
                <Row>
                  <Col span={10}>{i.description}</Col>
                  <Col span={6}>
                    <div className="ml-3">
                      {showAmount(i.unitAmountExcludingTax, i.currency)}
                    </div>
                  </Col>
                  <Col span={4}>
                    <div>{i.quantity}</div>
                  </Col>
                  <Col span={4}>
                    {showAmount(
                      i.unitAmountExcludingTax * i.quantity,
                      i.currency,
                    )}
                  </Col>
                </Row>
                {idx != preview.invoice.lines.length - 1 && (
                  <Divider style={{ margin: '8px 0', background: '#eee' }} />
                )}
              </div>
            ))}
            <Divider />
            <Row>
              <Col span={14}>
                <Row>
                  <Col span={12}>VAT number</Col>
                  <Col span={12}>Country</Col>
                  {/* <Col span={8} style={{ marginLeft: '2px' }}>
                Payment method
          </Col> */}
                </Row>
                <Row>
                  <Col span={12}>
                    <Input
                      disabled={loading || submitting}
                      value={vatNumber}
                      style={{ width: '80%' }}
                      onChange={onVatChange}
                      onBlur={onVATCheck}
                      // onPressEnter={onVATCheck}
                      placeholder="Your VAT number"
                    />
                  </Col>
                  <Col span={12}>
                    <Select
                      disabled={loading || submitting}
                      value={selectedCountry}
                      style={{ width: '160px' }}
                      onChange={onCountryChange}
                      showSearch
                      placeholder="Type to search"
                      optionFilterProp="children"
                      filterOption={filterOption}
                      options={countryList.map((c) => ({
                        label: c.countryName,
                        value: c.countryCode,
                      }))}
                    />
                  </Col>
                </Row>
                {preview.vatNumberValidate != null &&
                  !preview.vatNumberValidate.valid && (
                    <div className=" mt-4 text-xs text-red-500">
                      {preview.vatNumberValidate.validateMessage}
                    </div>
                  )}
                {preview.vatNumberValidate != null &&
                  preview.vatNumberValidate.valid && (
                    <>
                      <Row className=" mt-4">
                        <Col span={6}>
                          <span className=" txt-xs font-bold text-gray-500">
                            Company Address
                          </span>
                        </Col>
                        <Col span={18}>
                          <span className=" text-xs text-gray-400">
                            {preview.vatNumberValidate.companyAddress}
                          </span>
                        </Col>
                      </Row>
                      <Row>
                        <Col
                          span={6}
                          style={{ fontWeight: 'bold', fontSize: '12px' }}
                        >
                          <span className=" text-xs font-bold text-gray-500">
                            Company Name
                          </span>
                        </Col>
                        <Col span={18}>
                          <span className=" text-xs text-gray-400">
                            {preview.vatNumberValidate.companyName}
                          </span>
                        </Col>
                      </Row>
                      <Row>
                        <Col
                          span={6}
                          style={{ fontWeight: 'bold', fontSize: '12px' }}
                        >
                          <span className=" text-xs font-bold text-gray-500">
                            Company Code
                          </span>
                        </Col>
                        <Col span={18}>
                          <span className=" text-xs text-gray-400">
                            {preview.vatNumberValidate.countryCode}
                          </span>
                        </Col>
                      </Row>
                    </>
                  )}
              </Col>
              <Col span={10}>
                <Row>
                  <Col>Payment method</Col>
                </Row>
                <Row>
                  <Col span={20}>
                    <PaymentSelector
                      selected={gatewayId}
                      onSelect={onGatewayChange}
                      showWTtips={true}
                      disabled={loading || submitting}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>

            <div className=" mt-6 flex w-full pr-4">
              <div className="w-3/5">
                <Row>
                  <Col span={24}>Discount code</Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <Input
                      ref={discountInputRef}
                      allowClear
                      // disabled={discountChecking || vatChecking}
                      disabled={loading || submitting}
                      style={{ width: '200px' }}
                      // value={discountCode}
                      onBlur={onDiscountChecking}
                      onPressEnter={onCodeEnter}
                      // onChange={onDiscountCodeChange}
                    />
                    <span className=" ml-1">
                      <Button
                        className="apply-btn-wrapper"
                        size="small"
                        type="text"
                        onClick={onDiscountChecking2}
                        loading={discountChecking}
                        disabled={loading || submitting}
                      >
                        Apply
                      </Button>
                    </span>
                    <div className=" mt-1 text-xs text-gray-500">
                      {discountChecking ? 'checking...' : getDiscountDesc()}
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="w-2/5">
                <Row>
                  <Col
                    span={16}
                    style={{ fontSize: '18px' }}
                    className=" text-red-800"
                  >
                    Saved
                  </Col>
                  <Col
                    className=" text-red-800"
                    span={8}
                  >{`${showAmount(preview.discountAmount, preview.currency)}`}</Col>
                </Row>
                <Row>
                  <Col
                    span={16}
                    style={{ fontSize: '18px' }}
                    className=" text-gray-700"
                  >
                    Tax
                  </Col>
                  <Col
                    span={8}
                    className=" text-gray-700"
                  >{`${preview.taxPercentage / 100} %`}</Col>
                </Row>
                <Divider style={{ margin: '4px 0' }} />
                <Row>
                  <Col
                    span={16}
                    style={{ fontSize: '18px', fontWeight: 'bold' }}
                    className=" text-gray-600"
                  >
                    Order Total
                  </Col>
                  <Col
                    style={{ fontSize: '18px', fontWeight: 'bold' }}
                    className=" text-gray-600"
                    span={8}
                  >{`${showAmount(preview.totalAmount, preview.currency)}`}</Col>
                </Row>
              </div>
            </div>

            {/* <Row>
            
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
              </Row>*/}

            <Row style={{ marginTop: '12px' }}></Row>
          </div>
          <div className="relative w-3/6">
            {wireSetup && (
              <>
                <div className="my-4">
                  Your subscription has been created, please wire transfer your
                  payment(
                  <span className=" font-bold text-red-500">
                    {showAmount(preview.totalAmount, preview.currency)}
                  </span>
                  ) to the following account within 5 days:
                </div>
                <Row style={{ marginBottom: '6px' }}>
                  <Col span={8} className="text-lg text-gray-500">
                    Account Holder
                  </Col>
                  <Col span={16}>{wireSetup.bank?.accountHolder}</Col>
                </Row>
                {/* <Row style={{ marginBottom: '6px' }}>
                  <Col span={8} className="text-lg text-gray-500">
                    Minimum Amount
                  </Col>
                  <Col span={16}>
                    {showAmount(
                      wireSetup.minimumAmount as number,
                      wireSetup.currency as string,
                    )}
                  </Col>
                  </Row>*/}
                <Row style={{ marginBottom: '6px' }}>
                  <Col span={8} className="text-lg text-gray-500">
                    BIC
                  </Col>
                  <Col span={16}>{wireSetup.bank?.bic}</Col>
                </Row>
                <Row style={{ marginBottom: '6px' }}>
                  <Col span={8} className="text-lg  text-gray-500">
                    IBAN
                  </Col>
                  <Col span={16}>{wireSetup.bank?.iban}</Col>
                </Row>
              </>
            )}
          </div>
        </div>
      )}
      <div className="mt-6 flex items-center justify-end gap-4">
        <button style={{ opacity: 0 }}>ee</button>
        <Button
          className="cancel-btn-wrapper"
          onClick={onClose}
          disabled={loading || submitting}
        >
          {wireConfirmStep ? "No, I'll finish the transfer later" : 'Cancel'}
        </Button>
        <div className="confirm-btn-wrapper">
          <Button
            type="primary"
            className="confirm-btn-wrapper"
            onClick={onConfirm}
            loading={loading || submitting}
            disabled={loading || submitting}
          >
            {wireConfirmStep
              ? "Yes, I've finished the transfer"
              : discountChecking
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
