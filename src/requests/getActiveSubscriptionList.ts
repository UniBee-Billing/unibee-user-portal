import axios from "axios";
import { useProfileStore } from "../stores";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

export const getActiveSub = async () => {
  const profile = useProfileStore.getState();
  console.log("profile from store: ", profile);
  const res = await axios
    .post(
      `${API_URL}/user/subscription/subscription_list`,
      {
        merchantId: 15621,
        userId: profile.id,
        status: 2, // active subscription
        page: 0,
        count: 100,
      },
      {
        headers: {
          Authorization: `${profile.token}`, // Bearer: ******
        },
      }
    )
    .then((res) => {
      console.log("user active subscription list res: ", res);
      const statuCode = res.data.code;
      if (statuCode != 0) {
        if (statuCode == 61) {
          console.log("invalid token");
          // navigate(`${APP_PATH}login`, {
          // state: { msg: "session expired, please re-login" },
          // });
          return;
        }
        throw new Error(res.data.message);
      }
      /*
      const sub = res.data.data.Subscriptions.find(
        (s) => s.Subscription.id == 38
      );
      console.log("active sub choosen: ", sub);
    */
    })
    .catch((err) => {
      console.log("user active subscription list err: ", err);
    });
};
