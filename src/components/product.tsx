import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, message, Spin, Modal, Col, Row, Input, Divider } from "antd";
import update from "immutability-helper";
import Plan from "./plan";
import { getPlanList, createPreviewReq, createSubscription } from "../requests";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import { useProfileStore } from "../stores";
import { showAmount } from "../helpers";
import { ISubscription, IPlan, IPreview } from "../shared.types";
import { LoadingOutlined } from "@ant-design/icons";
import BillingAddressModal from "./billingAddressModal";

const APP_PATH = import.meta.env.BASE_URL;

/*
interface IAddon extends IPlan {
  quantity: number | null;
  checked: boolean;
}
*/

/*
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
  id: number; // not used, but keep it here
  subscriptionId: string;
  planId: number;
  amount: number;
  currency: string;
  merchantId: number;
  quantity: number;
  status: number;
  addons: ISubAddon[];
}

interface IPreview {
  totalAmount: number;
  prorationDate: number;
  currency: string;
  invoices: {
    amount: number;
    currency: string;
    description: string;
    probation: boolean;
  }[];
}
*/

type CountryCode = {
  countryCode: string;
  countryName: string;
  vatSupport: boolean;
  standardTaxPercentage: number;
};

const Index = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null); // null: not selected
  const [modalOpen, setModalOpen] = useState(false);
  const [billingAddressModalOpen, setBillingAddressModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<IPreview | null>(null);
  const countryRef = useRef<CountryCode[]>([]);
  const [vatNumber, setVatNumber] = useState("");

  const onVatChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setVatNumber(e.target.value);
  //    console.log("vat change: ", e);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const toggleBillingModal = () =>
    setBillingAddressModalOpen(!billingAddressModalOpen);

  const toastErr = (msg: string) => message.error(msg);

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
      let planListRes;
      try {
        setLoading(true);
        planListRes = await getPlanList();
        setLoading(false);
        console.log("planList res...: ", planListRes.data);
        const code = planListRes.data.code;
        code == 61 && relogin();
        if (code != 0) {
          throw new Error(planListRes.data.message);
        }
      } catch (err) {
        setLoading(false);
        if (err instanceof Error) {
          console.log("err: ", err.message);
          toastErr(err.message);
        } else {
          message.error("Unknown error");
        }
        return;
      }

      let plans: IPlan[] = planListRes.data.data.Plans.map((p: any) => {
        const p2 = p.plan;
        if (p.plan.type == 2) {
          return null;
        }
        /*
        if (
          p.plan.id != 31 &&
          p.plan.id != 37 &&
          p.plan.id != 38 &&
          p.plan.id != 32 &&
          p.plan.id != 41
        ) {
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
        };
      });
      plans = plans.filter((p) => p != null);
      setPlans(plans);
    };
    fetchData();
  }, []);

  const toggleModal = () => setModalOpen(!modalOpen); // this is the preview modal
  const openModal = () => {
    const profile = useProfileStore.getState();
    console.log("user profile: ", profile.countryCode, "//", profile);
    if (profile.countryCode == "") {
      toggleBillingModal();
      return;
    }

    const plan = plans.find((p) => p.id == selectedPlan);
    let valid = true,
      content = "";
    if (plan?.addons != null && plan.addons.length > 0) {
      for (let i = 0; i < plan.addons.length; i++) {
        if (plan.addons[i].checked) {
          const q = Number(plan.addons[i].quantity);
          console.log("q: ", q);
          if (!Number.isInteger(q) || q <= 0) {
            valid = false;
            content = "Addon quantity must be greater than 0.";
            break;
          }
        }
      }
      /*
      if (vatNumber.trim() == "") {
        valid = false;
        content = "Please input the VAT number";
      }
      */
    }

    if (!valid) {
      message.error(content);
      return;
    }
    toggleModal();
    createPrivew();
  };

  const createPrivew = async () => {
    setPreview(null); // clear the last preview, otherwise, users might see the old value
    const plan = plans.find((p) => p.id == selectedPlan);
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];

    let previewRes;
    /*
    export const createPreviewReq = async (
  isNew: boolean,
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  subscriptionId: string | null
    */
    try {
      previewRes = await createPreviewReq(
        selectedPlan as number,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        })),
        vatNumber
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
        toastErr(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }

    /**
     * 
interface IPreview {
  totalAmount: number;
  prorationDate: number;
  currency: string;
  vatCountryCode: string;
  vatCountryName: string;
  vatNumber: string;
  vatNumberValidate?: {
    valid: boolean;
    vatNumber: string;
    countryCode: string;
    companyName: string;
    companyAddress: string;
    validateMessage: string;
  };
  invoices: {
    amount: number;
    amountExcludingTax: number;
    currency: string;
    description: string;
    probation: boolean;
    tax: number;
    unitAmountExcludingTax: number;
  }[];
}
     */

    const p: IPreview = {
      totalAmount: previewRes.data.data.totalAmount,
      currency: previewRes.data.data.currency,
      prorationDate: previewRes.data.data.prorationDate,
      vatCountryCode: previewRes.data.data.vatCountryCode,
      vatCountryName: previewRes.data.data.vatCountryName,
      vatNumber: previewRes.data.data.vatNumber,
      invoices: previewRes.data.data.invoice.lines,
      vatNumberValidate: previewRes.data.data.vatNumberValidate,
    };
    console.log("normalized preview: ", p);
    setPreview(p);
  };

  const onConfirm = async () => {
    const plan = plans.find((p) => p.id == selectedPlan);
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    let createSubRes;
    try {
      createSubRes = await createSubscription(
        selectedPlan as number,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        })),
        preview?.totalAmount as number,
        preview?.currency as string
      );
      console.log("create subscription res: ", createSubRes);
      const code = createSubRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(createSubRes.data.message);
      }
    } catch (err) {
      setModalOpen(false);
      if (err instanceof Error) {
        console.log("err creating subscripion: ", err.message);
        toastErr(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }
    navigate(`${APP_PATH}profile/subscription`);
    window.open(createSubRes.data.data.link, "_blank");
  };

  return (
    <>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: "#FFF" }} spin />
        }
        fullscreen
      />
      <BillingAddressModal
        isOpen={billingAddressModalOpen}
        closeModal={toggleBillingModal}
        openPreviewModal={toggleModal}
      />
      {selectedPlan != null && (
        <Modal
          title="Subscription Creation Preview"
          maskClosable={false}
          open={modalOpen}
          onOk={onConfirm}
          onCancel={toggleModal}
          width={"640px"}
        >
          {preview && (
            <>
              {preview.invoices.map((i, idx) => (
                <div key={idx}>
                  <Row gutter={[16, 16]}>
                    <Col span={18}>{"Amount excluding tax"}</Col>
                    <Col span={6}>{`${showAmount(
                      i.amountExcludingTax,
                      i.currency
                    )}`}</Col>
                  </Row>
                  <Row key={idx} gutter={[16, 16]}>
                    <Col span={18}>{"Tax"}</Col>
                    <Col span={6}>{`${showAmount(i.tax, i.currency)}`}</Col>
                  </Row>
                  <Row key={idx} gutter={[16, 16]}>
                    <Col span={18}>{i.description}</Col>
                    <Col span={6}>{`${showAmount(i.amount, i.currency)}`}</Col>
                  </Row>
                  {idx != preview.invoices.length - 1 && (
                    <Divider style={{ margin: "8px 0" }} />
                  )}
                </div>
              ))}
              <Divider />
              <Row gutter={[16, 16]}>
                <Col span={18}>
                  <span style={{ fontSize: "18px" }}>Total</span>
                </Col>
                <Col span={6}>
                  <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                    {" "}
                    {`${showAmount(preview.totalAmount, preview.currency)}`}
                  </span>
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
            isActive={false}
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
        {countryRef.current &&
          countryRef.current[0] &&
          countryRef.current[0].countryName}
        {plans.length != 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginTop: "32px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#616161",
                  marginBottom: "4px",
                }}
              >
                Your VAT nubmer:
              </div>
              <Input
                value={vatNumber}
                onChange={onVatChange}
                placeholder="Your VAT number"
              />
            </div>

            <Button
              type="primary"
              onClick={openModal}
              disabled={selectedPlan == null}
            >
              Confirm
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default Index;
