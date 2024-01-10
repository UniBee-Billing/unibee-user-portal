import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Space, Table, message, Tag, Tooltip } from "antd";
import { useProfileStore } from "../../stores";
import type { ColumnsType } from "antd/es/table";

const APP_PATH = import.meta.env.BASE_URL; // default is / (if no --base specified in build cmd)
const API_URL = import.meta.env.VITE_API_URL;

interface SubscriptionType {
  id: number;
  subscriptionId: string;
  planName: string;
  addons: string;
  amount: number;
  currency: string;
  channelId: number;
  firstPayTime: string;
  nextPayDate: string;
}

const columns: ColumnsType<SubscriptionType> = [
  {
    title: "Name",
    dataIndex: "planName",
    key: "planName",
    // render: (text) => <a>{text}</a>,
  },
  {
    title: "Addons",
    dataIndex: "addons",
    key: "addons",
  },
  {
    title: "Amount",
    dataIndex: "amount",
    key: "amount",
    /*
    render: (_, p) => {
      return (
        <span>{`${CURRENCY[p.currency].symbol} ${p.amount}/${p.intervalCount}${
          p.intervalUnit
        } `}</span>
      );
    },
    */
  },
  {
    title: "Payment method",
    dataIndex: "channelId",
    key: "channelId",
    render: (_, plan) => {
      return <span>Stripe</span>;
    },
  },
  {
    title: "First Pay Date",
    dataIndex: "firstPayTime",
    key: "firstPayTime",
    /*
    render: (_, plan) => {
      return <span>{PLAN_STATUS[plan.status]}</span>;
    },
    */
  },
  {
    title: "Next Pay Date",
    dataIndex: "nirstPayTime",
    key: "nirstPayTime",
  },
];

const Index = () => {
  const profileStore = useProfileStore();
  console.log("userId from store: ", profileStore.id);
  const [errMsg, setErrMsg] = useState("");
  const [firstLoading, setFirstLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({});
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([]);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    axios
      .post(
        `${API_URL}/user/subscription/subscription_list`,
        {
          merchantId: 15621,
          userId: profileStore.id,
          // status: 0,
          page: 0,
          count: 100,
        },
        {
          headers: {
            Authorization: `${profileStore.token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("user subscription list res: ", res);
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
        const sub: SubscriptionType[] = res.data.data.Subscriptions.map(
          (s: any) => {
            return {
              id: s.Subscription.id,
              subscriptionId: s.Subscription.subscriptionId,
              addons: "",
              amount: s.Subscription.amount,
              currency: s.Subscription.currency,
              channelId: s.Subscription.channelId,
              firstPayTime: s.Subscription.firstPayTime,
              nextPayDate: s.Subscription.nextPayDate,
            };
          }
        );
        setSubscriptions(sub);
      })
      .catch((err) => {
        console.log("user subscription list err: ", err);
        messageApi.open({
          type: "error",
          content: err.message,
        });
      });
  }, []);

  /*
 id: number;
  subscriptionId: string;
  planName: string;
  addons: string;
  amount: number;
  currency: string;
  channelId: number;
  firstPayTime: string;
  nextPayDate: string;
  */

  return (
    <div>
      {contextHolder}
      <div>
        <h2>Current subscription</h2>
        <div style={{ height: "80px" }}></div>
        <h2>History</h2>
        <Table
          columns={columns}
          dataSource={subscriptions}
          rowKey={"id"}
          pagination={false}
          /*
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              console.log("row click: ", record, "///", rowIndex);
              navigate(`${APP_PATH}price-plan/${record.id}`);
            }, // click row
            // onDoubleClick: (event) => {}, // double click row
            // onContextMenu: (event) => {}, // right button click row
            // onMouseEnter: (event) => {}, // mouse enter row
            // onMouseLeave: (event) => {}, // mouse leave row
          };
        }}
        */
        />
      </div>
    </div>
  );
};

export default Index;
