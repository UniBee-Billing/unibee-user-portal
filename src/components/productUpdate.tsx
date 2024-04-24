import { Button, Empty, Modal, Spin, message } from 'antd';
import update from 'immutability-helper';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveSubWithMore, getCountryList } from '../requests';
import Plan from './plan';
// import { CURRENCY } from "../constants";
// import { showAmount } from "../helpers";
import { LoadingOutlined } from '@ant-design/icons';
import { SUBSCRIPTION_STATUS } from '../constants';
import { Country, IPlan, ISubscription } from '../shared.types';
import { useAppConfigStore, useProfileStore } from '../stores';
import OTPBuyListModal from './modals/addonBuyListModal';
import BillingAddressModal from './modals/billingAddressModal';
import CancelSubModal from './modals/modalCancelPendingSub';
import CreateSubModal from './modals/modalCreateSub';
import UpdatePlanModal from './modals/modalUpdateSub';
import OTPModal from './modals/onetimePaymentModal';

const Index = () => {
  const profileStore = useProfileStore();
  // const appConfigStore = useAppConfigStore();
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [otpPlans, setOtpPlans] = useState<IPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null); // null: not selected
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false); // create subscription Modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false); // update subscription Modal
  const [billingAddressModalOpen, setBillingAddressModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  // const [terminateModal, setTerminateModal] = useState(false);
  const [activeSub, setActiveSub] = useState<ISubscription | null>(null); // null: when page is loading, no data is ready yet.
  const isNewUserRef = useRef(true); // new user can only create sub, old user(already has a sub) can only upgrade/downgrade/change sub.
  // they have different api call and Modal window

  const [otpModalOpen, setOtpModalOpen] = useState(false); // one-time-payment modal
  const toggleOTP = () => setOtpModalOpen(!otpModalOpen);
  const [otpPlanId, setOtpPlanId] = useState<null | number>(null); // the one-time-payment addon user want to buy

  // new user has choosen a sub plan, but haven't paid yet, before the payment due day, they can still cancel it
  // this modal is for this purpose only.
  // It's not the same as 'terminate an active sub'.
  const [cancelSubModalOpen, setCancelSubModalOpen] = useState(false);

  const [buyRecordModalOpen, setBuyRecordModalOpen] = useState(false);
  const toggleBuyRecordModal = () => setBuyRecordModalOpen(!buyRecordModalOpen);

  const toggleCreateModal = () => setCreateModalOpen(!createModalOpen); // Modal for first time plan choosing
  const toggleUpdateModal = () => setUpdateModalOpen(!updateModalOpen); // Modal for update plan
  const toggleBillingModal = () =>
    setBillingAddressModalOpen(!billingAddressModalOpen);

  const toggleCancelSubModal = () => setCancelSubModalOpen(!cancelSubModalOpen);

  const onAddonChange = (
    addonId: number,
    quantity: number | null, // null means: don't update this field, keep its original value
    checked: boolean | null, // ditto
  ) => {
    const planIdx = plans.findIndex((p) => p.id == selectedPlan);
    if (planIdx == -1) {
      return;
    }
    const addonIdx = plans[planIdx].addons!.findIndex((a) => a.id == addonId);
    if (addonIdx == -1) {
      return;
    }

    let newPlans = plans;
    if (quantity == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { checked: { $set: checked as boolean } } },
        },
      });
    } else if (checked == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { quantity: { $set: quantity as number } } },
        },
      });
    }
    setPlans(newPlans);
  };

  const fetchCountry = async () => {
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

  const fetchData = async () => {
    setLoading(true);
    const [res, err] = await getActiveSubWithMore(fetchData);
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }

    const { subscriptions, plans } = res;
    let sub;
    if (subscriptions != null && subscriptions[0] != null) {
      // there is only one active sub at most or null.
      // null: new user(no purchase record), non-null: user has bought one plan, and want to change/upgrade/downgrade
      sub = subscriptions[0];
      isNewUserRef.current = false;
      // TODO: backup current user's selectedPlan and addons info
    } else {
      // user has an active sub, but not paid, after cancel, active sub becomes null, I need to set its state back to null
      // otherwise, page still use the obsolete sub info.
      setActiveSub(null);
      isNewUserRef.current = true;
    }

    // addons and other props are separated in different area in the response subscription obj, I want to combine them into one subscription obj
    let localActiveSub: ISubscription | null = null;
    if (sub != null) {
      localActiveSub = { ...sub.subscription };
      (localActiveSub as ISubscription).addons = sub.addonParams;
      console.log('local sub: ', localActiveSub);
      setActiveSub(localActiveSub);
      setSelectedPlan(sub.subscription.planId);
    }

    let localPlans: IPlan[] =
      plans == null
        ? []
        : plans.map((p: any) => {
            const p2 = p.plan;
            /*
            if (p.plan.type == 2 || p.plan.type == 3) {
              // addon plan || one-time-payment plan
              return null;
            }
            */
            return {
              id: p2.id,
              planName: p2.planName,
              description: p2.description,
              type: p2.type,
              amount: p2.amount,
              currency: p2.currency,
              intervalUnit: p2.intervalUnit,
              intervalCount: p2.intervalCount,
              status: p2.status,
              addons: p.addons,
              onetimeAddons: p.onetimeAddons,
            };
          });
    // localPlans = localPlans.filter((p) => p != null);
    // opt plans
    setOtpPlans(localPlans.filter((p) => p.type == 3));

    if (localActiveSub != null) {
      const planIdx = plans.findIndex(
        (p: any) => p.id == localActiveSub!.planId,
      );
      // let's say we have planA(which has addonA1, addonA2, addonA3), planB, planC, user has subscribed to planA, and selected addonA1, addonA3
      // I need to find the index of addonA1,3 in planA.addons array,
      // then set their {quantity, checked: true} props on planA.addons, these props value are from subscription.addons array.
      if (planIdx != -1 && plans[planIdx].addons != null) {
        for (let i = 0; i < plans[planIdx].addons!.length; i++) {
          const addonIdx = localActiveSub.addons.findIndex(
            (subAddon) => subAddon.addonPlanId == plans[planIdx].addons![i].id,
          );
          if (addonIdx != -1) {
            plans[planIdx].addons![i].checked = true;
            plans[planIdx].addons![i].quantity =
              localActiveSub.addons[addonIdx].quantity;
          }
        }
      }
    }

    console.log('plans....: ', localPlans);
    // main plans
    setPlans(localPlans.filter((p) => p.type == 1));
  };

  useEffect(() => {
    fetchData();
    fetchCountry();
  }, []);

  const onPlanConfirm = () => {
    if (profileStore.countryCode == '' || profileStore.countryCode == null) {
      toggleBillingModal();
      return;
    }
    const plan = plans.find((p) => p.id == selectedPlan);
    let valid = true;
    if (plan?.addons != null && plan.addons.length > 0) {
      for (let i = 0; i < plan.addons.length; i++) {
        if (plan.addons[i].checked) {
          const q = Number(plan.addons[i].quantity);
          if (!Number.isInteger(q) || q <= 0) {
            valid = false;
            break;
          }
        }
      }
    }
    if (!valid) {
      message.error('Please input valid addon quantity.');
      return;
    }

    isNewUserRef.current ? toggleCreateModal() : toggleUpdateModal();
  };

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      <SubStatus sub={activeSub} toggleModal={toggleCancelSubModal} />
      {/* <Button onClick={toggleBuyRecordModal} type="link">
        addon purchase record
      </Button> */}
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
      {cancelSubModalOpen && (
        <CancelSubModal
          subInfo={activeSub}
          closeModal={toggleCancelSubModal}
          refresh={fetchData}
        />
      )}
      {
        // update subscription
        updateModalOpen && !isNewUserRef.current && (
          <UpdatePlanModal
            plan={plans.find((p) => p.id == selectedPlan) as IPlan}
            subscriptionId={activeSub!.subscriptionId}
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
            closeModal={toggleCreateModal}
            userCountryCode={profileStore.countryCode}
          />
        )
      }
      {otpModalOpen && (
        <OTPModal
          isOpen={otpModalOpen}
          closeModal={toggleOTP}
          plan={otpPlans.find((p) => p.id == otpPlanId)}
          subscriptionId={activeSub!.subscriptionId}
        />
      )}

      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
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
          margin: '48px',
        }}
      >
        {plans.length > 0 && (
          <Button
            type="primary"
            onClick={onPlanConfirm}
            // disabled={selectedPlan == null || activeSub?.status != 2}
            disabled={
              selectedPlan == null ||
              activeSub?.status == 0 || // initiating
              activeSub?.status == 1 || // created (not paid)
              activeSub?.status == 3 // pending (payment in processing)
            }
          >
            Confirm
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
  );
};

export default Index;

const SubStatus = ({
  sub,
  toggleModal,
}: {
  sub: ISubscription | null;
  toggleModal: () => void;
}) => {
  const getReminder = () => {
    let n;
    switch (sub!.status) {
      case 0:
        n = 'Your subscription is initializing, please wait a few moment.';
        break;
      case 1:
        n = (
          <div
            style={{
              color: '#757575',
              fontSize: '12px',
              background: '#fbe9e7',
              borderRadius: '4px',
              padding: '6px',
              marginBottom: '12px',
            }}
          >
            Your subscription has been created, but not activated, please go to{' '}
            <a href={sub!.link} target="_blank">
              checkout page
            </a>{' '}
            to finishe the payment within 3 days. If you haven't finished the
            payment within 3 days, your subscription will be cancelled, or you
            can{' '}
            <Button type="link" style={{ padding: '0' }} onClick={toggleModal}>
              Cancel
            </Button>{' '}
            this subscription immediately.
          </div>
        );
        break;
      case 3:
        n = 'Your subscription is in pending status, please wait';
        break;
      default:
        n = '';
    }
    return n;
    // STATUS[sub?.status as keyof typeof STATUS]
  };

  if (sub == null || sub.status == 2) {
    // 2: active, only with this status, users can upgrade/downgrad/change
    return null; // nothing need to be shown on page.
  }
  return getReminder();
  // <div>{STATUS[sub.status as keyof typeof STATUS]}</div>;
};

/*
 0: "Initiating", // used when creating the sub, it only exist for a very short time, user might not realize it exists
  1: "Pending", // when sub is created, but user hasn't paid yet, 
  2: "Active", // user paid the sub fee
  // 3: "Suspended", // suspend: not used yet. For future implementation: users might want to suspend the sub for a period of time, during which, they don't need to pay
  3: "Pending", // when status is transitioning from 1 to 2, or 2 to 4, there is a pending status, transition is not synchronous, 
  // coz payment is not synchronous, so we have to wait, in status 3: no action can be taken on UI.
  4: "Cancelled", // users(or admin) cancelled the sub(immediately or automatically at the end of billing cycle). It's triggered by human.
  5: "Expired", // sub ended.
*/
