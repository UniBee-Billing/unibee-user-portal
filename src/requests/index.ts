import axios from 'axios';
import { ExpiredError, IProfile } from '../shared.types';
import { useAppConfigStore, useProfileStore, useSessionStore } from '../stores';
import { request } from './client';

const session = useSessionStore.getState();
const appConfig = useAppConfigStore.getState();
const stripeGatewayId = appConfig.gateway.find(
  (g) => g.gatewayName == 'stripe',
)?.gatewayId;

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
    const res = await request.post(`/user/auth/sso/loginOTP`, {
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

// to be depreicated
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

// to be depreicated
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

// this also imcludes pending sub (we think Pending is a weak version of active)
export const getActiveSubReq = async (refreshCb: () => void) => {
  try {
    const res = await request.get(`/user/subscription/current/detail`);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new ExpiredError('Session expired');
    }
    return [res.data.data, null];
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
  refreshCb: () => void,
  discountCode?: string,
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
    refreshCb,
    discountCode,
  };
  try {
    const res = await request.post(`/user/subscription/${urlPath}`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
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
  discountCode?: string,
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
    discountCode,
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

// mark wire transfer as complete
export const markWireCompleteReq = async (subscriptionId: string) => {
  try {
    const res = await request.post(
      `/user/subscription/mark_wire_transfer_paid`,
      { subscriptionId },
    );
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

// ----------
type TGetInvoicesReq = {
  page: number;
  count: number;
  currency?: string;
  status?: number[];
  amountStart?: number;
  amountEnd?: number;
};
export const getInvoiceListReq = async (
  body: TGetInvoicesReq,
  refreshCb: (() => void) | null,
) => {
  try {
    const res = await request.post(`/user/invoice/list`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new Error('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getInvoiceDetailReq = async (
  invoiceId: string,
  refreshCb: () => void,
) => {
  try {
    const res = await request.get(
      `/user/invoice/detail?invoiceId=${invoiceId}`,
    );

    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new Error('Session expired');
    }
    return [res.data.data.invoice, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const downloadInvoice = (url: string) => {
  if (url == null || url == '') {
    return;
  }
  axios({
    url,
    method: 'GET',
    responseType: 'blob',
  }).then((response) => {
    const href = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = href;
    link.setAttribute('download', 'invoice.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  });
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

export const getPaymentListReq = async (
  { page, count }: { page: number; count: number },
  refreshCb: () => void,
) => {
  try {
    const res = await request.get(
      `/user/payment/payment_timeline_list?page=${page}&count=${count}`,
    );
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new Error('Session expired');
    }
    return [res.data.data, null];
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
  action: 'CANCEL' | 'UN-CANCEL';
}) => {
  let URL = `/user/subscription/`;
  URL +=
    action == 'CANCEL'
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

export const getPaymentMethodListReq = async (refreshCb: () => void) => {
  try {
    const res = await request.get(
      `/user/payment/method_list?gatewayId=${stripeGatewayId}`,
    );
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new ExpiredError('Session expired');
    }
    return [res.data.data.methodList, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const addPaymentMethodReq = async ({
  currency,
  subscriptionId,
  redirectUrl,
}: {
  currency: string;
  subscriptionId: string;
  redirectUrl: string;
}) => {
  const body = { currency, redirectUrl, gatewayId: stripeGatewayId };
  try {
    const res = await request.post('/user/payment/method_new', body);
    if (res.data.code == 61) {
      // session.setSession({ expired: true, refresh: null });
      throw new ExpiredError('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const changePaymentMethodReq = async ({
  paymentMethodId,
  subscriptionId,
}: {
  paymentMethodId: string;
  subscriptionId: string;
}) => {
  const body = { paymentMethodId, subscriptionId, gatewayId: stripeGatewayId };
  try {
    const res = await request.post('/user/subscription/change_gateway', body);
    if (res.data.code == 61) {
      // session.setSession({ expired: true, refresh: null });
      throw new ExpiredError('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

// one-time-payment for addon, but the payment has nothing to do with subscription
export const onetimePaymentReq = async ({
  userId,
  gatewayId,
  planId,
}: {
  userId: number;
  gatewayId: number;
  planId: number;
}) => {
  const body = { userId, gatewayId, planId };
  try {
    const res = await request.post(`/merchant/payment/new`, body);
    if (res.data.code == 61) {
      // session.setSession({ expired: true, refresh: null });
      throw new ExpiredError('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

// similar to onetimePaymentReq, but it's linked to subscription.
// user can see a list of addon purchase with current subscription.
type TAddonPayment = {
  addonId: number; // addon is technically the same as plan, so this is planId
  /*
  metadata?: {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  },
  */
  quantity: number;
  returnUrl: string;
  subscriptionId: string;
};
export const addonPaymentReq = async (body: TAddonPayment) => {
  try {
    const res = await request.post(
      `/user/subscription/new_onetime_addon_payment`,
      body,
    );
    if (res.data.code == 61) {
      // session.setSession({ expired: true, refresh: null });
      throw new ExpiredError('Session expired');
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const onetimepaymentListReq = async (
  subscriptionId: string,
  refreshCb: () => void,
) => {
  try {
    const res = await request.get(
      `/user/subscription/onetime_addon_list?subscriptionId=${subscriptionId}`,
    );
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new ExpiredError('Session expired');
    }
    return [res.data.data.subscriptionOnetimeAddons, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};
