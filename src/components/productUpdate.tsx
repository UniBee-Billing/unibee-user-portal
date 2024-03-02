import { Button, Empty, Modal, Spin, message } from 'antd';
import update from 'immutability-helper';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getActiveSub,
  getCountryList,
  getPlanList,
  terminateSub,
} from '../requests';
import Plan from './plan';
// import { CURRENCY } from "../constants";
// import { showAmount } from "../helpers";
import { LoadingOutlined } from '@ant-design/icons';
import { SUBSCRIPTION_STATUS } from '../constants';
import { Country, IPlan, ISubscription } from '../shared.types';
import { useAppConfigStore, useProfileStore } from '../stores';
import BillingAddressModal from './modals/billingAddressModal';
import CancelSubModal from './modals/modalCancelPendingSub';
import CreateSubModal from './modals/modalCreateSub';
import UpdatePlanModal from './modals/modalUpdateSub';

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const profileStore = useProfileStore();
  // const appConfigStore = useAppConfigStore();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<IPlan[]>([]);
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

  // new user has choosen a sub plan, but haven't paid yet, before the payment due day, they can still cancel it
  // this modal is for this purpose only.
  // It's not the same as 'terminate an active sub'.
  const [cancelSubModalOpen, setCancelSubModalOpen] = useState(false);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: 'session expired, please re-login' },
    });

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
    let countryListRes;
    try {
      countryListRes = await getCountryList();
      console.log('country list res: ', countryListRes);
      if (countryListRes.data.code != 0) {
        throw new Error(countryListRes.data.message);
      }
      setCountryList(
        countryListRes.data.data.vatCountryList.map((c: any) => ({
          code: c.countryCode,
          name: c.countryName,
        })),
      );
    } catch (err) {
      if (err instanceof Error) {
        console.log('err getting country list: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
      return;
    }
  };

  const fetchData = async () => {
    let subListRes, planListRes;
    setLoading(true);
    try {
      const res = ([subListRes, planListRes] = await Promise.all([
        getActiveSub(),
        getPlanList(),
      ]));
      res.forEach((r) => {
        const code = r.data.code;
        code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
        if (code != 0) {
          throw new Error(r.data.message);
        }
      });
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
      return;
    }

    setLoading(false);
    console.log('subList/planList: ', subListRes, '//', planListRes);

    let sub;
    if (
      subListRes.data.data.subscriptions != null &&
      subListRes.data.data.subscriptions[0] != null
    ) {
      // there is only one active sub at most or null.
      // null: new user(no purchase record), non-null: user has bought one plan, and want to change/upgrade/downgrade
      sub = subListRes.data.data.subscriptions[0];
      isNewUserRef.current = false;
      // TODO: backup current user's selectedPlan and addons info
    } else {
      // user has an active sub, but not paid, after cancel, active sub becomes null, I need to set its state to null
      // otherwise, page still use the obsolete sub info.
      setActiveSub(null);
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

    let plans: IPlan[] =
      planListRes.data.data.plans == null
        ? []
        : planListRes.data.data.plans.map((p: any) => {
            const p2 = p.plan;
            if (p.plan.type == 2) {
              // addon plan
              return null;
            }
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
            };
          });
    plans = plans.filter((p) => p != null);

    if (localActiveSub != null) {
      const planIdx = plans.findIndex((p) => p.id == localActiveSub!.planId);
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
    setPlans(plans);
  };

  useEffect(() => {
    fetchData();
    fetchCountry();
  }, []);

  const onPlanConfirm = () => {
    console.log('is new: ', isNewUserRef.current);
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

  /*
  const onTerminateSub = async () => {
    let terminateRes;
    try {
      terminateRes = await terminateSub(activeSub?.subscriptionId as string);
      console.log('update subscription submit res: ', terminateRes);
      const code = terminateRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(terminateRes.data.message);
      }
      message.success('Subscription will terminate on next billing cycle');
    } catch (err) {
      setTerminateModal(false);
      if (err instanceof Error) {
        console.log('err creating preview: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
      return;
    }
    navigate(`${APP_PATH}profile/subscription`, {
      // receiving route hasn't read this msg yet.
      state: { msg: 'Subscription ended on next billing cycle.' },
    });
  };
  */

  // allow user to click the confirm button
  // when no active sub || current sub status == expired,

  // allow user to click the terminate button
  // const

  return (
    <div>
      <SubStatus sub={activeSub} toggleModal={toggleCancelSubModal} />
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
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
      {/* activeSub && (
        <Modal
          title="Terminate Subscription"
          open={terminateModal}
          onOk={onTerminateSub}
          onCancel={() => setTerminateModal(false)}
        >
          <div>subscription detail here</div>
          <div>
            Your subscription will terminate at the end of this billing cycle
            <span style={{ color: "red" }}>
              (
              {new Date(activeSub.currentPeriodEnd * 1000).toLocaleDateString()}
              )
            </span>
            , are you sure you want to terminate?
          </div>
        </Modal>
              )*/}
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
        this feature has been moved to profile/subscription page.
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
  1: "Created", // when sub is created, but user hasn't paid yet, 
  2: "Active", // user paid the sub fee
  // 3: "Suspended", // suspend: not used yet. For future implementation: users might want to suspend the sub for a period of time, during which, they don't need to pay
  3: "Pending", // when status is transitioning from 1 to 2, or 2 to 4, there is a pending status, transition is not synchronous, 
  // coz payment is not synchronous, so we have to wait, in status 3: no action can be taken on UI.
  4: "Cancelled", // users(or admin) cancelled the sub(immediately or automatically at the end of billing cycle). It's triggered by human.
  5: "Expired", // sub ended.
*/
