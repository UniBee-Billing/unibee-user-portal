import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, message, Modal, Col, Row, Spin } from "antd";
import update from "immutability-helper";
import {
  getActiveSub,
  getPlanList,
  createUpdatePreviewReq,
  updateSubscription,
  terminateSub,
} from "../requests";
import Plan from "./plan";
// import { CURRENCY } from "../constants";
import { showAmount } from "../helpers";
import { ISubscription, IPlan, IPreview } from "../shared.types";
import { LoadingOutlined } from "@ant-design/icons";
import UpdatePlanModal from "./modalUpdatePlan";

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  // const profileStore = useProfileStore();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null); // null: not selected
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [preview, setPreview] = useState<IPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminateModal, setTerminateModal] = useState(false);
  const [activeSub, setActiveSub] = useState<ISubscription | null>(null); // null: when page is loading, no data is ready yet.
  const isNewUserRef = useRef(true); // new user can only create sub, old user(already has a sub) can only upgrade/downgrade/change sub.
  // they have different api call, Modal window

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const toggleCreateModal = () => setCreateModalOpen(!createModalOpen); // Modal for first time plan choosing
  const toggleUpdateModal = () => setUpdateModalOpen(!updateModalOpen); // Modal for update plan

  const onAddonChange = (
    addonId: number,
    quantity: number | null, // null means: don't update this field, keep its original value
    checked: boolean | null // ditto
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

  const fetchData = async () => {
    let subListRes, planListRes;
    try {
      const res = ([subListRes, planListRes] = await Promise.all([
        getActiveSub(),
        getPlanList(),
      ]));
      res.forEach((r) => {
        const code = r.data.code;
        code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
        if (code != 0) {
          // TODO: save all the code as ENUM in constant,
          throw new Error(r.data.message);
        }
      });
    } catch (err) {
      if (err instanceof Error) {
        console.log("err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }

    console.log("subList/planList: ", subListRes, "//", planListRes);

    // TODO: handle the case when user don't have any subscription yet.
    // to make one page handle update/create subscription, the activeSub can be null
    // const sub = subListRes.data.data.Subscriptions[0];
    /*
    const sub = subListRes.data.data.Subscriptions.find(
      (s: any) => s.subscription.id == 38
    );
    */

    let sub;
    if (
      subListRes.data.data.Subscriptions != null &&
      subListRes.data.data.Subscriptions[0] != null
    ) {
      // there is only one active sub at most or null.
      // null: new user(no purchase record), non-null: user has bought one plan, and want to change/upgrade/downgrade
      sub = subListRes.data.data.Subscriptions[0];
      isNewUserRef.current = false;
      console.log("active sub found: ", sub);
    }

    // addons and other props are separated in different area in the response subscription obj, I want to combine them into one subscription obj
    let localActiveSub: ISubscription | null = null;
    if (sub != null) {
      localActiveSub = { ...sub.subscription };
      (localActiveSub as ISubscription).addons = sub.addonParams;
      console.log("local sub: finally: ", localActiveSub);
      setActiveSub(localActiveSub);
      setSelectedPlan(sub.subscription.planId);
    }

    let plans: IPlan[] = planListRes.data.data.Plans.map((p: any) => {
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
            (subAddon) => subAddon.addonPlanId == plans[planIdx].addons![i].id
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
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleModal = () => setModalOpen(!modalOpen);
  const openModal = () => {
    const plan = plans.find((p) => p.id == selectedPlan);
    let valid = true;
    if (plan?.addons != null && plan.addons.length > 0) {
      for (let i = 0; i < plan.addons.length; i++) {
        if (plan.addons[i].checked) {
          const q = Number(plan.addons[i].quantity);
          console.log("q: ", q);
          if (!Number.isInteger(q) || q <= 0) {
            valid = false;
            break;
          }
        }
      }
    }
    if (!valid) {
      message.error("Addon quantity must be greater than 0.");
      return;
    }
    toggleModal();
    createPreview();
  };

  const createPreview = async () => {
    setPreview(null); // clear the last preview, otherwise, users might see the old value before the new value return
    const plan = plans.find((p) => p.id == selectedPlan);
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    // console.log("active sub: ", activeSub?.subscriptionId, "///", activeSub);
    let previewRes;
    try {
      previewRes = await createUpdatePreviewReq(
        selectedPlan as number,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        })),
        activeSub?.subscriptionId as string
      );
      console.log("subscription create preview res: ", previewRes);
      const code = previewRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(previewRes.data.message);
      }
    } catch (err) {
      setModalOpen(false);
      if (err instanceof Error) {
        console.log("err creating preview: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }

    /*
    const p: IPreview = {
      totalAmount: previewRes.data.data.totalAmount,
      currency: previewRes.data.data.currency,
      prorationDate: previewRes.data.data.prorationDate,
      invoices: previewRes.data.data.invoice.lines,
      // vatCountryCode: ,
      // vatCountryName: "",
      // vatNumber: ""
    };
    */
    setPreview(previewRes.data.data);
  };

  const onConfirm = async () => {
    const plan = plans.find((p) => p.id == selectedPlan);
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    let updateSubRes;
    try {
      updateSubRes = await updateSubscription(
        selectedPlan as number,
        activeSub?.subscriptionId as string,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        })),
        preview?.totalAmount as number,
        preview?.currency as string,
        preview?.prorationDate as number
      );
      console.log("update subscription submit res: ", updateSubRes);
      const code = updateSubRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(updateSubRes.data.message);
      }
    } catch (err) {
      setModalOpen(false);
      if (err instanceof Error) {
        console.log("err creating preview: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }

    if (updateSubRes.data.data.paid) {
      navigate(`${APP_PATH}profile/subscription`, {
        // receiving route hasn't read this msg yet.
        state: { msg: "Subscription updated" },
      });
      return;
    }
    toggleModal();
    window.open(updateSubRes.data.data.link, "_blank");
  };

  const onTerminateSub = async () => {
    let terminateRes;
    try {
      terminateRes = await terminateSub(activeSub?.subscriptionId as string);
      console.log("update subscription submit res: ", terminateRes);
      const code = terminateRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(terminateRes.data.message);
      }
    } catch (err) {
      setTerminateModal(false);
      if (err instanceof Error) {
        console.log("err creating preview: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }
    navigate(`${APP_PATH}profile/subscription`, {
      // receiving route hasn't read this msg yet.
      state: { msg: "Subscription ended on next billing cycle." },
    });
  };

  return (
    <>
      {/* <Spin spinning={loading} fullscreen /> */}
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: "#FFF" }} spin />
        }
        fullscreen
      />

      <Modal
        title="Terminate Subscription"
        open={terminateModal}
        onOk={onTerminateSub}
        onCancel={() => setTerminateModal(false)}
      >
        <div>subscription detail here</div>
      </Modal>
      {updateModalOpen && !isNewUserRef.current && (
        <UpdatePlanModal
          plan={plans.find((p) => p.id == selectedPlan) as IPlan}
          subscriptionId={activeSub!.subscriptionId}
          closeModal={toggleUpdateModal}
          refresh={fetchData}
        />
      )}
      {/*
      // first time purchase, 
        updateModalOpen && !isNewUserRef.current && (
          <UpdatePlanModal
            plan={plans.find((p) => p.id == selectedPlan)}
            subscriptionId={activeSub?.subscriptionId}
            onCancel={toggleUpdatModal}
          />
        )
        */}

      <div style={{ display: "flex", gap: "18px" }}>
        {plans.map((p) => (
          <Plan
            key={p.id}
            plan={p}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            onAddonChange={onAddonChange}
            isActive={p.id == activeSub?.planId}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "68px",
        }}
      >
        {plans.length != 0 && (
          <>
            <Button
              type="primary"
              onClick={isNewUserRef.current ? openModal : toggleUpdateModal}
              disabled={selectedPlan == null}
            >
              Confirm
            </Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button type="primary" onClick={() => setTerminateModal(true)}>
              Terminate Subscription
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default Index;
