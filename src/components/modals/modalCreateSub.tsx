import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Divider,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Spin,
  message
} from 'antd'
import update from 'immutability-helper'
import React, { ChangeEventHandler, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CURRENCY } from '../../constants'
import { showAmount } from '../../helpers'
import {
  createPreviewReq,
  createSubscriptionReq,
  markWireCompleteReq,
  vatNumberCheckReq
} from '../../requests'
import {
  Country,
  CreditType,
  DiscountType,
  IPlan,
  IPreview
} from '../../shared.types'
import { useAppConfigStore, useProfileStore } from '../../stores'
import PaymentSelector from '../ui/paymentSelector'
import './modalCreateSub.css'

const APP_PATH = import.meta.env.BASE_URL

interface Props {
  plan: IPlan
  countryList: Country[]
  userCountryCode: string
  defaultVatNumber: string
  couponCode: string
  creditAmt: number | null
  closeModal: () => void
}

const Index = ({
  plan,
  countryList,
  userCountryCode,
  defaultVatNumber,
  couponCode,
  creditAmt,
  closeModal
}: Props) => {
  const navigate = useNavigate()
  const appConfig = useAppConfigStore()
  const profileStore = useProfileStore()
  const promoCredit = profileStore.promoCreditAccounts?.find(
    (p) => p.type == CreditType.PROMO_CREDIT && p.currency == 'EUR'
  )

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview] = useState<IPreview | null>(null)
  const [vatNumber, setVatNumber] = useState(defaultVatNumber)
  const [selectedCountry, setSelectedCountry] = useState(userCountryCode)
  const [creditAmount, setCreditAmount] = useState<number | null>(creditAmt)
  const onCreditAmtChange = (value: number | null) => {
    setCreditAmount(value)
  }
  const [discountCode, setDiscountCode] = useState<string>(couponCode)
  const onDiscountCodeChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    setDiscountCode(evt.target.value)
  }
  const vatChechkingRef = useRef(false)
  const [discountChecking, setDiscountChecking] = useState(false)
  const [vatChecking, setVatChecking] = useState(false)

  const subscriptionId = useRef('') // for wire transfer, we need this Id(after creating sub) to mark transfer as complete

  // set card payment as default gateway
  const [gatewayId, setGatewayId] = useState<undefined | number>(
    appConfig.gateway.find((g) => g.gatewayName == 'stripe')?.gatewayId
  )
  const onGatewayChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setGatewayId(Number(e.target.value))
  }

  // is wire-transfer selected? Yes, then extra step is needed
  const [wireConfirmStep, setWireConfirmStep] = useState(false)
  const wireSetup = appConfig.gateway.find(
    (g) => g.gatewayName == 'wire_transfer'
  )
  const isWireSelected = wireSetup != null && wireSetup.gatewayId == gatewayId

  const onVatChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setVatNumber(e.target.value)

  // vat number and vatCountry are exclusive to each other,
  // when one is selected/input, the other need to be disabled(or cleared)
  const onCountryChange = (value: string) => {
    setSelectedCountry(value)
  }
  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

  const createPreview = async () => {
    if (null == gatewayId) {
      message.error('Please select your payment method.')
      return
    }

    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : []
    setLoading(true)
    const [previewRes, err] = await createPreviewReq({
      planId: plan.id,
      addons: addons.map((a) => ({
        quantity: a.quantity as number,
        addonPlanId: a.id
      })),
      vatNumber,
      vatCountryCode: selectedCountry,
      gatewayId: gatewayId as number,
      refreshCb: createPreview,
      discountCode: discountCode,
      applyPromoCredit: creditAmount != null && creditAmount > 0,
      applyPromoCreditAmount: creditAmount ?? 0
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return false
    }

    setDiscountChecking(false)
    setPreview(previewRes)
    if (previewRes.discount != null) {
      setDiscountCode(previewRes.discount.code)
    }
    return true
  }

  const discountCodeUseNote = () => {
    if (
      preview == null ||
      (preview.discount == null && preview.discountMessage == '')
    ) {
      return <div className="text-xs text-gray-500">No discount code used</div>
    }
    // discountMessage is discount related error message
    if (preview.discount == null && preview.discountMessage != '') {
      // invalid discount code or other error
      return (
        <div className="text-xs text-red-500">{preview.discountMessage}</div>
      )
    }
    if (preview.discount != null) {
      if (preview.discount.discountType == DiscountType.PERCENTAGE) {
        return (
          <div className="text-xs text-green-500">{`
            Discount code is valid(${preview.discount.discountPercentage / 100}% off).
            `}</div>
        )
      } else {
        return (
          <div className="text-xs text-green-500">
            {`Discount code is valid(${showAmount(
              preview.discount.discountAmount,
              preview.discount.currency
            )} off).`}
          </div>
        )
      }
    }
    return null
  }

  const getCreditInfo = () => {
    if (promoCredit == undefined) {
      return { credit: null, note: 'No credit available' }
    }
    return {
      credit: {
        amount: promoCredit.amount,
        currencyAmount: promoCredit.currencyAmount / 100,
        currency: promoCredit.currency,
        exchangeRate: promoCredit.exchangeRate
      },
      note: `Credits available: ${promoCredit.amount} (${showAmount(promoCredit.currencyAmount, promoCredit.currency)})`
    }
  }
  const creditUseNote = () => {
    const credit = getCreditInfo()
    if (credit?.credit == null) {
      return null
    }
    if (creditAmount == 0 || creditAmount == null) {
      return <div className="text-xs text-gray-500">No promo credit used</div>
    }
    return (
      <div className="mt-1 text-xs text-green-500">{`At most ${creditAmount} credits (${CURRENCY[credit.credit.currency].symbol}${(creditAmount * credit.credit.exchangeRate) / 100}) to be used.`}</div>
    )
  }

  const onVATCheck = async (evt: React.FocusEvent<HTMLElement>) => {
    if (evt.relatedTarget?.classList.contains('cancel-btn-wrapper')) {
      closeModal()
      return
    }

    setVatChecking(true)
    if (evt.relatedTarget?.classList.contains('confirm-btn-wrapper')) {
      vatChechkingRef.current = true
    }

    if (vatNumber == '') {
      setVatChecking(false)
      vatChechkingRef.current = false
      await createPreview()
      return
    }

    setSubmitting(true)
    const [vatNumberValidate, err] = await vatNumberCheckReq(vatNumber)
    setVatChecking(false)
    if (null != err) {
      message.error(err.message)
      setSubmitting(false)
      vatChechkingRef.current = false
      return
    }
    vatChechkingRef.current = false
    const newPreview = update(preview, {
      vatNumberValidate: { $set: vatNumberValidate }
    })
    setPreview(newPreview)
    if (!vatNumberValidate.valid) {
      setSubmitting(false)
      message.error('Invalid VAT, please re-type or leave it blank.')
      return
    }

    await createPreview()
    setSubmitting(false)
  }

  const confirmCheck = () => {
    if (preview == null) {
      return false
    }
    if (preview.vatNumberValidate != null && !preview.vatNumberValidate.valid) {
      message.error('Invalid VAT number')
      return false
    }
    if (preview.discountMessage != '') {
      message.error('Invalid discount code')
      return false
    }

    if (
      (preview === null && discountCode !== '') || // code provided, but not applied(apply btn not clicked)
      (preview !== null &&
        preview.discount != null &&
        preview.discount?.code !== discountCode) // code provided and applied, but changed in input field
    ) {
      createPreview()
      return false
    }

    return true
  }

  const onConfirm = async () => {
    if (!confirmCheck()) {
      return
    }

    if (wireConfirmStep) {
      setLoading(true)
      const [_, err] = await markWireCompleteReq(subscriptionId.current)
      setLoading(false)
      if (null != err) {
        message.error(err.message)
        return
      }
      closeModal()
      message.success('Subscription created.')
      navigate(`${APP_PATH}my-subscription`)
      return
    }

    if (vatChechkingRef.current) {
      return
    }

    if (null == gatewayId) {
      message.error('Please select a payment method.')
      return
    }

    // this is a trial-enabled plan, and requires billing info, card info
    if (plan.trialDurationTime > 0 && plan.trialDemand != '') {
      if (
        appConfig.gateway.find((g) => g.gatewayName == 'stripe')?.gatewayId !=
        gatewayId
      ) {
        message.error(
          'This payment method is not supported to enable the trial.'
        )
        return
      }
    }

    if (isWireSelected) {
      const wire = appConfig.gateway.find(
        (g) => g.gatewayName == 'wire_transfer'
      )
      if (wire?.currency != preview?.currency) {
        message.error(`Wire transfer currency is ${wire?.currency}`)
        return
      }
      if (wire!.minimumAmount! > preview!.totalAmount) {
        message.error(
          `Minimum amount of wire transfer is: ,
          ${showAmount(
            wire!.minimumAmount as number,
            wire!.currency as string,
            false
          )}`
        )
        return
      }
    }

    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : []

    setSubmitting(true)
    const [createSubRes, err] = await createSubscriptionReq({
      planId: plan.id,
      addons: addons.map((a) => ({
        quantity: a.quantity as number,
        addonPlanId: a.id
      })),
      confirmTotalAmount: preview?.totalAmount as number,
      confirmCurrency: preview?.currency as string,
      vatCountryCode: selectedCountry, // preview?.vatCountryCode as string,
      vatNumber, // preview?.vatNumber as string,
      gatewayId,
      discountCode: discountCode,
      applyPromoCredit: creditAmount != null && creditAmount > 0,
      applyPromoCreditAmount: creditAmount ?? 0
    })
    setSubmitting(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    // user has updated either one of them, need to update the local store. Backend will also update these values.
    if (defaultVatNumber != vatNumber || userCountryCode != selectedCountry) {
      const p = update(profileStore.getProfile(), {
        vATNumber: { $set: vatNumber },
        countryCode: { $set: selectedCountry }
      })
      profileStore.setProfile(p)
    }

    if (isWireSelected) {
      subscriptionId.current = createSubRes.subscription.subscriptionId
      setWireConfirmStep(!wireConfirmStep)
      return
    }

    const { link } = createSubRes
    if (link != '' && link != null) {
      window.open(link, '_blank')
    }
    navigate(`${APP_PATH}my-subscription`)
  }

  const onClose = () => {
    closeModal()
    if (wireConfirmStep) {
      message.success('Subscription created.')
      navigate(`${APP_PATH}my-subscription`)
    }
  }

  // payment method change will cause VAT re-calclulation
  useEffect(() => {
    createPreview()
  }, [selectedCountry, gatewayId])

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
                      i.currency
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
                        value: c.countryCode
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
                <div className=" my-4 flex w-80 flex-col justify-center gap-4">
                  <div>
                    <div className="flex justify-between">
                      <InputNumber
                        style={{ width: 240 }}
                        min={1}
                        value={creditAmount}
                        onChange={onCreditAmtChange}
                        placeholder={`Credit available: ${promoCredit?.amount} (${promoCredit && showAmount(promoCredit?.currencyAmount, promoCredit?.currency)})`}
                      />
                      <Button
                        onClick={createPreview}
                        // loading={codeChecking}
                      >
                        Apply
                      </Button>
                    </div>
                    {creditUseNote()}
                  </div>
                  <div>
                    <div className="flex  justify-between">
                      <Input
                        style={{ width: 240 }}
                        value={discountCode}
                        onChange={onDiscountCodeChange}
                        placeholder="Discount code"
                      />
                      <Button onClick={createPreview}>Apply</Button>
                    </div>
                    <div className="flex">{discountCodeUseNote()}</div>
                  </div>
                </div>
              </div>

              <div className="w-2/5">
                <Row>
                  <Col
                    span={16}
                    style={{ fontSize: '18px' }}
                    className=" text-gray-700"
                  >
                    Subtotal
                  </Col>
                  <Col
                    className=" text-gray-800"
                    span={8}
                  >{`${showAmount(preview.invoice.subscriptionAmountExcludingTax, preview.invoice.currency)}`}</Col>
                </Row>
                <Row>
                  <Col
                    span={16}
                    style={{ fontSize: '18px' }}
                    className=" text-gray-700"
                  >
                    Credit Used
                    {preview.invoice.promoCreditPayout != null &&
                      `(${preview.invoice.promoCreditPayout.creditAmount})`}
                  </Col>
                  <Col className=" text-gray-800" span={8}>
                    {showAmount(
                      -1 * preview.invoice.promoCreditDiscountAmount,
                      preview.invoice.currency
                    )}
                  </Col>
                </Row>
                <Row>
                  <Col
                    span={16}
                    style={{ fontSize: '18px' }}
                    className=" text-gray-800"
                  >
                    Discounted Amount
                  </Col>
                  <Col
                    className=" text-gray-800"
                    span={8}
                  >{`${showAmount(preview.discountAmount * -1, preview.currency)}`}</Col>
                </Row>
                <Row>
                  <Col
                    span={16}
                    style={{ fontSize: '18px' }}
                    className=" text-gray-700"
                  >
                    Tax{`(${preview.invoice.taxPercentage / 100} %)`}
                  </Col>
                  <Col
                    span={8}
                    className=" text-gray-700"
                  >{`${showAmount(preview.invoice.taxAmount, preview.invoice.currency)} `}</Col>
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
  )
}

export default Index
