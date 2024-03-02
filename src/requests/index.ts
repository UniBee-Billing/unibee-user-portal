import { IProfile } from '../shared.types';
import { useAppConfigStore, useProfileStore, useSessionStore } from '../stores';
import { request } from './client';

// after login, we need merchantInfo, appConfig, payment gatewayInfo, etc.
// this fn get all these data in one go.
export const initializeReq = async () => {
  const [
    [appConfig, errConfig],
    [gateways, errGateway],
    [merchantInfo, errMerchant],
  ] = await Promise.all([
    getAppConfigReq(),
    getGatewayListReq(),
    getMerchantInfoReq(),
  ]);
  let err = errConfig || errGateway || errMerchant;
  if (null != err) {
    return [null, err];
  }
  return [{ appConfig, gateways, merchantInfo }, null];
};

// ------------
type TSignupReq = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};
export const signUpReq = async (body: TSignupReq) => {
  return await request.post(`/user/auth/sso/register`, body);
};
// --------------

type TSignupVerifyReq = {
  email: string;
  verificationCode: string;
};
export const signUpVerifyReq = async (body: TSignupVerifyReq) => {
  return await request.post(`/user/auth/sso/registerVerify`, body);
};

type TPassLogin = {
  email: string;
  password: string;
};
export const loginWithPasswordReq = async (body: TPassLogin) => {
  try {
    const res = await request.post(`/user/auth/sso/login`, body);
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    // const {Token, User} = res.data.data
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const loginWithOTPReq = async (email: string) => {
  return await request.post(`/user/auth/sso/loginOTP`, {
    email,
  });
};

export const loginWithOTPVerifyReq = async (
  email: string,
  verificationCode: string,
) => {
  return await request.post(`/user/auth/sso/loginOTPVerify`, {
    email,
    verificationCode,
  });
};

export const resetPassReq = async (
  oldPassword: string,
  newPassword: string,
) => {
  return await request.post(`/user/passwordReset`, {
    oldPassword,
    newPassword,
  });
};

export const forgetPassReq = async (email: string) => {
  return await request.post(`/user/auth/sso/passwordForgetOTP`, {
    email,
  });
};

export const forgetPassVerifyReq = async (
  email: string,
  verificationCode: string,
  newPassword: string,
) => {
  return await request.post(`/user/auth/sso/passwordForgetOTPVerify`, {
    email,
    verificationCode,
    newPassword,
  });
};

export const logoutReq = async () => {
  return await request.post(`/user/user_logout`, {});
};

export const getProfile = async () => {
  return await request.get(`/user/profile`);
};

export const saveProfile = async (newProfile: IProfile) => {
  return await request.post(`/user/profile`, newProfile);
};

export const getAppConfigReq = async () => {
  const session = useSessionStore.getState();
  try {
    const res = await request.post(`/system/information`, {});
    console.log('app config res: ', res);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getMerchantInfoReq = async () => {
  const session = useSessionStore.getState();
  try {
    const res = await request.get(`/user/merchant/get`);
    console.log('merchant info res: ', res);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.merchant, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getGatewayListReq = async () => {
  const session = useSessionStore.getState();
  try {
    const res = await request.get(`/user/gateway/list`);
    console.log('gateway res: ', res);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.gateways, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getSublist = async ({ page = 0 }: { page: number }) => {
  const profile = useProfileStore.getState();
  const body = {
    userId: profile.id,
    // status: 0,
    page,
    count: 100,
  };
  return await request.post(`/user/subscription/subscription_list`, body);
};

export const getActiveSub = async () => {
  const profile = useProfileStore.getState();
  return await request.post(`/user/subscription/subscription_list`, {
    userId: profile.id,
    status: 2, // active subscription
    page: 0,
    count: 100,
  });
};

export const getPlanList = async () => {
  return await request.post(`/user/plan/subscription_plan_list`, {
    page: 0,
    count: 100,
    // type: 1,
  });
};

// for update preview
export const createUpdatePreviewReq = async (
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  subscriptionId: string | null,
) => {
  const appConfig = useAppConfigStore.getState();
  const urlPath = 'subscription_update_preview';
  const body = {
    subscriptionId,
    // userId: profile.id,
    gatewayId: appConfig.gateway[0].gatewayId,
    // planId,
    newPlanId: planId,
    quantity: 1,
    addonParams: addons,
  };
  return await request.post(`/user/subscription/${urlPath}`, body);
};

// for create new prview
export const createPreviewReq = async (
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  vatNumber: string | null,
  vatCountryCode: string | null,
) => {
  const profile = useProfileStore.getState();
  const appConfig = useAppConfigStore.getState();
  const urlPath = 'subscription_create_preview';
  const body = {
    userId: profile.id,
    gatewayId: appConfig.gateway[0].gatewayId,
    planId,
    newPlanId: planId,
    quantity: 1,
    addonParams: addons,
    vatNumber,
    vatCountryCode,
  };
  return await request.post(`/user/subscription/${urlPath}`, body);
};

export const updateSubscription = async (
  newPlanId: number,
  subscriptionId: string,
  addons: { quantity: number; addonPlanId: number }[],
  confirmTotalAmount: number,
  confirmCurrency: string,
  prorationDate: number,
) => {
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
  return await request.post(
    `/user/subscription/subscription_update_submit`,
    body,
  );
};

export const createSubscription = async (
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  confirmTotalAmount: number,
  confirmCurrency: string,
  vatCountryCode: string,
  vatNumber: string,
) => {
  const profile = useProfileStore.getState();
  const appConfig = useAppConfigStore.getState();
  const body = {
    planId,
    quantity: 1,
    gatewayId: appConfig.gateway[0].gatewayId,
    UserId: profile.id,
    addonParams: addons,
    confirmTotalAmount,
    confirmCurrency,
    returnUrl: `${window.location.origin}/payment-result`, // .origin doesn't work on IE
    vatCountryCode,
    vatNumber,
  };
  return await request.post(
    `/user/subscription/subscription_create_submit`,
    body,
  );
};

export const vatNumberCheckReq = async (vatNumber: string) => {
  const body = { vatNumber };
  return await request.post(`/user/vat/vat_number_validate`, body);
};

// check payment result
export const checkPayment = async (subscriptionId: string) => {
  const body = { subscriptionId };
  return await request.post(`/user/subscription/subscription_pay_check`, body);
};

export const checkSession = async (session: string) => {
  const body = { session };
  return await request.post(`/user/auth/session_login`, body);
};

export const terminateSub = async (SubscriptionId: string) => {
  return await request.post(
    `/user/subscription/subscription_cancel_at_period_end`,
    { SubscriptionId },
  );
};

export const terminateOrResumeSubReq = async ({
  subscriptionId,
  action,
}: {
  subscriptionId: string;
  action: 'TERMINATE' | 'RESUME';
}) => {
  let URL = `/user/subscription/`;
  URL +=
    action == 'TERMINATE'
      ? 'subscription_cancel_at_period_end'
      : 'subscription_cancel_last_cancel_at_period_end';
  const body = {
    subscriptionId,
  };
  return await request.post(URL, body);
};

// new user has choosen a sub plan, but not paid yet, befoer the payment due date, user can still cancel it.
// this fn is for this purpose only, it's not the same for terminate an active sub (which is the above terminateOrResumeSubReq's job).
export const cancelSubReq = async (subscriptionId: string) => {
  return await request.post(`/user/subscription/subscription_cancel`, {
    subscriptionId,
  });
};

export const getCountryList = async () => {
  const body = {};
  return await request.post(`/user/vat/vat_country_list`, body);
};
