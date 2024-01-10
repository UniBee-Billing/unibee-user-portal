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

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

interface AddonType extends PlanType {
  quantity: number | null;
  checked: boolean;
}

interface PlanType {
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
  addons?: AddonType[];
}

const Index = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null); // null: not selected
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState<unknown | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const onAddonChange = (addonId: number, quantity: number) => {
    console.log("plans: ", plans);
    const planIdx = plans.findIndex((p) => p.id == selectedPlan);
    if (planIdx == -1) {
      return;
    }
    const addonIdx = plans[planIdx].addons!.findIndex((a) => a.id == addonId);
    if (addonIdx == -1) {
      return;
    }
    const newPlans = update(plans, {
      [planIdx]: { addons: { [addonIdx]: { quantity: { $set: quantity } } } },
    });
    setPlans(newPlans);
  };

  const onAddonCheck = (addonId: number, checked: boolean) => {
    console.log("addonId: ", addonId, "//", checked);
    const planIdx = plans.findIndex((p) => p.id == selectedPlan);
    if (planIdx == -1) {
      return;
    }
    const addonIdx = plans[planIdx].addons!.findIndex((a) => a.id == addonId);
    if (addonIdx == -1) {
      return;
    }
    console.log("idx: ", planIdx, "///", addonIdx);
    const newPlans = update(plans, {
      [planIdx]: { addons: { [addonIdx]: { checked: { $set: checked } } } },
    });
    setPlans(newPlans);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .post(
        `${API_URL}/user/plan/subscription_plan_list`,
        {
          merchantId: 15621,
          page: 0,
          count: 100,
        },
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("product list res: ", res);
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
        const plans: PlanType[] = res.data.data.Plans.map((p: any) => {
          // console.log("plan id: ", p.plan.id);
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
        setPlans(plans.filter((p) => p != null));
      })
      .catch((err) => {
        console.log("get product list err: ", err);
        messageApi.open({
          type: "error",
          content: err.message,
        });
      });
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
    const token = localStorage.getItem("token");
    const plan = plans.find((p) => p.id == selectedPlan);
    const addons = plan?.addons.filter((a) => a.checked);

    axios
      .post(
        `${API_URL}/user/subscription/subscription_create_preview`,
        {
          // merchantId: 15621,
          planId: selectedPlan,
          quantity: 1,
          channelId: 25,
          UserId: 2235428006,
          addonParams:
            addons?.map((a) => ({ quantity: a.quantity, addonPlanId: a.id })) ||
            [],
        },
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
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
    const token = localStorage.getItem("token");
    const UserId = Number(localStorage.getItem("userId"));
    axios
      .post(
        `${API_URL}/user/subscription/subscription_create_submit`,
        {
          planId: selectedPlan,
          quantity: 1,
          channelId: 25,
          UserId,
          addonParams: preview.addonParams,
          confirmTotalAmount: preview.totalAmount,
          confirmCurrency: preview.currency,
          returnUrl: "http://localhost:5173/payment-result",
        },
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
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
                <Col span={12}>{`${CURRENCY_SYMBOL[preview.planId.currency]} ${
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
                          {`${CURRENCY_SYMBOL[a.AddonPlan.currency]} ${
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
                  <span>{`${CURRENCY_SYMBOL[preview.currency]} ${
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
            onAddonCheck={onAddonCheck}
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
          <Button
            type="primary"
            onClick={openModal}
            disabled={selectedPlan == null}
          >
            Confirm
          </Button>
        )}
      </div>
    </>
  );
};

export default Index;

const CURRENCY_SYMBOL: { [key: string]: string } = {
  CNY: "¥", // normalize: 100,
  USD: "$",
  JPY: "¥",
};

interface IPLanProps {
  plan: PlanType;
  selectedPlan: number | null;
  setSelectedPlan: (p: number) => void;
  onAddonChange: (addonId: number, quantity: number) => void;
  onAddonCheck: (addonId: number, checked: boolean) => void;
}

const Plan = ({
  plan,
  selectedPlan,
  setSelectedPlan,
  onAddonChange,
  onAddonCheck,
}: IPLanProps) => {
  const addonCheck = (addonId: number) => (e: CheckboxChangeEvent) => {
    console.log("add checked: ", e.target.checked);
    onAddonCheck(addonId, e.target.checked);
  };
  const addonQuantityChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    console.log("quantity change: ", evt);
    onAddonChange(Number(evt.target.id), Number(evt.target.value)); // TODO: add validation check later
  };

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
        gap: "32px",
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
                      CURRENCY_SYMBOL[a.currency]
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
      <div style={{ fontSize: "24px" }}>{`${CURRENCY_SYMBOL[plan.currency]} ${
        plan.amount
      }/${plan.intervalCount}${plan.intervalUnit}`}</div>
      {/* <div>
        <Button type="primary" onClick={() => setSelectedPlan(plan.id)}>
          Choose
        </Button>
    </div> */}
    </div>
  );
};
