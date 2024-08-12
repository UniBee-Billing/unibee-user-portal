import { LoadingOutlined } from '@ant-design/icons'
import { Button, Col, Empty, Modal, Popover, Row, Spin, message } from 'antd'
import update from 'immutability-helper'
import React, { useEffect, useRef, useState } from 'react'
import { showAmount } from '../../helpers'
import { getActiveSubWithMore, getCountryList } from '../../requests'
import { Country, IPlan, ISubscription } from '../../shared.types'
import { useAppConfigStore, useProfileStore } from '../../stores'
import OTPBuyListModal from '../modals/addonBuyListModal'
import BillingAddressModal from '../modals/billingAddressModal'
import CancelSubModal from '../modals/modalCancelPendingSub'
import CreateSubModal from '../modals/modalCreateSub'
import UpdatePlanModal from '../modals/modalUpdateSub'
import OTPModal from '../modals/onetimePaymentModal'
import Plan from './plan'

const Index = ({
  productId,
  subList
}: {
  productId: number
  subList: ISubscription[]
}) => {
  const profileStore = useProfileStore()
  // const appConfigStore = useAppConfigStore();
  const activeSub = useRef(subList.find((s) => s.productId == productId)) // undefined means: no active sub in this product
  const [plans, setPlans] = useState<IPlan[]>([])
  const [otpPlans, setOtpPlans] = useState<IPlan[]>([]) // one-time-payment plan,
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null) // null: not selected
  const [countryList, setCountryList] = useState<Country[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false) // create subscription Modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false) // update subscription Modal
  const [billingAddressModalOpen, setBillingAddressModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  // const [terminateModal, setTerminateModal] = useState(false);
  // const [activeSub, setActiveSub] = useState<ISubscription | null>(null) // null: when page is loading, no data is ready yet.
  const isNewUserRef = useRef(true) // new user can only create sub, old user(already has a sub) can only upgrade/downgrade/change sub.
  // they have different api call and Modal window
  const [otpModalOpen, setOtpModalOpen] = useState(false) // one-time-payment modal
  const toggleOTP = () => setOtpModalOpen(!otpModalOpen)
  const [otpPlanId, setOtpPlanId] = useState<null | number>(null) // the one-time-payment addon user want to buy

  // new user has choosen a sub plan, but haven't paid yet, before the payment due day, they can still cancel it
  // this modal is for this purpose only.
  // It's not the same as 'terminate an active sub'.
  const [cancelSubModalOpen, setCancelSubModalOpen] = useState(false)

  const [buyRecordModalOpen, setBuyRecordModalOpen] = useState(false)
  const toggleBuyRecordModal = () => setBuyRecordModalOpen(!buyRecordModalOpen)

  const toggleCreateModal = () => setCreateModalOpen(!createModalOpen) // Modal for first time plan choosing
  const toggleUpdateModal = () => setUpdateModalOpen(!updateModalOpen) // Modal for update plan
  const toggleBillingModal = () =>
    setBillingAddressModalOpen(!billingAddressModalOpen)

  const toggleCancelSubModal = () => setCancelSubModalOpen(!cancelSubModalOpen)

  const onAddonChange = (
    addonId: number,
    quantity: number | null, // null means: don't update this field, keep its original value
    checked: boolean | null // ditto
  ) => {
    const planIdx = plans.findIndex((p) => p.id == selectedPlan)
    if (planIdx == -1) {
      return
    }
    const addonIdx = plans[planIdx].addons!.findIndex((a) => a.id == addonId)
    if (addonIdx == -1) {
      return
    }

    let newPlans = plans
    if (quantity == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { checked: { $set: checked as boolean } } }
        }
      })
    } else if (checked == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { quantity: { $set: quantity as number } } }
        }
      })
    }
    setPlans(newPlans)
  }

  const fetchCountry = async () => {
    const [list, err] = await getCountryList()
    if (null != err) {
      message.error(err.message)
      return
    }
    setCountryList(
      list.map((c: any) => ({
        countryCode: c.countryCode,
        countryName: c.countryName
      }))
    )
  }

  const fetchData = async () => {
    setLoading(true)
    const [res, err] = await getActiveSubWithMore(productId, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    const { subscriptions, plans } = res
    // let sub
    /*
    if (subscriptions != null && subscriptions[0] != null) {
      // there is only one active sub at most or null.
      // null: new user(no purchase record), non-null: user has bought one plan, and want to change/upgrade/downgrade
      sub = subscriptions[0]
      isNewUserRef.current = false
      // TODO: backup current user's selectedPlan and addons info
    } else {
      // user has an active sub, but not paid, after cancel, active sub becomes null, I need to set its state back to null
      // otherwise, page still use the obsolete sub info.
      setActiveSub(null)
      isNewUserRef.current = true
    }
      */

    // addons and other props are separated in different area in the response subscription obj, I want to combine them into one subscription obj
    /*
    let localActiveSub: ISubscription | null = null
    if (sub != null) {
      localActiveSub = { ...sub.subscription }
      ;(localActiveSub as ISubscription).addons = sub.addonParams
      console.log('local sub: ', localActiveSub)
      setActiveSub(localActiveSub)
      setSelectedPlan(sub.subscription.planId)
    }
      */

    let localPlans: IPlan[] =
      plans == null
        ? []
        : plans.map((p: any) => {
            return {
              ...p.plan,
              addons: p.addons,
              onetimeAddons: p.onetimeAddons
            }
          })
    // localPlans = localPlans.filter((p) => p != null);
    // opt plans
    setOtpPlans(localPlans.filter((p) => p.type == 3))

    if (activeSub.current != null) {
      const planIdx = plans.findIndex(
        (p: any) => p.id == activeSub.current?.planId
      )
      // let's say we have planA(which has addonA1, addonA2, addonA3), planB, planC, user has subscribed to planA, and selected addonA1, addonA3
      // I need to find the index of addonA1,3 in planA.addons array,
      // then set their {quantity, checked: true} props on planA.addons, these props value are from subscription.addons array.
      if (planIdx != -1 && plans[planIdx].addons != null) {
        for (let i = 0; i < plans[planIdx].addons!.length; i++) {
          const addonIdx = activeSub.current.addons.findIndex(
            (subAddon) => subAddon.addonPlanId == plans[planIdx].addons![i].id
          )
          if (addonIdx != -1) {
            plans[planIdx].addons![i].checked = true
            plans[planIdx].addons![i].quantity =
              activeSub.current.addons[addonIdx].quantity
          }
        }
      }
    }

    console.log('plans/productId: : ', localPlans, '///', productId)
    // main plans
    setPlans(localPlans.filter((p) => p.type == 1))
  }

  const upgradeCheck = () => {
    return true

    if (isNewUserRef.current) {
      // user has no active sub, this is first-time purchase, not a upgrade
      return true
    }
    console.log('upgrade check, planList in this product: ', plans)
    const currentPlan = plans.find((p) => p.id == activeSub.current?.planId)
    const upgradePlan = plans.find((p) => p.id == selectedPlan)
    console.log(
      'current/upgrade: ',
      currentPlan,
      '//',
      upgradePlan,
      '/active sub: ',
      activeSub.current
    )

    if (currentPlan?.currency != upgradePlan?.currency) {
      console.log(
        'currentPlan?.currency != upgradePlan?.currency ',
        currentPlan?.currency,
        '///',
        upgradePlan?.currency
      )
      message.error(
        'Upgrade to a plan with different currency is not supported.'
      )
      return false
    }
    if (currentPlan?.intervalUnit == upgradePlan?.intervalUnit) {
      if (currentPlan?.intervalCount! > upgradePlan?.intervalCount!) {
        // we are selecting plan, itvCount always exist
        message.error(
          `Upgrade from a ${currentPlan?.intervalCount}/${currentPlan?.intervalUnit} plan to a ${upgradePlan?.intervalCount}/${upgradePlan?.intervalUnit} is not supported.`
        )
        return false
      } else {
        return true
      }
    }

    const units: { [key: string]: number } = {
      day: 24 * 60 * 60,
      week: 7 * 24 * 60 * 60,
      month: 30 * 24 * 60 * 60,
      year: 365 * 24 * 60 * 60
    }

    if (units[currentPlan!.intervalUnit] > units[upgradePlan!.intervalUnit]) {
      message.error(
        `Upgrade from a ${currentPlan?.intervalCount}/${currentPlan?.intervalUnit} plan to a ${upgradePlan?.intervalCount}/${upgradePlan?.intervalUnit} is not supported.`
      )
      return false
    }

    return true
  }

  const onPlanConfirm = () => {
    if (!upgradeCheck()) {
      return
    }

    if (profileStore.countryCode == '' || profileStore.countryCode == null) {
      toggleBillingModal()
      return
    }
    const plan = plans.find((p) => p.id == selectedPlan)
    let valid = true
    if (plan?.addons != null && plan.addons.length > 0) {
      for (let i = 0; i < plan.addons.length; i++) {
        if (plan.addons[i].checked) {
          const q = Number(plan.addons[i].quantity)
          if (!Number.isInteger(q) || q <= 0) {
            valid = false
            break
          }
        }
      }
    }
    if (!valid) {
      message.error('Please input valid addon quantity.')
      return
    }

    // isNewUserRef.current ? toggleCreateModal() : toggleUpdateModal()
    activeSub.current == null ? toggleCreateModal() : toggleUpdateModal()
  }

  useEffect(() => {
    fetchData()
    fetchCountry()
  }, [])

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      <SubReminder sub={activeSub.current} toggleModal={toggleCancelSubModal} />
      {/* <Button onClick={toggleBuyRecordModal} type="link">
        addon purchase record
      </Button> */}
      {buyRecordModalOpen && activeSub.current && (
        <OTPBuyListModal
          subscriptionId={activeSub.current?.subscriptionId}
          closeModal={toggleBuyRecordModal}
        />
      )}
      <BillingAddressModal
        isOpen={billingAddressModalOpen}
        closeModal={toggleBillingModal}
        openPreviewModal={
          isNewUserRef.current ? toggleCreateModal : toggleUpdateModal
        }
      />
      {cancelSubModalOpen && (
        <CancelSubModal
          subInfo={activeSub.current}
          closeModal={toggleCancelSubModal}
          refresh={fetchData}
        />
      )}
      {
        // update subscription
        updateModalOpen && activeSub.current != null && (
          <UpdatePlanModal
            plan={plans.find((p) => p.id == selectedPlan) as IPlan}
            subscriptionId={activeSub.current.subscriptionId}
            closeModal={toggleUpdateModal}
            refresh={fetchData}
          />
        )
      }
      {
        // first time purchase,
        createModalOpen && isNewUserRef.current && (
          <CreateSubModal
            plan={plans.find((p) => p.id == selectedPlan) as IPlan}
            countryList={countryList}
            defaultVatNumber={profileStore.vATNumber}
            closeModal={toggleCreateModal}
            userCountryCode={profileStore.countryCode}
          />
        )
      }
      {otpModalOpen && (
        <OTPModal
          closeModal={toggleOTP}
          plan={otpPlans.find((p) => p.id == otpPlanId)}
          subscriptionId={activeSub.current!.subscriptionId}
        />
      )}

      <div
        style={{ maxHeight: 'calc(100vh - 460px)', overflowY: 'auto' }}
        className="flex flex-wrap gap-6 pb-5 pl-4"
      >
        {plans.length == 0 && !loading ? (
          <div className="flex w-full items-center justify-center">
            <Empty description="No plan" />
          </div>
        ) : (
          plans.map((p) => (
            <Plan
              key={p.id}
              plan={p}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              onAddonChange={onAddonChange}
              isActive={p.id == activeSub.current?.planId}
              setOtpPlanId={setOtpPlanId} // open one-time-payment modal to confirm: buy this addon?
              toggleOtpModal={toggleOTP}
            />
          ))
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '48px'
        }}
      >
        {plans.length > 0 && (
          <Button
            type="primary"
            onClick={onPlanConfirm}
            // disabled={selectedPlan == null || activeSub?.status != 2}
            disabled={
              selectedPlan == null ||
              activeSub.current?.status == 0 || // initiating
              activeSub.current?.status == 1 || // created (not paid)
              activeSub.current?.status == 3 // pending (payment in processing)
            }
          >
            Buy
          </Button>
        )}
        {/* 
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Button
          type="primary"
          onClick={() => setTerminateModal(true)}
          disabled={isNewUserRef.current}
        >
          Terminate Subscription
        </Button>
        this feature has been moved to /my-subscription page.
        */}
      </div>
    </div>
  )
}

export default Index

// same code in profile/subscription, refactor them
const SubReminder = ({
  sub,
  toggleModal
}: {
  sub: ISubscription | null | undefined
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
                        Minimum Amount
                      </Col>
                      <Col span={16}>
                        {showAmount(
                          wireSetup!.minimumAmount as number,
                          wireSetup!.currency as string
                        )}
                      </Col>
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
        n = 'Your subscription is in pending status, please wait'
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
