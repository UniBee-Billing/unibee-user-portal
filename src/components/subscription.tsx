import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, Form, Input, Tabs, Radio, message } from "antd";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

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
  addons?: PlanType[];
}

const Index = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null); // null: not selected

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .post(
        `${API_URL}/user/plan/subscription_plan_list`,
        {
          merchantId: 15621,
          // type: 1,
          // status: 0,
          // currency: "usd",
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
        console.log("subscription list res: ", res);
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
          console.log("plan id: ", p.plan.id);
          let p2 = p.plan;
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
        setPlans(plans);
      })
      .catch((err) => {
        console.log("get subscription list err: ", err);
        // setErrMsg(err.message);
      });
  }, []);

  const onConfirm = () => {
    console.log("confirm sub");
  };

  console.log("plans: ", plans);
  return (
    <div style={{ display: "flex", gap: "18px" }}>
      {plans.map(
        (p) =>
          p && (
            <Plan
              plan={p}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
            />
          )
      )}
      <Button type="primary" onClick={onConfirm}>
        Confirm
      </Button>
    </div>
  );
};

export default Index;

const CURRENCY_SYMBOL: { [key: string]: string } = {
  CNY: "¥",
  USD: "$",
  JPY: "¥",
};

interface IPLanProps {
  plan: PlanType;
  selectedPlan: number | null;
  setSelectedPlan: (p: number) => void;
}
const Plan = ({ plan, selectedPlan, setSelectedPlan }: IPLanProps) => {
  return (
    <div
      style={{
        width: "180px",
        height: "320px",
        border: "1px solid #EEE",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "32px",
        background: "#FBFBFB",
        boxShadow:
          selectedPlan == plan.id
            ? "rgba(0, 0, 0, 0.35) 0px 5px 15px"
            : "unset",
      }}
    >
      <div style={{ fontSize: "28px" }}>{plan.planName}</div>
      <div>{plan.description}</div>

      {plan.addons && (
        <div>
          {plan.addons.map((a) => (
            <div>{a.planName}</div>
          ))}
        </div>
      )}
      <div style={{ fontSize: "24px" }}>{`${CURRENCY_SYMBOL[plan.currency]} ${
        plan.amount
      }/${plan.intervalCount}${plan.intervalUnit}`}</div>
      <div>
        <Button type="primary" onClick={() => setSelectedPlan(plan.id)}>
          Choose
        </Button>
      </div>
    </div>
  );
};
