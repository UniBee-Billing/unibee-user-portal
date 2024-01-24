import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Space, Table, message, Tag, Tooltip } from "antd";
import { useProfileStore } from "../../stores";
import { getSublist } from "../../requests";
import { ISubscription } from "../../shared.types";
import { showAmount } from "../../helpers";
import type { ColumnsType } from "antd/es/table";
import { LoadingOutlined } from "@ant-design/icons";
import PageLoading from "../pageLoading";

const APP_PATH = import.meta.env.BASE_URL; // default is / (if no --base specified in build cmd)
const API_URL = import.meta.env.VITE_API_URL;
/*
interface SubscriptionType {
  id: number;
  subscriptionId: string;
  planName: string;
  addons: string;
  amount: number;
  currency: string;
  channelId: number;
  firstPayTime: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
}
*/

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
  /*
  {
    title: "Addons",
    dataIndex: "addons",
    key: "addons",
  },

  {
    title: "Payment method",
    dataIndex: "channelId",
    key: "channelId",
    render: (_, plan) => {
      return <span>Stripe</span>;
    },
  },
*/
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
  const [errMsg, setErrMsg] = useState("");
  const [firstLoading, setFirstLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<ISubscription[]>([]);
  const navigate = useNavigate();

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  useEffect(() => {
    const fetchData = async () => {
      let subListRes;
      setLoading(true);
      try {
        subListRes = await getSublist({ page: 0 });
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

      setLoading(false);
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
      navigate(`${APP_PATH}products`); // new users, no subscriptions
    };
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
        <h2>Current subscription</h2>
        <div style={{ height: "80px" }}></div>
        <h2>History</h2>
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
