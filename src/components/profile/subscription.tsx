import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Divider,
  Empty,
  Popover,
  Row,
  Spin,
  Tooltip,
  message
} from 'antd'
import dayjs from 'dayjs'
import React, { CSSProperties, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SUBSCRIPTION_STATUS } from '../../constants'
import { daysBetweenDate, showAmount } from '../../helpers'
import { getSubDetailReq } from '../../requests'
import '../../shared.css'
import { DiscountCode, ISubscription } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import CancelSubModal from '../modals/modalCancelPendingSub'
import ModalResumeOrTerminateSub from '../modals/modalTerminateOrResumeSub'
import { DiscountCodeStatus, SubscriptionStatus } from '../ui/statusTag'

const APP_PATH = import.meta.env.BASE_URL // default is / (if no --base specified in build cmd)

const Index = ({
  subDetail,
  productId,
  normalizeSub
}: {
  subDetail: ISubscription | undefined
  productId: string
  normalizeSub: (sub: ISubscription) => ISubscription
}) => {
  const location = useLocation()
  // const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<ISubscription | undefined>(
    subDetail
  )
  const navigate = useNavigate()

  const refresh = async () => {
    if (subDetail == null) {
      return
    }
    setLoading(true)
    const [s, err] = await getSubDetailReq(subDetail.subscriptionId)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    // user might cancel a pending sub, after refresh, backend returns a null, I need to set to null
    // thus, page will show 'no subscription'
    if (null == s) {
      setSubscription(undefined)
    }

    const sub = normalizeSub(s)
    setSubscription(sub)
  }

  const goToChoosePlan = () =>
    navigate(`${APP_PATH}plans?productId=${productId}`)

  useEffect(() => {
    if (location.state && location.state.msg) {
      message.info(location.state.msg)
    }
  }, [])

  return (
    <div>
      <Spin
        spinning={loading}
        size="small"
        indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
      >
        {subscription == null ? (
          <div className="flex flex-col items-center justify-center">
            <Empty
              description="No Subscription"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            <Button onClick={goToChoosePlan} type="link">
              Go to choose one
            </Button>
          </div>
        ) : (
          <>
            <SubscriptionInfoSection subInfo={subscription} refresh={refresh} />
            {subscription.unfinishedSubscriptionPendingUpdate && (
              <PendingUpdateSection subInfo={subscription} />
            )}
          </>
        )}
      </Spin>
    </div>
  )
}

export default Index

const PendingUpdateSection = ({ subInfo }: { subInfo: ISubscription }) => {
  const i = subInfo.unfinishedSubscriptionPendingUpdate
  return (
    <>
      <Divider
        orientation="left"
        style={{ margin: '32px 0', color: '#757575' }}
      >
        Pending Update
      </Divider>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan
        </Col>
        <Col span={6}>{i!.updatePlan.planName}</Col>
        <Col span={4} style={colStyle}>
          Plan Description
        </Col>
        <Col span={6}>{i!.updatePlan.description}</Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan Price
        </Col>
        <Col span={6}>
          {showAmount(i!.updatePlan.amount, i!.updatePlan.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Addons Price
        </Col>
        <Col span={6}>
          {i?.updateAddons &&
            showAmount(
              i.updateAddons!.reduce(
                (
                  sum,
                  { quantity, amount }: { quantity: number; amount: number }
                ) => sum + quantity * amount,
                0
              ),
              i.updateCurrency
            )}

          {i?.updateAddons && i.updateAddons.length > 0 && (
            <Popover
              placement="top"
              title="Addon breakdown"
              content={
                <div style={{ width: '280px' }}>
                  {i?.updateAddons.map((a) => (
                    <Row key={a.id}>
                      <Col span={10}>{a.planName}</Col>
                      <Col span={14}>
                        {showAmount(a.amount, a.currency)} × {a.quantity} ={' '}
                        {showAmount(a.amount * a.quantity, a.currency)}
                      </Col>
                    </Row>
                  ))}
                </div>
              }
            >
              <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
                <InfoCircleOutlined />
              </span>
            </Popover>
          )}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Proration Amount
        </Col>
        <Col span={6}>{showAmount(i!.prorationAmount, i!.updateCurrency)}</Col>
        <Col span={4} style={colStyle}>
          <span>Paid</span>
        </Col>
        <Col span={6}>
          {i!.paid == 1 ? (
            <CheckCircleOutlined style={{ color: 'green' }} />
          ) : (
            <MinusOutlined style={{ color: 'red' }} />
          )}
          {i!.link != '' && (
            <a
              href={i!.link}
              target="_blank"
              style={{ marginLeft: '8px', fontSize: '11px' }}
            >
              Payment Link
            </a>
          )}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Total Amount
        </Col>
        <Col span={6}>
          {' '}
          {showAmount(i!.updateAmount, i!.updatePlan.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Bill Period
        </Col>
        <Col span={6}>
          {`${i!.updatePlan.intervalCount} ${i!.updatePlan.intervalUnit}`}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Effective Date
        </Col>
        <Col span={6}>{dayjs(i!.effectTime * 1000).format('YYYY-MMM-DD')}</Col>
      </Row>
    </>
  )
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }

interface ISubSectionProps {
  subInfo: ISubscription
  refresh: () => void
}
const SubscriptionInfoSection = ({ subInfo, refresh }: ISubSectionProps) => {
  const appConfigStore = useAppConfigStore()
  const navigate = useNavigate()
  const [resumeOrTerminateModal, setResumeOrTerminateModal] = useState(false)
  const toggleResumeOrTerminateSubModal = () =>
    setResumeOrTerminateModal(!resumeOrTerminateModal)
  const [action, setAction] = useState<'CANCEL' | 'UN-CANCEL'>('CANCEL')
  const openModal = (action: 'CANCEL' | 'UN-CANCEL') => {
    setAction(action)
    toggleResumeOrTerminateSubModal()
  }

  const [cancelSubModalOpen, setCancelSubModalOpen] = useState(false)
  const toggleCancelSubModal = () => setCancelSubModalOpen(!cancelSubModalOpen)

  const discountAmt = (code: DiscountCode) => {
    if (code.discountType == 1) {
      // percentage
      return `${code.discountPercentage / 100} %`
    } else if (code.discountType == 2) {
      // fixed amt
      return showAmount(code.discountAmount, code.currency)
    } else {
      return ''
    }
  }

  return (
    <>
      <SubReminder sub={subInfo} toggleModal={toggleCancelSubModal} />
      {cancelSubModalOpen && (
        <CancelSubModal
          subInfo={subInfo}
          refresh={refresh}
          closeModal={toggleCancelSubModal}
        />
      )}
      <ModalResumeOrTerminateSub
        isOpen={resumeOrTerminateModal}
        action={action}
        subInfo={subInfo}
        closeModal={toggleResumeOrTerminateSubModal}
        refresh={refresh}
      />
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan
        </Col>
        <Col span={6}>{subInfo?.plan?.planName}</Col>
        <Col span={4} style={colStyle}>
          Plan Description
        </Col>
        <Col span={6}>{subInfo?.plan?.description}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Status
        </Col>
        <Col span={6}>
          {subInfo && SubscriptionStatus(subInfo.status)}
          <span
            style={{ cursor: 'pointer', marginLeft: '8px' }}
            onClick={refresh}
          >
            <Tooltip title="Refresh">
              <SyncOutlined />
            </Tooltip>
          </span>
        </Col>
        <Col span={4} style={colStyle}>
          Subscription Id
        </Col>
        <Col span={6}>{subInfo?.subscriptionId}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan Price
        </Col>
        <Col span={6}>
          {subInfo?.plan?.amount &&
            showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Total Amount
        </Col>
        <Col span={6}>
          {showAmount(
            subInfo.latestInvoice?.totalAmount,
            subInfo.latestInvoice?.currency
          )}
          {subInfo &&
          subInfo.latestInvoice?.taxPercentage &&
          subInfo.latestInvoice?.taxPercentage != 0 ? (
            <span style={{ color: '#757575', fontSize: '11px' }}>
              {` (${
                subInfo &&
                subInfo.latestInvoice?.taxPercentage &&
                subInfo.latestInvoice?.taxPercentage / 100
              }% tax incl)`}
            </span>
          ) : null}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Discount Amount
        </Col>
        <Col span={6}>
          {subInfo &&
            subInfo.latestInvoice &&
            showAmount(
              subInfo.latestInvoice.discountAmount as number,
              subInfo.latestInvoice.currency
            )}

          {subInfo &&
            subInfo.latestInvoice &&
            subInfo.latestInvoice.discount && (
              <Popover
                placement="top"
                title="Discount code info"
                content={
                  <div style={{ width: '320px' }}>
                    <Row>
                      <Col span={10} className=" font-bold text-gray-500">
                        Code
                      </Col>
                      <Col span={14}>{subInfo.latestInvoice.discount.code}</Col>
                    </Row>
                    <Row>
                      <Col span={10} className=" font-bold text-gray-500">
                        Name
                      </Col>
                      <Col span={14}>{subInfo.latestInvoice.discount.name}</Col>
                    </Row>
                    <Row>
                      <Col span={10} className=" font-bold text-gray-500">
                        Status
                      </Col>
                      <Col span={14}>
                        {DiscountCodeStatus(
                          subInfo.latestInvoice.discount.status as number
                        )}
                      </Col>
                    </Row>
                    <Row>
                      <Col span={10} className=" font-bold text-gray-500">
                        Billing Type
                      </Col>
                      <Col span={14}>
                        {subInfo.latestInvoice.discount.billingType === 1
                          ? 'One-time use'
                          : 'Recurring'}
                      </Col>
                    </Row>
                    <Row>
                      <Col span={10} className=" font-bold text-gray-500">
                        Discount Amt
                      </Col>
                      <Col span={14}>
                        {discountAmt(subInfo.latestInvoice.discount)}
                      </Col>
                    </Row>
                    <Row>
                      <Col span={10} className=" font-bold text-gray-500">
                        Cycle limit
                      </Col>
                      <Col span={14}>
                        {subInfo.latestInvoice.discount.cycleLimit}
                      </Col>
                    </Row>
                    <Row>
                      <Col span={10} className=" font-bold text-gray-500">
                        Valid range
                      </Col>
                      <Col span={14}>
                        {`${dayjs(
                          subInfo.latestInvoice.discount.startTime * 1000
                        ).format(
                          'YYYY-MMM-DD'
                        )} ~ ${dayjs(subInfo.latestInvoice.discount.endTime * 1000).format('YYYY-MMM-DD')} `}
                      </Col>
                    </Row>
                  </div>
                }
              >
                <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
                  <InfoCircleOutlined />
                </span>
              </Popover>
            )}
        </Col>
        <Col span={4} style={colStyle}>
          Addons Price
        </Col>
        <Col span={6}>
          {subInfo &&
            subInfo.addons &&
            showAmount(
              subInfo!.addons!.reduce(
                (
                  sum,
                  { quantity, amount }: { quantity: number; amount: number }
                ) => sum + quantity * amount,
                0
              ),
              subInfo!.currency
            )}

          {subInfo && subInfo.addons && subInfo.addons.length > 0 && (
            <Popover
              placement="top"
              title="Addon breakdown"
              content={
                <div style={{ width: '280px' }}>
                  {subInfo?.addons.map((a) => (
                    <Row key={a.id}>
                      <Col span={10}>{a.planName}</Col>
                      <Col span={14}>
                        {showAmount(a.amount, a.currency)} × {a.quantity} ={' '}
                        {showAmount(a.amount * a.quantity, a.currency)}
                      </Col>
                    </Row>
                  ))}
                </div>
              }
            >
              <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
                <InfoCircleOutlined />
              </span>
            </Popover>
          )}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Credit Used
          {subInfo.latestInvoice?.promoCreditTransaction != null &&
            `(${Math.abs(subInfo.latestInvoice?.promoCreditTransaction?.deltaAmount)})`}
        </Col>
        <Col span={6}>
          {subInfo.latestInvoice?.promoCreditTransaction != null &&
            showAmount(
              Math.abs(
                subInfo.latestInvoice?.promoCreditTransaction
                  ?.deltaCurrencyAmount
              ),
              subInfo.latestInvoice?.promoCreditTransaction?.currency
            )}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Bill Period
        </Col>
        <Col span={6}>
          {subInfo != null && subInfo.plan != null
            ? `${subInfo.plan.intervalCount} ${subInfo.plan.intervalUnit}`
            : ''}
        </Col>
        <Col span={4} style={colStyle}>
          Next Due Date
        </Col>
        <Col span={6}>
          {dayjs(subInfo.currentPeriodEnd * 1000).format('YYYY-MMM-DD')}
          {subInfo != null &&
            subInfo.trialEnd != 0 &&
            subInfo.trialEnd > subInfo.currentPeriodEnd && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#f44336',
                  marginLeft: '6px'
                }}
              >
                +
                {daysBetweenDate(
                  subInfo.currentPeriodEnd * 1000,
                  subInfo.trialEnd * 1000
                )}{' '}
                days →{' '}
                {dayjs(new Date(subInfo.trialEnd * 1000)).format('YYYY-MMM-DD')}
              </span>
            )}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          First Pay
        </Col>
        <Col span={6}>
          {subInfo.firstPaidTime == null || subInfo.firstPaidTime == 0
            ? 'N/A'
            : dayjs(subInfo.firstPaidTime * 1000).format('YYYY-MMM-DD')}
        </Col>
        <Col span={4} style={colStyle}>
          Payment Gateway
        </Col>
        <Col span={10}>
          {' '}
          {subInfo &&
            appConfigStore.gateway.find(
              (g) => g.gatewayId == subInfo?.gatewayId
            )?.gatewayName}
        </Col>
      </Row>

      {subInfo && subInfo.status == 2 && (
        <div className="mx-0 my-6 flex items-center justify-start gap-9">
          <Button
            onClick={() =>
              navigate(`${APP_PATH}plans?productId=${subInfo.productId}`)
            }
          >
            Change Plan
          </Button>
          {/* <Button onClick={toggleEditCardModal}>Edit payment method</Button> */}
          {subInfo.cancelAtPeriodEnd == 0 ? (
            <div className="flex items-center gap-3">
              <Button onClick={() => openModal('CANCEL')}>
                End Subscription
              </Button>
            </div>
          ) : (
            <div>
              <span>Subscription will end on </span>
              <span style={{ color: 'red', marginRight: '8px' }}>
                {subInfo &&
                  dayjs(new Date(subInfo!.currentPeriodEnd * 1000)).format(
                    'YYYY-MMM-DD, HH:mm:ss'
                  )}
              </span>
              <Button onClick={() => openModal('UN-CANCEL')}>Un-cancel</Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// productUpdate.tsx has the same code, refactor it
const SubReminder = ({
  sub,
  toggleModal
}: {
  sub: ISubscription | null
  toggleModal: () => void
}) => {
  const appConfigStore = useAppConfigStore()
  const wireSetup = appConfigStore.gateway.find(
    (g) => g.gatewayName == 'wire_transfer'
  )
  let isWire = false
  if (wireSetup != null && sub?.gatewayId == wireSetup.gatewayId) {
    isWire = true
  }

  const getReminder = () => {
    let n
    switch (sub!.status) {
      case 0:
        n = 'Your subscription is initializing, please wait a few moment.'
        break
      case 1:
        if (isWire) {
          n = (
            <div
              style={{
                color: '#757575',
                fontSize: '12px',
                background: '#fbe9e7',
                borderRadius: '4px',
                padding: '6px',
                marginBottom: '12px'
              }}
            >
              Your subscription has been created, but not activated, please wire
              your payment to
              <Popover
                placement="bottom"
                title="Account Detail"
                content={
                  <div style={{ width: '520px' }}>
                    <Row style={{ marginBottom: '6px' }}>
                      <Col span={8} className="text-lg font-bold text-gray-500">
                        Account Holder
                      </Col>
                      <Col span={16}>{wireSetup!.bank?.accountHolder}</Col>
                    </Row>
                    <Row style={{ marginBottom: '6px' }}>
                      <Col span={8} className="text-lg font-bold text-gray-500">
                        BIC
                      </Col>
                      <Col span={16}>{wireSetup!.bank?.bic}</Col>
                    </Row>
                    <Row style={{ marginBottom: '6px' }}>
                      <Col span={8} className="text-lg font-bold text-gray-500">
                        IBAN
                      </Col>
                      <Col span={16}>{wireSetup!.bank?.iban}</Col>
                    </Row>
                  </div>
                }
              >
                <span className=" cursor-pointer text-blue-600">
                  &nbsp;this account&nbsp;
                </span>
              </Popover>
              in 5 days. If we haven't received your payment within 5 days, your
              subscription will be cancelled, or you can{' '}
              <Button
                type="link"
                style={{ padding: '0' }}
                onClick={toggleModal}
              >
                CANCEL
              </Button>{' '}
              this subscription immediately.
            </div>
          )
        } else {
          n = (
            <div
              style={{
                color: '#757575',
                fontSize: '12px',
                background: '#fbe9e7',
                borderRadius: '4px',
                padding: '6px',
                marginBottom: '12px'
              }}
            >
              Your subscription has been created, but not activated, please go
              to{' '}
              <a href={sub!.link} target="_blank">
                checkout page
              </a>{' '}
              to finish the payment within 3 days. If you haven't finished the
              payment within 3 days, your subscription will be cancelled, or you
              can{' '}
              <Button
                type="link"
                style={{ padding: '0' }}
                onClick={toggleModal}
              >
                Cancel
              </Button>{' '}
              this subscription immediately.
            </div>
          )
        }

        break
      case 3:
        n = `Your subscription is in ${SUBSCRIPTION_STATUS[3]} status, please wait`
        break
      case 7:
      case 8:
        n = (
          <div
            style={{
              color: '#757575',
              fontSize: '12px',
              background: '#fbe9e7',
              borderRadius: '4px',
              padding: '6px',
              marginBottom: '12px'
            }}
          >
            We are checking your payment, please be patient. Make sure you have
            sent the payment to
            <Popover
              placement="bottom"
              title="Account Detail"
              content={
                <div style={{ width: '520px' }}>
                  <Row style={{ marginBottom: '6px' }}>
                    <Col span={8} className="text-lg  text-gray-500">
                      Account Holder
                    </Col>
                    <Col span={16}>{wireSetup!.bank?.accountHolder}</Col>
                  </Row>
                  <Row style={{ marginBottom: '6px' }}>
                    <Col span={8} className="text-lg text-gray-500">
                      BIC
                    </Col>
                    <Col span={16}>{wireSetup!.bank?.bic}</Col>
                  </Row>
                  <Row style={{ marginBottom: '6px' }}>
                    <Col span={8} className="text-lg  text-gray-500">
                      IBAN
                    </Col>
                    <Col span={16}>{wireSetup!.bank?.iban}</Col>
                  </Row>
                </div>
              }
            >
              <span className=" cursor-pointer text-blue-600">
                &nbsp;this account&nbsp;
              </span>
            </Popover>
            in 5 days. If we haven't received your payment within 5 days, your
            subscription will be cancelled, or you can{' '}
            <Button type="link" style={{ padding: '0' }} onClick={toggleModal}>
              CANCEL
            </Button>{' '}
            this subscription immediately.
          </div>
        )
        break
      default:
        n = ''
    }
    return n
    // STATUS[sub?.status as keyof typeof STATUS]
  }

  if (sub == null || sub.status == 2) {
    // 2: active, only with this status, users can upgrade/downgrad/change
    return null // nothing need to be shown on page.
  }
  return getReminder()
  // <div>{STATUS[sub.status as keyof typeof STATUS]}</div>;
}
