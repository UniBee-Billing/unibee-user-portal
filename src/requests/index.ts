import { ExpiredError, IProfile } from '../shared.types';
import { useAppConfigStore, useProfileStore, useSessionStore } from '../stores';
import { request } from './client';

const session = useSessionStore.getState();

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
  try {
    const res = await request.post(`/user/auth/sso/register`, body);
    return [null, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};
// -------------

type TSignupVerifyReq = {
  email: string;
  verificationCode: string;
};
export const signUpVerifyReq = async (body: TSignupVerifyReq) => {
  try {
    const res = await request.post(`/user/auth/sso/registerVerify`, body);
    return [null, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

type TPassLogin = {
  email: string;
  password: string;
};
export const loginWithPasswordReq = async (body: TPassLogin) => {
  try {
    const res = await request.post(`/user/auth/sso/login`, body);
    session.setSession({ expired: false, refresh: null });
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const loginWithOTPReq = async (email: string) => {
  try {
    request.post(`/user/auth/sso/loginOTP`, {
      email,
    });
    return [null, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const loginWithOTPVerifyReq = async (
  email: string,
  verificationCode: string,
) => {
  try {
    const res = await request.post(`/user/auth/sso/loginOTPVerify`, {
      email,
      verificationCode,
    });
    session.setSession({ expired: false, refresh: null });
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const resetPassReq = async (
  oldPassword: string,
  newPassword: string,
) => {
  try {
    const res = await request.post(`/user/passwordReset`, {
      oldPassword,
      newPassword,
    });
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    return [null, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const forgetPassReq = async (email: string) => {
  try {
    await request.post(`/user/auth/sso/passwordForgetOTP`, {
      email,
    });
    return [null, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const forgetPassVerifyReq = async (
  email: string,
  verificationCode: string,
  newPassword: string,
) => {
  try {
    await request.post(`/user/auth/sso/passwordForgetOTPVerify`, {
      email,
      verificationCode,
      newPassword,
    });
    return [null, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const logoutReq = async () => {
  try {
    const res = await request.post(`/user/logout`, {});
    return [null, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getProfileReq = async () => {
  try {
    const res = await request.get(`/user/get`);
    if (res.data.code == 61) {
      //  session.setSession({ expired: true, refresh: null });
      throw new ExpiredError('Session expired');
    }
    return [res.data.data.user, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getProfileWithMoreReq = async (refreshCb: () => void) => {
  const [[user, errUser], [countryList, countryErr]] = await Promise.all([
    getProfileReq(),
    getCountryList(),
  ]);
  const err = errUser || countryErr;
  if (null != err) {
    if (err instanceof ExpiredError) {
      session.setSession({ expired: true, refresh: refreshCb });
    }
    return [null, err];
  }
  return [{ user, countryList }, null];
};

export const saveProfileReq = async (newProfile: IProfile) => {
  try {
    const res = await request.post(`/user/update`, newProfile);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getAppConfigReq = async () => {
  const session = useSessionStore.getState();
  try {
    const res = await request.get(`/system/information/get`, {});
    console.log('app config res: ', res);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
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
    return [res.data.data.gateways, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getSublistReq = async (refreshCb: () => void) => {
  const profile = useProfileStore.getState();
  const body = {
    userId: profile.id,
    // status: 0,
    page: 0,
    count: 100,
  };
  try {
    const res = await request.post(`/user/subscription/list`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new Error('Session expired');
    }
    return [res.data.data.subscriptions, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getActiveSub = async () => {
  const profile = useProfileStore.getState();
  try {
    const res = await request.post(`/user/subscription/list`, {
      userId: profile.id,
      status: 2, // active subscription
      page: 0,
      count: 100,
    });
    if (res.data.code == 61) {
      // session.setSession({ expired: true, refresh: null });
      throw new ExpiredError('Session expired');
    }
    return [res.data.data.subscriptions, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getPlanList = async () => {
  try {
    const res = await request.post(`/user/plan/list`, {
      page: 0,
      count: 100,
      // type: 1,
    });
    if (res.data.code == 61) {
      // session.setSession({ expired: true, refresh: null });
      throw new ExpiredError('Session expired');
    }
    return [res.data.data.plans, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getActiveSubWithMore = async (refreshCb: () => void) => {
  const [[subscriptions, errSubDetail], [plans, errPlanList]] =
    await Promise.all([getActiveSub(), getPlanList()]);
  const err = errSubDetail || errPlanList;
  if (null != err) {
    if (err instanceof ExpiredError) {
      session.setSession({ expired: true, refresh: refreshCb });
    }
    return [null, err];
  }
  return [{ subscriptions, plans }, null];
};

// update preview
export const createUpdatePreviewReq = async (
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  subscriptionId: string | null,
) => {
  const urlPath = 'update_preview';
  const body = {
    subscriptionId,
    newPlanId: planId,
    quantity: 1,
    addonParams: addons,
  };
  try {
    const res = await request.post(`/user/subscription/${urlPath}`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

// create new prview
export const createPreviewReq = async (
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  vatNumber: string | null,
  vatCountryCode: string | null,
  gatewayId: number,
) => {
  const urlPath = 'create_preview';
  const body = {
    gatewayId,
    planId,
    newPlanId: planId,
    quantity: 1,
    addonParams: addons,
    vatNumber,
    vatCountryCode,
  };
  try {
    const res = await request.post(`/user/subscription/${urlPath}`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const updateSubscriptionReq = async (
  newPlanId: number,
  subscriptionId: string,
  addons: { quantity: number; addonPlanId: number }[],
  confirmTotalAmount: number,
  confirmCurrency: string,
  prorationDate: number,
) => {
  // "create_submit"
  const body = {
    subscriptionId,
    newPlanId,
    quantity: 1,
    addonParams: addons,
    confirmTotalAmount,
    confirmCurrency,
    prorationDate,
  };
  try {
    const res = await request.post(`/user/subscription/update_submit`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const createSubscriptionReq = async (
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  confirmTotalAmount: number,
  confirmCurrency: string,
  vatCountryCode: string,
  vatNumber: string,
  gatewayId: number,
) => {
  const body = {
    planId,
    quantity: 1,
    gatewayId,
    addonParams: addons,
    confirmTotalAmount,
    confirmCurrency,
    returnUrl: `${window.location.origin}/payment-result`, // .origin doesn't work on IE
    vatCountryCode,
    vatNumber,
  };
  try {
    const res = await request.post(`/user/subscription/create_submit`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const vatNumberCheckReq = async (vatNumber: string) => {
  const body = { vatNumber };
  try {
    const res = await request.post(`/user/vat/vat_number_validate`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    return [res.data.data.vatNumberValidate, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

// check payment result
export const checkPaymentReq = async (subscriptionId: string) => {
  const body = { subscriptionId };
  try {
    const res = await request.post(`/user/subscription/pay_check`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const checkSessionReq = async (sessionId: string) => {
  const body = { session: sessionId };
  try {
    const res = await request.post(`/user/auth/session_login`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
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
      ? 'cancel_at_period_end'
      : 'cancel_last_cancel_at_period_end';
  const body = {
    subscriptionId,
  };
  try {
    const res = await request.post(URL, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    return [null, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

// new user has choosen a sub plan, but not paid yet, befoer the payment due date, user can still cancel it.
// this fn is for this purpose only, it's not the same as terminate an active sub (which is the above terminateOrResumeSubReq's job).
export const cancelSubReq = async (subscriptionId: string) => {
  try {
    const res = await request.post(`/user/subscription/cancel`, {
      subscriptionId,
    });
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    return [null, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getCountryList = async () => {
  const body = {};
  try {
    const res = await request.post(`/user/vat/country_list`, body);
    if (res.data.code == 61) {
      // session.setSession({ expired: true, refresh: null });
      throw new ExpiredError('Session expired');
    }
    return [res.data.data.vatCountryList, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};
