import { LoadingOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Modal, Row, Spin, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showAmount } from '../../helpers'
import { createUpdatePreviewReq, updateSubscriptionReq } from '../../requests'
import { IPlan, IPreview, InvoiceItemTotal } from '../../shared.types'

const APP_PATH = import.meta.env.BASE_URL

interface Props {
  plan: IPlan
  subscriptionId: string
  discountCode: string
  creditAmt: number | null
  closeModal: () => void
  refresh: () => void // after upgrade, refresh parent component
}

const Index = ({
  plan,
  subscriptionId,
  discountCode,
  creditAmt,
  closeModal,
  refresh
}: Props) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false) // when the Modal is loading, preview is null, Modal has no content, but a loading spinner
  const [submitting, setSubmitting] = useState(false) // when user click submit, preview is not null, Modal has content.
  const [preview, setPreview] = useState<IPreview | null>(null)

  const onConfirm = async () => {
    setSubmitting(true)
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : []
    const [updateSubRes, err] = await updateSubscriptionReq({
      newPlanId: plan?.id,
      subscriptionId,
      addons: addons.map((a) => ({
        quantity: a.quantity as number,
        addonPlanId: a.id
      })),
      confirmTotalAmount: preview?.totalAmount as number,
      confirmCurrency: preview?.currency as string,
      prorationDate: preview?.prorationDate as number,
      discountCode,
      applyPromoCredit: creditAmt != null && creditAmt > 0,
      applyPromoCreditAmount: creditAmt ?? 0
    })
    setSubmitting(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    const { paid, link } = updateSubRes
    // if you're upgrading your plan, Stripe will use your card info from your last time purchase record.
    // so it won't redirect you to chckout form, only if your card is expired or has insufficient fund.
    // the payment will be done immediaetly(most of time).
    if (paid) {
      // after successful plan upgrade, if refresh parent component immediately, backend still return the old plan.
      setTimeout(() => refresh(), 1000)
      message.success('Plan updated')
      closeModal()
      return
    }
    navigate(`${APP_PATH}my-subscription`, {
      // receiving route hasn't read this msg yet.
      state: { msg: 'Subscription updated' }
    })
    window.open(link, '_blank')
  }

  useEffect(() => {
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : []
    const fetchPreview = async () => {
      setLoading(true)
      const [previewRes, err] = await createUpdatePreviewReq({
        planId: plan!.id,
        addons: addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id
        })),
        subscriptionId: subscriptionId,
        discountCode: discountCode,
        applyPromoCredit: creditAmt != null && creditAmt > 0,
        applyPromoCreditAmount: creditAmt ?? 0
      })
      setLoading(false)
      if (null != err) {
        message.error(err.message)
        return
      }
      setPreview(previewRes)
    }
    fetchPreview()
  }, [])

  return (
    <Modal
      title="Subscription Update Preview"
      maskClosable={false}
      open={true}
      footer={null}
      closeIcon={null}
      width={'920px'}
    >
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Spin
            spinning={true}
            indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
          />
        </div>
      ) : (
        preview != null && (
          <>
            <InvoiceLines
              label="Next Billing Cycle Invoices"
              invoice={preview.nextPeriodInvoice}
              hideDetail={true}
              showButton={true}
            />
            <InvoiceLines label="Current Invoices" invoice={preview.invoice} />
          </>
        )
      )}
      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading || submitting}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading || submitting}
          disabled={loading || submitting}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default Index

const InvoiceLines = ({
  invoice,
  label
}: {
  invoice: InvoiceItemTotal | undefined
  label: string
  hideDetail?: boolean
  showButton?: boolean
}) => {
  return (
    <>
      <Divider
        orientation="left"
        style={{ margin: '32px 0', color: '#757575' }}
      >
        {label}
      </Divider>
      {invoice == null || invoice.lines.length == 0 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#757575'
          }}
        >
          No Items
        </div>
      ) : (
        <>
          <Row style={{ fontWeight: 'bold', margin: '16px 0' }}>
            <Col span={12}>Description</Col>
            <Col span={3}>Unit price</Col>
            <Col span={2}></Col>
            <Col span={4}>Quantity</Col>
            <Col span={3}>Total</Col>
          </Row>
          {invoice.lines.map((i, idx) => (
            <div key={idx}>
              <Row>
                <Col span={12}>{i.description}</Col>
                <Col span={4}>
                  {showAmount(i.unitAmountExcludingTax, i.currency)}
                </Col>
                <Col span={1}></Col>
                <Col span={4}>{i.quantity}</Col>

                <Col span={3}>
                  {showAmount(
                    i.unitAmountExcludingTax * i.quantity,
                    i.currency
                  )}
                </Col>
              </Row>
              {idx != invoice.lines.length - 1 && (
                <Divider style={{ margin: '8px 0' }} />
              )}
            </div>
          ))}

          <div>
            <Divider style={{ margin: '8px 0' }} />
            <Row className="my-1">
              <Col span={17}></Col>
              <Col span={4}>Subtotal</Col>
              <Col span={3}>
                {showAmount(
                  invoice.subscriptionAmountExcludingTax,
                  invoice.currency
                )}
              </Col>
            </Row>
            {invoice.promoCreditDiscountAmount != 0 && (
              <Row className="my-1">
                <Col span={17}> </Col>
                <Col span={4}>
                  Credit Used({invoice?.promoCreditPayout?.creditAmount})
                </Col>
                <Col span={3}>
                  {`${showAmount(-1 * invoice.promoCreditDiscountAmount, invoice.currency)}`}
                </Col>
              </Row>
            )}
            <Row className="my-1">
              <Col span={17}> </Col>
              <Col span={4}>Total Discounted</Col>
              <Col span={3}>
                {`${showAmount(-1 * invoice.discountAmount, invoice.currency)}`}
              </Col>
            </Row>
            <Row className="my-1">
              <Col span={17}></Col>
              <Col span={4}>
                VAT(
                {`${invoice.taxPercentage / 100}%`})
              </Col>
              <Col span={3} style={{ fontWeight: 'bold' }}>
                {showAmount(invoice.taxAmount, invoice.currency)}
              </Col>
            </Row>
          </div>
          <Row className="my-1">
            <Col span={17}></Col>
            <Col span={4}>Total </Col>
            <Col span={3} style={{ fontWeight: 'bold' }}>
              {showAmount(invoice.totalAmount, invoice.currency)}
            </Col>
          </Row>
        </>
      )}
    </>
  )
}
