import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  console.log("token: ", token);

  useEffect(() => {
    axios
      .post(
        `${API_URL}/subscription/v1/subscription_plan_list`,
        {
          merchantId: 15621,
          type: 1,
          status: 0,
          currency: "usd",
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
            navigate(`${APP_PATH}login`);
            throw new Error(res.data.message);
          }
          setErrMsg(res.data.message);
        }
      })
      .catch((err) => {
        console.log("get subscription list err: ", err);
        setErrMsg(err.message);
      });
  }, []);

  return <div>dashboard</div>;
};

export default Index;
