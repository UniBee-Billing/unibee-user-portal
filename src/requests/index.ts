import axios from "axios";
import { useProfileStore } from "../stores";
import { IProfile } from "../shared.types";

const API_URL = import.meta.env.VITE_API_URL;

export const signUpReq = async ({
  email,
  firstName,
  lastName,
  password,
}: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}) => {
  return await axios.post(`${API_URL}/user/auth/sso/register`, {
    email,
    firstName,
    lastName,
    password,
  });
};

export const singUpVerifyReq = async ({
  email,
  verificationCode,
}: {
  email: string;
  verificationCode: string;
}) => {
  return await axios.post(`${API_URL}/user/auth/sso/registerVerify`, {
    email,
    verificationCode,
  });
};

export const loginWithPasswordReq = async (email: string, password: string) => {
  return await axios.post(`${API_URL}/user/auth/sso/login`, {
    email,
    password,
  });
};

export const loginWithOTPReq = async (email: string) => {
  return await axios.post(`${API_URL}/user/auth/sso/loginOTP`, {
    email,
  });
};
export const loginWithOTPVerifyReq = async (
  email: string,
  verificationCode: string
) => {
  return await axios.post(`${API_URL}/user/auth/sso/loginOTPVerify`, {
    email,
    verificationCode,
  });
};

export const logoutReq = async () => {
  const profile = useProfileStore.getState();
  return await axios.post(
    `${API_URL}/user/user_logout`,
    {},
    {
      headers: {
        Authorization: `${profile.token}`, // Bearer: ******
      },
    }
  );
};

export const getProfile = async () => {
  const profile = useProfileStore.getState();
  return await axios.get(`${API_URL}/user/profile`, {
    headers: {
      Authorization: `${profile.token}`, // Bearer: ******
    },
  });
};

export const saveProfile = async (newProfile: IProfile) => {
  const profile = useProfileStore.getState();
  return await axios.post(`${API_URL}/user/profile`, newProfile, {
    headers: {
      Authorization: `${profile.token}`, // Bearer: ******
    },
  });
};

export const getSublist = async ({ page = 0 }: { page: number }) => {
  const profile = useProfileStore.getState();
  const body = {
    merchantId: 15621,
    userId: profile.id,
    // status: 0,
    page,
    count: 100,
  };
  return await axios.post(
    `${API_URL}/user/subscription/subscription_list`,
    body,
    {
      headers: {
        Authorization: `${profile.token}`, // Bearer: ******
      },
    }
  );
};

export const getActiveSub = async () => {
  const profile = useProfileStore.getState();
  console.log("profile from store: ", profile);
  return await axios.post(
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
  );
};

export const getPlanList = async () => {
  // pass page/count as params
  const profile = useProfileStore.getState();
  return await axios.post(
    `${API_URL}/user/plan/subscription_plan_list`,
    {
      merchantId: 15621,
      page: 0,
      count: 100,
      // type: 1,
    },
    {
      headers: {
        Authorization: `${profile.token}`, // Bearer: ******
      },
    }
  );
};

// for update preview
export const createUpdatePreviewReq = async (
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  subscriptionId: string | null
) => {
  const profile = useProfileStore.getState();
  const urlPath = "subscription_update_preview";

  const body = {
    subscriptionId,
    // userId: profile.id,
    channelId: 25,
    // planId,
    newPlanId: planId,
    quantity: 1,
    addonParams: addons,
  };
  return await axios.post(`${API_URL}/user/subscription/${urlPath}`, body, {
    headers: {
      Authorization: `${profile.token}`, // Bearer: ******
    },
  });
};

// for create new prview
export const createPreviewReq = async (
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  vatNumber: string | null,
  vatCountryCode: string | null
) => {
  const profile = useProfileStore.getState();
  const urlPath = "subscription_create_preview";
  const body = {
    userId: profile.id,
    channelId: 25,
    planId,
    newPlanId: planId,
    quantity: 1,
    addonParams: addons,
    vatNumber,
    vatCountryCode,
  };
  console.log("preview req body: ", body);
  return await axios.post(`${API_URL}/user/subscription/${urlPath}`, body, {
    headers: {
      Authorization: `${profile.token}`, // Bearer: ******
    },
  });
};

export const updateSubscription = async (
  newPlanId: number,
  subscriptionId: string,
  addons: { quantity: number; addonPlanId: number }[],
  confirmTotalAmount: number,
  confirmCurrency: string,
  prorationDate: number
) => {
  const profile = useProfileStore.getState();
  // "subscription_create_submit"
  const body = {
    subscriptionId,
    newPlanId,
    quantity: 1,
    addonParams: addons,
    confirmTotalAmount,
    confirmCurrency,
    prorationDate,
  };
  return await axios.post(
    `${API_URL}/user/subscription/subscription_update_submit`,
    body,
    {
      headers: {
        Authorization: `${profile.token}`, // Bearer: ******
      },
    }
  );
};

export const createSubscription = async (
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  confirmTotalAmount: number,
  confirmCurrency: string,
  vatCountryCode: string,
  vatNumber: string
) => {
  const profile = useProfileStore.getState();
  const body = {
    planId,
    quantity: 1,
    channelId: 25,
    UserId: profile.id,
    addonParams: addons,
    confirmTotalAmount,
    confirmCurrency,
    returnUrl: `${window.location.origin}/payment-result`, // .origin doesn't work on IE
    vatCountryCode,
    vatNumber,
  };
  // console.log("create sub body: ", body);
  return await axios.post(
    `${API_URL}/user/subscription/subscription_create_submit`,
    body,
    {
      headers: {
        Authorization: `${profile.token}`, // Bearer: ******
      },
    }
  );
};

export const vatNumberCheckReq = async (vatNumber: string) => {
  const profile = useProfileStore.getState();
  const body = { merchantId: 15621, vatNumber };
  return await axios.post(`${API_URL}/user/vat/vat_number_validate`, body, {
    headers: {
      Authorization: profile.token, // Bearer: ******
    },
  });
};

// check payment result
export const checkPayment = async (subscriptionId: string) => {
  const profile = useProfileStore.getState();
  const body = { subscriptionId };
  return await axios.post(
    `${API_URL}/user/subscription/subscription_pay_check`,
    body,
    {
      headers: {
        Authorization: profile.token, // Bearer: ******
      },
    }
  );
};

export const terminateSub = async (SubscriptionId: string) => {
  const profile = useProfileStore.getState();
  const body = {
    SubscriptionId,
  };
  return await axios.post(
    `${API_URL}/user/subscription/subscription_cancel_at_period_end`,
    body,
    {
      headers: {
        Authorization: `${profile.token}`, // Bearer: ******
      },
    }
  );
};

export const terminateOrResumeSubReq = async ({
  subscriptionId,
  action,
}: {
  subscriptionId: string;
  action: "TERMINATE" | "RESUME";
}) => {
  let URL = `${API_URL}/user/subscription/`;
  URL +=
    action == "TERMINATE"
      ? "subscription_cancel_at_period_end"
      : "subscription_cancel_last_cancel_at_period_end";
  //
  const body = {
    subscriptionId,
  };
  const profile = useProfileStore.getState();
  return await axios.post(URL, body, {
    headers: {
      Authorization: `${profile.token}`, // Bearer: ******
    },
  });
};

export const getCountryList = async (merchantId: number) => {
  const profile = useProfileStore.getState();
  const body = {
    merchantId,
  };
  return await axios.post(`${API_URL}/user/vat/vat_country_list`, body, {
    headers: {
      Authorization: `${profile.token}`, // Bearer: ******
    },
  });
};
