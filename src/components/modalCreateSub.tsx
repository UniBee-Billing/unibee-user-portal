import {
  Button,
  Col,
  Divider,
  Input,
  Modal,
  Row,
  Select,
  Spin,
  message,
} from "antd";
import { showAmount } from "../helpers";
import { LoadingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { IPlan, IPreview, Country } from "../shared.types";
import {
  createPreviewReq,
  createSubscription,
  vatNumberCheckReq,
} from "../requests";

const APP_PATH = import.meta.env.BASE_URL;

type TVATDetail = {
  companyAddress: string;
  companyName: string;
  countryCode: string;
};

interface Props {
  plan: IPlan;
  countryList: Country[];
  userCountryCode: string;
  closeModal: () => void;
}

const Index = ({ plan, countryList, userCountryCode, closeModal }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<IPreview | null>(null);
  const [vatNumber, setVatNumber] = useState("");
  const [vatDetail, setVatDetail] = useState<null | TVATDetail>(null);
  const [isVatValid, setIsVatValid] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(userCountryCode);
  const vatChechkingRef = useRef(false);
  // const countryRef = useRef<CountryCode[]>([]);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const onVatChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setVatNumber(e.target.value);

  const onCountryChange = (value: string) => {
    setSelectedCountry(value);
  };
  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const createPreview = async () => {
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];

    try {
      setLoading(true);
      const previewRes = await createPreviewReq(
        plan.id,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        })),
        vatNumber,
        selectedCountry
      );
      setLoading(false);
      console.log("subscription create preview res: ", previewRes);
      const code = previewRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(previewRes.data.message);
      }
      setPreview(previewRes.data.data);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("err creating preview: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }
  };

  const onVATCheck = async (evt: React.FocusEvent<HTMLElement>) => {
    if (evt.relatedTarget?.classList.contains("confirm-btn-wrapper")) {
      vatChechkingRef.current = true;
    }

    try {
      setSubmitting(true);
      const res = await vatNumberCheckReq(vatNumber);
      console.log("vat check res: ", res);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      const v = res.data.data.vatNumberValidate;
      setIsVatValid(v.valid);
      if (v.valid) {
        await createPreview();
        setVatDetail({
          companyAddress: v.companyAddress,
          companyName: v.companyName,
          countryCode: v.countryCode,
        });
      } else {
        setVatDetail(null);
        message.error("Invalid VAT, please re-type or leave it blank.");
      }
      setSubmitting(false);
      vatChechkingRef.current = false;
    } catch (err) {
      setIsVatValid(false);
      setSubmitting(false);
      setVatDetail(null);
      vatChechkingRef.current = false;
      if (err instanceof Error) {
        console.log("err checking vat validity: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return false;
    }
  };

  const onConfirm = async () => {
    // console.log("in confirm btn, is vat checking? ", vatChechkingRef.current);
    if (vatChechkingRef.current) {
      return;
    }

    if (!isVatValid && vatNumber != "") {
      message.error("Invalid VAT, please re-type or leave it blank.");
      return;
    }

    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    let createSubRes;
    try {
      setSubmitting(true);
      createSubRes = await createSubscription(
        plan.id,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        })),
        preview?.totalAmount as number,
        preview?.currency as string,
        preview?.vatCountryCode as string,
        preview?.vatNumber as string
      );
      setSubmitting(false);
      console.log("create subscription res: ", createSubRes);
      const code = createSubRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(createSubRes.data.message);
      }
    } catch (err) {
      setSubmitting(false);
      if (err instanceof Error) {
        console.log("err creating subscripion: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }
    navigate(`${APP_PATH}profile/subscription`);
    if (
      createSubRes.data.data.link != "" ||
      createSubRes.data.data.link != null
    ) {
      window.open(createSubRes.data.data.link, "_blank");
    }
  };

  useEffect(() => {
    createPreview();
  }, []);

  useEffect(() => {
    createPreview();
  }, [selectedCountry]);

  return (
    <Modal
      title="Order Preview"
      maskClosable={false}
      open={true}
      footer={null}
      width={"720px"}
    >
      {preview == null ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin
            spinning={true}
            indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
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
            <Col span={5}>VAT number</Col>
            <Col span={6} style={{ marginLeft: "12px" }}>
              Country
            </Col>
          </Row>
          <Row style={{ marginBottom: "12px" }}>
            <Col span={5}>
              <Input
                value={vatNumber}
                style={{ width: "100%" }}
                onChange={onVatChange}
                onBlur={onVATCheck}
                placeholder="Your VAT number"
              />
            </Col>
            <Col span={6} style={{ marginLeft: "12px" }}>
              <Select
                value={selectedCountry}
                style={{ width: "160px" }}
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
          {isVatValid && (
            <>
              <Row style={{ fontWeight: "bold" }}>
                <Col span={6}>Company Address</Col>
                <Col span={6}>Company Name</Col>
                <Col span={6}>Country Code</Col>
              </Row>
              <Row style={{ marginBottom: "12px" }}>
                <Col span={6} style={{ fontSize: "11px" }}>
                  {vatDetail?.companyAddress}
                </Col>
                <Col span={6} style={{ fontSize: "11px" }}>
                  {vatDetail?.companyName}
                </Col>
                <Col span={6} style={{ fontSize: "11px" }}>
                  {vatDetail?.countryCode}
                </Col>
              </Row>
            </>
          )}
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
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          alignItems: "center",
          gap: "18px",
          marginTop: "24px",
        }}
      >
        <Button onClick={closeModal} disabled={loading || submitting}>
          Cancel
        </Button>
        <Button
          type="primary"
          className="confirm-btn-wrapper"
          onClick={onConfirm}
          loading={loading || submitting}
          disabled={loading || submitting}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};

export default Index;
