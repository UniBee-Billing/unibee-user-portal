import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Tabs,
  Radio,
  message,
  Modal,
  Col,
  Row,
} from "antd";
import update from "immutability-helper";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import { useProfileStore } from "../stores";
// import { getActiveSub } from "../requests/getActiveSubscriptionList";
import { CURRENCY } from "../constants";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

interface IAddon extends IPlan {
  quantity: number | null;
  checked: boolean;
}

interface IPlan {
  id: number;
  planName: string; // plan name
  description: string;
  type: number; // 1: main plan, 2: add-on
  amount: number;
  currency: string;
  intervalUnit: string;
  intervalCount: number;
  status: number;
  // isPublished: boolean;
  addons?: IAddon[];
}

interface ISubAddon {
  Quantity: number;
  AddonPlanId: number;
}
interface ISubscription {
  subscriptionId: number;
  planId: number;
  amount: number;
  currency: string;
  // id: number;
  merchantId: number;
  quantity: number;
  status: number;
  addons: ISubAddon[];
}

const Index = () => {
  const profileStore = useProfileStore();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null); // null: not selected
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState<unknown | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [activeSub, setActiveSub] = useState<ISubscription | null>(null); // null: when page is loading, no data is ready yet.

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

  useEffect(() => {
    const fetchData = async () => {
      const subListRes = await axios.post(
        `${API_URL}/user/subscription/subscription_list`,
        {
          merchantId: 15621,
          userId: profileStore.id,
          status: 2, // active subscription
          page: 0,
          count: 100,
        },
        {
          headers: {
            Authorization: `${profileStore.token}`, // Bearer: ******
          },
        }
      );

      console.log("subList res: ", subListRes.data);
      const statuCode = subListRes.data.code;
      if (statuCode != 0) {
        if (statuCode == 61) {
          console.log("invalid token");
          navigate(`${APP_PATH}login`, {
            state: { msg: "session expired, please re-login" },
          });
          return;
        }
        throw new Error(subListRes.data.message);
      }
      const sub = subListRes.data.data.Subscriptions.find(
        (s) => s.Subscription.id == 38
      );
      console.log("active sub choosen: ", sub);
      const localActiveSub: ISubscription = {
        subscriptionId: sub.Subscription.subscriptionId,
        planId: sub.Subscription.planId,
        amount: sub.Subscription.amount,
        currency: sub.Subscription.currency,
        merchantId: sub.Subscription.merchantId,
        quantity: sub.Subscription.quantity,
        status: sub.Subscription.status,
        addons: sub.AddonParams,
      };
      setActiveSub(localActiveSub);
      setSelectedPlan(sub.Subscription.planId);

      // ********************* //

      const planListRes = await axios.post(
        `${API_URL}/user/plan/subscription_plan_list`,
        {
          merchantId: 15621,
          page: 0,
          count: 100,
        },
        {
          headers: {
            Authorization: `${profileStore.token}`, // Bearer: ******
          },
        }
      );
      console.log("planList res: ", planListRes.data);
      const statuCode2 = planListRes.data.code;
      if (statuCode2 != 0) {
        if (statuCode2 == 61) {
          console.log("invalid token");
          navigate(`${APP_PATH}login`, {
            state: { msg: "session expired, please re-login" },
          });
          return;
        }
        throw new Error(planListRes.data.message);
      }
      let plans: IPlan[] = planListRes.data.data.Plans.map((p: any) => {
        const p2 = p.plan;
        if (p.plan.type == 2) {
          return null;
        }
        if (p.plan.id != 31 && p.plan.id != 37 && p.plan.id != 32) {
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
      const planIdx = plans.findIndex((p) => p.id == localActiveSub.planId);
      if (planIdx != -1) {
        plans[planIdx].addons?.forEach((addon, i) => {
          const addonIdx = localActiveSub.addons.findIndex(
            (subAddon) => subAddon.AddonPlanId == addon.id
          );
          if (addonIdx != -1) {
            plans[planIdx].addons[i].checked = true;
            plans[planIdx].addons[i].quantity =
              localActiveSub.addons[addonIdx].Quantity;
          }
        });
      }
      setPlans(plans);
    };
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
      messageApi.open({
        type: "error",
        content: "Addon quantity must be greater than 0.",
      });
      return;
    }
    toggleModal();
    createPrivew();
  };

  const createPrivew = () => {
    setPreview(null); // clear the last preview, otherwise, users might see the old value
    const plan = plans.find((p) => p.id == selectedPlan);
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];

    axios
      .post(
        `${API_URL}/user/subscription/subscription_create_preview`,
        {
          // merchantId: 15621,
          planId: selectedPlan,
          quantity: 1,
          channelId: 25,
          UserId: profileStore.id,
          addonParams:
            addons.map((a) => ({ quantity: a.quantity, addonPlanId: a.id })) ||
            [],
        },
        {
          headers: {
            Authorization: `${profileStore.token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("subscription create preview res: ", res);
        const statuCode = res.data.code;
        if (statuCode != 0) {
          if (statuCode == 61) {
            console.log("invalid token");
            navigate(`${APP_PATH}login`, {
              state: { msg: "session expired, please re-login" },
            });
            return;
          }
          throw new Error(res.data.message);
        }
        setPreview(res.data.data);
      })
      .catch((err) => {
        console.log("subscription create preview err: ", err);
        messageApi.open({
          type: "error",
          content: err.message,
        });
      });
  };

  const onConfirm = () => {
    axios
      .post(
        `${API_URL}/user/subscription/subscription_create_submit`,
        {
          planId: selectedPlan,
          quantity: 1,
          channelId: 25,
          UserId: profileStore.id,
          addonParams: preview.addonParams,
          confirmTotalAmount: preview.totalAmount,
          confirmCurrency: preview.currency,
          returnUrl: `${window.location.origin}/payment-result`, // .origin doesn't work on IE
        },
        {
          headers: {
            Authorization: `${profileStore.token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("subscription create submit res: ", res);
        const statuCode = res.data.code;
        if (statuCode != 0) {
          if (statuCode == 61) {
            console.log("invalid token");
            navigate(`${APP_PATH}login`, {
              state: { msg: "session expired, please re-login" },
            });
            return;
          }
          throw new Error(res.data.message);
        }
        navigate(`${APP_PATH}profile/subscription`);
        window.open(res.data.data.link, "_blank");
      })
      .catch((err) => {
        console.log("subscription create submit err: ", err);
        messageApi.open({
          type: "error",
          content: err.message,
        });
      });
  };

  return (
    <>
      {contextHolder}
      {selectedPlan != null && (
        <Modal
          title="Subscription Preview"
          open={modalOpen}
          onOk={onConfirm}
          onCancel={toggleModal}
          width={"640px"}
        >
          {preview != null && (
            <>
              <Row gutter={[16, 16]}>
                <Col span={8}>Plan name</Col>
                <Col span={12}>{preview.planId.planName}</Col>{" "}
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={8}>Plan description</Col>
                <Col span={12}>{preview.planId.channelProductDescription}</Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={8}>Plan amount</Col>
                <Col span={12}>{preview.planId.amount}</Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={8}>Plan description</Col>
                <Col span={12}>{`${CURRENCY[preview.planId.currency].symbol} ${
                  preview.planId.amount
                }/${preview.planId.intervalCount}${
                  preview.planId.intervalUnit
                }`}</Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={8}>Addons</Col>
                <Col span={12}>
                  {preview.addons &&
                    preview.addons.map((a) => (
                      <div>
                        <span>{a.AddonPlan.planName}</span>:&nbsp;
                        <span>
                          {`${CURRENCY[a.AddonPlan.currency].symbol} ${
                            a.AddonPlan.amount
                          }/${a.AddonPlan.intervalCount}${
                            a.AddonPlan.intervalUnit
                          } × ${a.Quantity}`}
                        </span>
                      </div>
                    ))}
                </Col>
              </Row>
              <Row gutter={[32, 32]}>
                <Col span={8}>
                  <span>Total</span>
                </Col>
                <Col span={12}>
                  <span>{`${CURRENCY[preview.currency].symbol} ${
                    preview.totalAmount
                  }`}</span>
                </Col>
              </Row>
            </>
          )}
        </Modal>
      )}
      <div style={{ display: "flex", gap: "18px" }}>
        {plans.map((p) => (
          <Plan
            key={p.id}
            plan={p}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            onAddonChange={onAddonChange}
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
              onClick={openModal}
              disabled={selectedPlan == null}
            >
              Confirm
            </Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button>Terminate Subscription</Button>
          </>
        )}
      </div>
    </>
  );
};

export default Index;

interface IPLanProps {
  plan: IPlan;
  selectedPlan: number | null;
  setSelectedPlan: (p: number) => void;
  onAddonChange: (
    addonId: number,
    quantity: number | null,
    checked: boolean | null
  ) => void;
}

const Plan = ({
  plan,
  selectedPlan,
  setSelectedPlan,
  onAddonChange,
}: IPLanProps) => {
  const [totalAmount, setTotalAmount] = useState(0);
  const addonCheck = (addonId: number) => (e: CheckboxChangeEvent) => {
    onAddonChange(addonId, null, e.target.checked);
  };
  const addonQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddonChange(Number(e.target.id), Number(e.target.value), null);
  };

  useEffect(() => {
    let amount = plan.amount;
    if (plan.addons != null && plan.addons.length > 0) {
      plan.addons.forEach((a) => {
        if (a.checked && Number.isInteger(Number(a.quantity))) {
          amount += Number(a.amount) * Number(a.quantity);
        }
      });
      if (!isNaN(amount)) {
        setTotalAmount(amount);
      }
    }
  }, [plan]);

  return (
    <div
      onClick={() => setSelectedPlan(plan.id)}
      style={{
        width: "240px",
        height: "320px",
        padding: "8px",
        border: "1px solid #EEE",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "24px",
        background: selectedPlan == plan.id ? "#FFF" : "#FBFBFB",
        boxShadow:
          selectedPlan == plan.id
            ? "rgba(0, 0, 0, 0.35) 0px 5px 15px"
            : "unset",
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: "28px" }}>{plan.planName}</div>
      <div>{plan.description}</div>

      {plan.addons && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {plan.addons.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Checkbox onChange={addonCheck(a.id)} checked={a.checked}>
                <div style={{ display: "flex" }}>
                  <div>
                    <div
                      style={{
                        width: "120px",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.planName}
                    </div>
                    <div style={{ fontSize: "11px" }}>{`${
                      CURRENCY[a.currency].symbol
                    } ${a.amount}/${a.intervalCount}${a.intervalUnit}`}</div>
                  </div>

                  <Input
                    id={a.id.toString()}
                    value={a.quantity || 0}
                    onChange={addonQuantityChange}
                    disabled={!a.checked}
                    size="small"
                    style={{ width: "64px", height: "24px" }}
                    placeholder="count"
                  />
                </div>
              </Checkbox>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: "14px" }}>{`${CURRENCY[plan.currency].symbol} ${
        plan.amount
      }/${plan.intervalCount}${plan.intervalUnit}`}</div>
      <div style={{ fontSize: "24px" }}>
        Total:{" "}
        {`${CURRENCY[plan.currency].symbol} ${totalAmount}/${
          plan.intervalCount
        }${plan.intervalUnit}`}
      </div>
    </div>
  );
};
