import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  message,
  Spin,
  Modal,
  Col,
  Row,
  Input,
  Divider,
  Select,
} from "antd";
import update from "immutability-helper";
import Plan from "./plan";
import {
  getPlanList,
  createPreviewReq,
  createSubscription,
  getCountryList,
} from "../requests";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import { useProfileStore } from "../stores";
import { showAmount } from "../helpers";
import { ISubscription, IPlan, IPreview, Country } from "../shared.types";
import { LoadingOutlined } from "@ant-design/icons";
import BillingAddressModal from "./billingAddressModal";

const APP_PATH = import.meta.env.BASE_URL;

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
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [billingAddressModalOpen, setBillingAddressModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<IPreview | null>(null);
  const countryRef = useRef<CountryCode[]>([]);
  const [vatNumber, setVatNumber] = useState("");

  const onVatChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setVatNumber(e.target.value);
  //    console.log("vat change: ", e);

  const onCountryChange = (value) => setSelectedCountry(value);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const toggleBillingModal = () =>
    setBillingAddressModalOpen(!billingAddressModalOpen);

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

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
          message.error(err.message);
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

  useEffect(() => {
    const fetchCountry = async () => {
      let countryListRes;
      try {
        countryListRes = await getCountryList(15621); // merchantId
        console.log("country list res: ", countryListRes);
        if (countryListRes.data.code != 0) {
          throw new Error(countryListRes.data.message);
        }
        setCountryList(
          countryListRes.data.data.vatCountryList.map((c: any) => ({
            code: c.countryCode,
            name: c.countryName,
          }))
        );
      } catch (err) {
        if (err instanceof Error) {
          console.log("err getting country list: ", err.message);
          message.error(err.message);
        } else {
          message.error("Unknown error");
        }
        return;
      }
    };
    fetchCountry();
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
        vatNumber,
        selectedCountry
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
    setPreview(previewRes.data.data);
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
        message.error(err.message);
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
          width={"720px"}
        >
          {preview == null ? (
            <div>
              <Spin
                spinning={true}
                indicator={
                  <LoadingOutlined
                    style={{ fontSize: 32, color: "#FFF" }}
                    spin
                  />
                }
              />
            </div>
          ) : (
            <>
              <Row style={{ fontWeight: "bold", margin: "16px 0" }}>
                <Col span={8}>Description</Col>
                <Col span={4}>Quantity</Col>
                <Col span={4}>Amt(Exc Tax)</Col>
                <Col span={4}>Tax</Col>
                <Col span={4}>Amt</Col>
              </Row>
              {preview.invoice.lines.map((i, idx) => (
                <div key={idx}>
                  <Row>
                    <Col span={8}>{i.description}</Col>
                    <Col span={4}>{i.quantity}</Col>
                    <Col span={4}>
                      {showAmount(i.amountExcludingTax, i.currency)}
                    </Col>
                    <Col span={4}>{showAmount(i.tax, i.currency)}</Col>
                    <Col span={4}>{showAmount(i.amount, i.currency)}</Col>
                  </Row>
                  {idx != preview.invoice.lines.length - 1 && (
                    <Divider style={{ margin: "8px 0" }} />
                  )}
                </div>
              ))}
              <Divider />
              <Row>
                <Col span={8}>Vat number</Col>
                <Col span={4}>Country</Col>
              </Row>
              <Row style={{ marginBottom: "12px" }}>
                <Col span={8}>
                  <Input
                    value={vatNumber}
                    style={{ width: "160px" }}
                    onChange={onVatChange}
                    placeholder="Your VAT number"
                  />
                </Col>
                <Col span={4}>
                  <Select
                    value={selectedCountry}
                    style={{ width: "180px" }}
                    onChange={onCountryChange}
                    showSearch
                    placeholder="Type to search"
                    optionFilterProp="children"
                    filterOption={filterOption}
                    options={countryList.map((c) => ({
                      label: c.name,
                      value: c.code,
                    }))}
                  />
                </Col>
              </Row>
              <Row>
                <Col span={20}>
                  <span style={{ fontSize: "18px" }}>Total</span>
                </Col>
                <Col span={4}>
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
