import { Button, Col, Divider, Input, Modal, Row, Spin, message } from "antd";
import { showAmount } from "../helpers";
import { IPlan, IPreview, InvoiceItemTotal } from "../shared.types";
import { useEffect, useState } from "react";
import { createUpdatePreviewReq } from "../requests";
import { useNavigate } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";

const APP_PATH = import.meta.env.BASE_URL;

interface Props {
  plan: IPlan | undefined;
  subscriptionId: string | undefined;
  closeModal: () => void;
  // onConfirm: () => void;
  refresh: () => void; // after upgrade, refresh parent component
}

const Index = ({
  plan,
  subscriptionId,
  closeModal,
  refresh,
}: // onConfirm,
// refresh,
Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<IPreview | null>(null);
  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const onConfirm = async () => {
    setSubmitting(true);
    closeModal();
    // refresh()
  };

  useEffect(() => {
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const previewRes = await createUpdatePreviewReq(
          plan!.id,
          addons.map((a) => ({
            quantity: a.quantity as number,
            addonPlanId: a.id,
          })),
          subscriptionId as string
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
      } // finally {      } // doesn't work.
    };
    fetchPreview();
  }, []);
  return (
    <Modal
      title="Subscription Update Preview"
      maskClosable={false}
      open={true}
      // onOk={onConfirm}
      // onCancel={toggleModal}
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
          <InvoiceLines label="Current Invoices" invoice={preview.invoice} />
          <InvoiceLines
            label="Next Billing Cycle Invoices"
            invoice={preview.nextPeriodInvoice}
          />
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
          onClick={onConfirm}
          loading={submitting}
          disabled={loading || submitting}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};

export default Index;

const InvoiceLines = ({
  invoice,
  label,
}: {
  invoice: InvoiceItemTotal | undefined;
  label: string;
}) => (
  <>
    <Divider orientation="left" style={{ margin: "32px 0", color: "#757575" }}>
      {label}
    </Divider>

    {invoice == null || invoice.lines.length == 0 ? (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          fontSize: "16px",
          color: "#757575",
        }}
      >
        No Items
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
        {invoice.lines.map((i, idx) => (
          <div key={idx}>
            <Row>
              <Col span={8}>{i.description}</Col>
              <Col span={4}>{i.quantity}</Col>
              <Col span={4}>{showAmount(i.amountExcludingTax, i.currency)}</Col>
              <Col span={4}>{showAmount(i.tax, i.currency)}</Col>
              <Col span={4}>{showAmount(i.amount, i.currency)}</Col>
            </Row>
            {idx != invoice.lines.length - 1 && (
              <Divider style={{ margin: "8px 0" }} />
            )}
          </div>
        ))}

        <Row>
          <Col span={20}>
            <span style={{ fontSize: "18px" }}>Total</span>
          </Col>
          <Col span={4}>
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>
              {" "}
              {`${showAmount(invoice.totalAmount, invoice.currency)}`}
            </span>
          </Col>
        </Row>
      </>
    )}
  </>
);
