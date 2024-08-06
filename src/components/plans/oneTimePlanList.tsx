import { LoadingOutlined } from '@ant-design/icons'
import { Button, Col, Empty, Modal, Popover, Row, Spin, message } from 'antd'
import update from 'immutability-helper'
import React, { useEffect, useRef, useState } from 'react'
import { showAmount } from '../../helpers'
import {
  getActiveSubWithMore,
  getCountryList,
  getPlanList
} from '../../requests'
import { Country, IPlan, ISubscription } from '../../shared.types'
import { useAppConfigStore, useProfileStore } from '../../stores'
import OTPBuyListModal from '../modals/addonBuyListModal'
import BillingAddressModal from '../modals/billingAddressModal'
import CancelSubModal from '../modals/modalCancelPendingSub'
import CreateSubModal from '../modals/modalCreateSub'
import UpdatePlanModal from '../modals/modalUpdateSub'
import OTPModal from '../modals/onetimePaymentModal2'
import Plan from './plan'

const Index = () => {
  const profileStore = useProfileStore()
  // const appConfigStore = useAppConfigStore();
  const [plans, setPlans] = useState<IPlan[]>([])
  const [otpPlans, setOtpPlans] = useState<IPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null) // selected planId, null: not selected
  const [countryList, setCountryList] = useState<Country[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false) // create subscription Modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false) // update subscription Modal
  const [billingAddressModalOpen, setBillingAddressModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  // const [terminateModal, setTerminateModal] = useState(false);
  const [activeSub, setActiveSub] = useState<ISubscription | null>(null) // null: when page is loading, no data is ready yet.
  const isNewUserRef = useRef(true) // new user can only create sub, old user(already has a sub) can only upgrade/downgrade/change sub.
  // they have different api call and Modal window
  const [otpModalOpen, setOtpModalOpen] = useState(false) // one-time-payment modal
  const toggleOTP = () => setOtpModalOpen(!otpModalOpen)
  const [otpPlanId, setOtpPlanId] = useState<null | number>(null) // the one-time-payment addon user want to buy

  const [buyRecordModalOpen, setBuyRecordModalOpen] = useState(false)
  const toggleBuyRecordModal = () => setBuyRecordModalOpen(!buyRecordModalOpen)

  const toggleCreateModal = () => setCreateModalOpen(!createModalOpen) // Modal for first time plan choosing
  const toggleUpdateModal = () => setUpdateModalOpen(!updateModalOpen) // Modal for update plan
  const toggleBillingModal = () =>
    setBillingAddressModalOpen(!billingAddressModalOpen)

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

  const onPlanConfirm = async () => {
    if (profileStore.countryCode == '' || profileStore.countryCode == null) {
      toggleBillingModal()
      return
    }
    toggleOTP()
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
    const [res, err] = await getPlanList({ type: [3] })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    console.log('add on list: ', res)
    // setPlans(localPlans.filter((p) => p.type == 1));
    let localPlans: IPlan[] =
      res == null
        ? []
        : res.map((p: any) => {
            return {
              ...p.plan
            }
          })
    setPlans(localPlans)
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
      {buyRecordModalOpen && activeSub && (
        <OTPBuyListModal
          subscriptionId={activeSub?.subscriptionId}
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

      {otpModalOpen && (
        <OTPModal
          closeModal={toggleOTP}
          plan={plans.find((p) => p.id == selectedPlan)}
        />
      )}

      <div
        style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}
        className="flex flex-wrap gap-6 pb-5"
      >
        {' '}
        {plans.length == 0 && !loading ? (
          <div className="flex w-full items-center justify-center">
            <Empty description="No one-time-addon" />
          </div>
        ) : (
          plans.map((p) => (
            <Plan
              key={p.id}
              plan={p}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              onAddonChange={onAddonChange}
              isActive={p.id == activeSub?.planId}
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
            disabled={selectedPlan == null}
          >
            Buy
          </Button>
        )}
      </div>
    </div>
  )
}

export default Index
