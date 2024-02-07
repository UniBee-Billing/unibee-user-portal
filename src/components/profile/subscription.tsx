import axios from "axios";
import React, { CSSProperties, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Space,
  Table,
  message,
  Tag,
  Tooltip,
  Button,
  Row,
  Col,
  Popover,
  Divider,
} from "antd";
import { useProfileStore } from "../../stores";
import { getSublist } from "../../requests";
import { IPlan, ISubscription } from "../../shared.types";
import { showAmount } from "../../helpers";
import ModalResumeOrTerminateSub from "../modalTerminateOrResumeSub";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { SUBSCRIPTION_STATUS } from "../../constants";
import CancelSubModal from "../modalCancelPendingSub";
import "../../shared.css";

const APP_PATH = import.meta.env.BASE_URL; // default is / (if no --base specified in build cmd)

const columns: ColumnsType<ISubscription> = [
  {
    title: "Name",
    dataIndex: "planName",
    key: "planName",
    // render: (text) => <a>{text}</a>,
    render: (_, sub) => <span>{sub.plan?.planName}</span>,
  },
  {
    title: "Total Amount",
    dataIndex: "amount",
    key: "amount",
    render: (_, sub) => {
      return <span>{showAmount(sub.amount, sub.currency)}</span>;
    },
  },
  {
    title: "Start Date",
    dataIndex: "currentPeriodStart",
    key: "currentPeriodStart",
    render: (_, sub) => {
      return (
        <span>
          {dayjs(sub.currentPeriodStart * 1000).format("YYYY-MMM-DD HH:MM")}
        </span>
      );
    },
  },
  {
    title: "End Date",
    dataIndex: "currentPeriodEnd",
    key: "currentPeriodEnd",
    render: (_, sub) => {
      return (
        <span>
          {dayjs(sub.currentPeriodEnd * 1000).format("YYYY-MMM-DD HH:MM")}
        </span>
      );
    },
  },
];

const Index = () => {
  const location = useLocation();
  const profileStore = useProfileStore();
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<ISubscription[]>([]);
  const navigate = useNavigate();

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const fetchData = async () => {
    let subListRes;
    setLoading(true);
    try {
      subListRes = await getSublist({ page: 0 });
      setLoading(false);
      console.log("user sub list: ", subListRes);
      const code = subListRes.data.code;
      code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
      if (code != 0) {
        // TODO: save all the code as ENUM in constant,
        throw new Error(subListRes.data.message);
      }
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("err getting user sub list: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }

    const sub: ISubscription[] =
      subListRes.data.data.Subscriptions == null
        ? []
        : subListRes.data.data.Subscriptions.map((s: any) => {
            return {
              ...s.subscription,
              plan: s.plan,
              addons:
                s.addons == null
                  ? []
                  : s.addons.map((a: any) => ({
                      ...a.addonPlan,
                      quantity: a.quantity,
                    })),
              user: s.user,
              /*
                id: s.subscription.id,
                subscriptionId: s.subscription.subscriptionId,
                addons: "",
                amount: s.subscription.amount,
                currency: s.subscription.currency,
                gatewayId: s.subscription.gatewayId,
                firstPaidTime: s.subscription.firstPaidTime,
                currentPeriodEnd: s.subscription.currentPeriodEnd,
                currentPeriodStart: s.subscription.currentPeriodStart,
                */
            };
          });
    console.log("final sub: ", sub);
    setSubscriptions(sub);
    if (sub.length > 0) {
      return;
    }

    // if user enter this route from login and has no subscription(new user or current sub expired/cancelled)
    // they'll be redirected to /product, otherwise, stay.
    if (location.state != null && location.state.from == "login") {
      navigate(`${APP_PATH}products/update`);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state && location.state.msg) {
      message.info(location.state.msg);
    }
  }, []);

  return (
    <div>
      <div>
        <Divider
          orientation="left"
          style={{ margin: "32px 0", color: "#757575" }}
        >
          Current Subscription
        </Divider>
        {subscriptions.length > 0 && (
          <SubscriptionInfoSection
            subInfo={subscriptions[0]}
            refresh={fetchData}
          />
        )}
        {subscriptions.length > 0 &&
          subscriptions[0].unfinishedSubscriptionPendingUpdate && (
            <PendingUpdateSection subInfo={subscriptions[0]} />
          )}
        <Divider
          orientation="left"
          style={{ margin: "32px 0", color: "#757575" }}
        >
          Subscription History
        </Divider>
        <Table
          columns={columns}
          dataSource={subscriptions}
          rowKey={"id"}
          rowClassName="clickable-tbl-row"
          pagination={false}
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
          }}
        />
      </div>
    </div>
  );
};

export default Index;

const PendingUpdateSection = ({ subInfo }: { subInfo: ISubscription }) => {
  const i = subInfo.unfinishedSubscriptionPendingUpdate;
  console.log("i: ", i);
  return (
    <>
      <Divider orientation="left" style={{ margin: "32px 0" }}>
        Pending Update
      </Divider>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan
        </Col>
        <Col span={6}>{i!.updatePlan.planName}</Col>
        <Col span={4} style={colStyle}>
          Plan Description
        </Col>
        <Col span={6}>{i!.updatePlan.description}</Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan Price
        </Col>
        <Col span={6}>
          {showAmount(i!.updatePlan.amount, i!.updatePlan.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Addons Price
        </Col>
        <Col span={6}>
          {i?.updateAddons &&
            showAmount(
              i.updateAddons!.reduce(
                (
                  sum,
                  { quantity, amount }: { quantity: number; amount: number }
                ) => sum + quantity * amount,
                0
              ),
              i.updateCurrency
            )}

          {i?.updateAddons && i.updateAddons.length > 0 && (
            <Popover
              placement="top"
              title="Addon breakdown"
              content={
                <div style={{ width: "280px" }}>
                  {i?.updateAddons.map((a) => (
                    <Row key={a.id}>
                      <Col span={10}>{a.planName}</Col>
                      <Col span={14}>
                        {showAmount(a.amount, a.currency)} × {a.quantity} ={" "}
                        {showAmount(a.amount * a.quantity, a.currency)}
                      </Col>
                    </Row>
                  ))}
                </div>
              }
            >
              <span style={{ marginLeft: "8px", cursor: "pointer" }}>
                <InfoCircleOutlined />
              </span>
            </Popover>
          )}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Proration Amount
        </Col>
        <Col span={6}>{showAmount(i!.prorationAmount, i!.updateCurrency)}</Col>
        <Col span={4} style={colStyle}>
          <span>Paid</span>
        </Col>
        <Col span={6}>
          {i!.paid == 1 ? (
            <CheckCircleOutlined style={{ color: "green" }} />
          ) : (
            <MinusOutlined style={{ color: "red" }} />
          )}
          {i!.link != "" && (
            <a
              href={i!.link}
              target="_blank"
              style={{ marginLeft: "8px", fontSize: "11px" }}
            >
              Payment Link
            </a>
          )}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Total Amount
        </Col>
        <Col span={6}>
          {" "}
          {showAmount(i!.updateAmount, i!.updatePlan.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Bill Period
        </Col>
        <Col span={6}>
          {`${i!.updatePlan.intervalCount} ${i!.updatePlan.intervalUnit}`}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Effective Date
        </Col>
        <Col span={6}>
          {new Date(i!.effectTime * 1000).toLocaleDateString()}
        </Col>
      </Row>
    </>
  );
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: "32px",
};
const colStyle: CSSProperties = { fontWeight: "bold" };

interface ISubSectionProps {
  subInfo: ISubscription;
  refresh: () => void;
}
const SubscriptionInfoSection = ({ subInfo, refresh }: ISubSectionProps) => {
  const navigate = useNavigate();
  const [resumeOrTerminateModal, setResumeOrTerminateModal] = useState(false);
  const toggleResumeOrTerminateSubModal = () =>
    setResumeOrTerminateModal(!resumeOrTerminateModal);
  const [action, setAction] = useState<"TERMINATE" | "RESUME">("TERMINATE");
  const openModal = (action: "TERMINATE" | "RESUME") => {
    setAction(action);
    toggleResumeOrTerminateSubModal();
  };

  const [cancelSubModalOpen, setCancelSubModalOpen] = useState(false);
  const toggleCancelSubModal = () => setCancelSubModalOpen(!cancelSubModalOpen);

  return (
    <>
      <SubReminder sub={subInfo} toggleModal={toggleCancelSubModal} />
      {cancelSubModalOpen && (
        <CancelSubModal
          subInfo={subInfo}
          refresh={refresh}
          closeModal={toggleCancelSubModal}
        />
      )}
      <ModalResumeOrTerminateSub
        isOpen={resumeOrTerminateModal}
        action={action}
        subInfo={subInfo}
        closeModal={toggleResumeOrTerminateSubModal}
        refresh={refresh}
      />
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan
        </Col>
        <Col span={6}>{subInfo?.plan?.planName}</Col>
        <Col span={4} style={colStyle}>
          Plan Description
        </Col>
        <Col span={6}>{subInfo?.plan?.description}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Status
        </Col>
        <Col span={6}>
          {subInfo && SUBSCRIPTION_STATUS[subInfo.status]}
          <span
            style={{ cursor: "pointer", marginLeft: "8px" }}
            onClick={refresh}
          >
            <SyncOutlined />
          </span>
        </Col>
        <Col span={4} style={colStyle}>
          Subscription Id
        </Col>
        <Col span={6}>{subInfo?.subscriptionId}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan Price
        </Col>
        <Col span={6}>
          {subInfo?.plan?.amount &&
            showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Addons Price
        </Col>
        <Col span={6}>
          {subInfo &&
            subInfo.addons &&
            showAmount(
              subInfo!.addons!.reduce(
                (
                  sum,
                  { quantity, amount }: { quantity: number; amount: number }
                ) => sum + quantity * amount,
                0
              ),
              subInfo!.currency
            )}

          {subInfo && subInfo.addons && subInfo.addons.length > 0 && (
            <Popover
              placement="top"
              title="Addon breakdown"
              content={
                <div style={{ width: "280px" }}>
                  {subInfo?.addons.map((a) => (
                    <Row key={a.id}>
                      <Col span={10}>{a.planName}</Col>
                      <Col span={14}>
                        {showAmount(a.amount, a.currency)} × {a.quantity} ={" "}
                        {showAmount(a.amount * a.quantity, a.currency)}
                      </Col>
                    </Row>
                  ))}
                </div>
              }
            >
              <span style={{ marginLeft: "8px", cursor: "pointer" }}>
                <InfoCircleOutlined />
              </span>
            </Popover>
          )}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Total Amount
        </Col>
        <Col span={6}>
          {subInfo?.amount && showAmount(subInfo.amount, subInfo.currency)}
          {subInfo && subInfo.taxScale && subInfo.taxScale != 0 ? (
            <span style={{ color: "#757575", fontSize: "11px" }}>
              {` (${
                subInfo && subInfo.taxScale && subInfo.taxScale / 100
              }% tax incl)`}
            </span>
          ) : null}
        </Col>

        <Col span={4} style={colStyle}>
          Bill Period
        </Col>
        <Col span={6}>
          {subInfo != null && subInfo.plan != null
            ? `${subInfo.plan.intervalCount} ${subInfo.plan.intervalUnit}`
            : ""}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          First Pay
        </Col>
        <Col span={6}>
          {subInfo.firstPaidTime == null
            ? "N/A"
            : dayjs(subInfo.firstPaidTime).format("YYYY-MMM-DD")}
        </Col>
        <Col span={4} style={colStyle}>
          Next Due Date
        </Col>
        <Col span={6}>
          {dayjs(subInfo.currentPeriodEnd * 1000).format("YYYY-MMM-DD")}
        </Col>
      </Row>

      {subInfo && subInfo.status == 2 && (
        <div
          style={{
            margin: "24px 0",
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            gap: "36px",
          }}
        >
          <Button onClick={() => navigate(`${APP_PATH}products/update`)}>
            Change Plan
          </Button>
          {subInfo.cancelAtPeriodEnd == 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Button onClick={() => openModal("TERMINATE")}>
                End Subscription
              </Button>
            </div>
          ) : (
            <div>
              <span>Subscription will end on </span>
              <span style={{ color: "red", marginRight: "8px" }}>
                {subInfo &&
                  // new Date(activeSub!.trialEnd * 1000).toLocaleString()
                  new Date(subInfo!.currentPeriodEnd * 1000).toLocaleString()}
              </span>
              <Button onClick={() => openModal("RESUME")}>Resume</Button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

// productUpdate.tsx has the same code, refactor it
const SubReminder = ({
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
        n = "Your subscription is initializing, please wait a few moment.";
        break;
      case 1:
        n = (
          <div
            style={{
              color: "#757575",
              fontSize: "12px",
              background: "#fbe9e7",
              borderRadius: "4px",
              padding: "6px",
              marginBottom: "12px",
            }}
          >
            Your subscription has been created, but not activated, please go to{" "}
            <a href={sub!.link} target="_blank">
              checkout page
            </a>{" "}
            to finishe the payment within 3 days. If you haven't finished the
            payment within 3 days, your subscription will be cancelled, or you
            can{" "}
            <Button type="link" style={{ padding: "0" }} onClick={toggleModal}>
              Cancel
            </Button>{" "}
            this subscription immediately.
          </div>
        );
        break;
      case 3:
        n = "Your subscription is in pending status, please wait";
        break;
      default:
        n = "";
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
