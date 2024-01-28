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
import type { ColumnsType } from "antd/es/table";
import {
  InfoCircleOutlined,
  LoadingOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { SUBSCRIPTION_STATUS } from "../../constants";

const APP_PATH = import.meta.env.BASE_URL; // default is / (if no --base specified in build cmd)
const API_URL = import.meta.env.VITE_API_URL;

const columns: ColumnsType<ISubscription> = [
  {
    title: "Name",
    dataIndex: "planName",
    key: "planName",
    // render: (text) => <a>{text}</a>,
    render: (_, sub) => <a>{sub.plan?.planName}</a>,
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
        <span>{new Date(sub.currentPeriodStart * 1000).toLocaleString()}</span>
      );
    },
  },
  {
    title: "End Date",
    dataIndex: "currentPeriodEnd",
    key: "currentPeriodEnd",
    render: (_, sub) => {
      return (
        <span>{new Date(sub.currentPeriodEnd * 1000).toLocaleString()}</span>
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
                channelId: s.subscription.channelId,
                firstPayTime: s.subscription.firstPayTime,
                currentPeriodEnd: s.subscription.currentPeriodEnd,
                currentPeriodStart: s.subscription.currentPeriodStart,
                */
            };
          });
    console.log("final sub: ", sub);
    if (sub.length > 0) {
      setSubscriptions(sub);
      return;
    }
    navigate(`${APP_PATH}products/update`); // new users, no subscriptions
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
          Current subscription
        </Divider>
        {subscriptions.length > 0 && (
          <SubscriptionInfoSection
            subInfo={subscriptions[0]}
            refresh={fetchData}
          />
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

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: "32px",
};
const colStyle: CSSProperties = { fontWeight: "bold" };

interface ISubSectionProps {
  subInfo: ISubscription;
  refresh: () => void;
  // plans: IPlan[];
}
const SubscriptionInfoSection = ({
  subInfo,
  refresh,
}: // plans,
ISubSectionProps) => {
  const navigate = useNavigate();
  return (
    <>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan
        </Col>
        <Col span={6}>{subInfo?.plan?.planName}</Col>
        <Col span={4} style={colStyle}>
          Plan description
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
          Plan price
        </Col>
        <Col span={6}>
          {subInfo?.plan?.amount &&
            showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Addons price
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
          Total amount
        </Col>
        <Col span={6}>
          {subInfo?.amount && showAmount(subInfo.amount, subInfo.currency)}{" "}
          {subInfo && subInfo.taxScale && (
            <span style={{ color: "#757575", fontSize: "11px" }}>
              {" "}
              {`(${
                subInfo && subInfo.taxScale && subInfo.taxScale / 100
              }% tax incl)`}{" "}
            </span>
          )}
        </Col>

        <Col span={4} style={colStyle}>
          Bill period
        </Col>
        <Col span={6}>
          {subInfo != null && subInfo.plan != null
            ? `${subInfo.plan.intervalCount} ${subInfo.plan.intervalUnit}`
            : ""}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          First pay
        </Col>
        <Col span={6}>
          {new Date(subInfo.firstPayTime).toLocaleDateString()}
        </Col>
        <Col span={4} style={colStyle}>
          Next due date
        </Col>
        <Col span={6}>
          {new Date(subInfo.currentPeriodEnd * 1000).toLocaleDateString()}
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
            Change plan
          </Button>
        </div>
      )}
    </>
  );
};
