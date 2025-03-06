import axios from 'axios'
import update from 'immutability-helper'
import { ExpiredError, IProfile } from '../shared.types'
import { useAppConfigStore, useProfileStore, useSessionStore } from '../stores'
import { request } from './client'

const session = useSessionStore.getState()
const appConfig = useAppConfigStore.getState()
const stripeGatewayId = appConfig.gateway.find(
  (g) => g.gatewayName == 'stripe'
)?.gatewayId

const updateSessionCb = (refreshCb?: () => void) => {
  const refreshCallbacks = update(session.refreshCallbacks, {
    $push: [refreshCb]
  })
  session.setSession({
    expired: true,
    refreshCallbacks
  })
}

const handleStatusCode = (code: number, refreshCb?: () => void) => {
  if (code == 61) {
    // TODO: use Enum to define the code
    // session expired || role/permissions changed(need relogin)
    console.log('pusing cb into refreshCb', refreshCb)
    updateSessionCb(refreshCb)
    throw new ExpiredError('Session expired')
  }
}

// after login, we need merchantInfo, appConfig, payment gatewayInfo, etc.
// this fn get all these data in one go.
// getProfileReq seems redundant, because a successful login will save user profile in store,
// but in case of user manual refresh, no login involved, I have to make this req.
// paymentMethod is saved in user profile, in case admin has updated userProfile, user need to refresh to get the updated profile.
export const initializeReq = async () => {
  const [
    [appConfig, errConfig],
    [gateways, errGateway],
    [merchantInfo, errMerchant],
    [user, errUser]
  ] = await Promise.all([
    getAppConfigReq(),
    getGatewayListReq(),
    getMerchantInfoReq(),
    getProfileReq()
  ])
  const err = errConfig || errGateway || errMerchant || errUser
  if (null != err) {
    return [null, err]
  }
  return [{ appConfig, gateways, merchantInfo, user }, null]
}

// ------------
type TSignupReq = {
  email: string
  firstName: string
  lastName: string
  password: string
}
export const signUpReq = async (body: TSignupReq) => {
  try {
    await request.post(`/user/auth/sso/register`, body)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// -------------

type TSignupVerifyReq = {
  email: string
  verificationCode: string
}
export const signUpVerifyReq = async (body: TSignupVerifyReq) => {
  try {
    await request.post(`/user/auth/sso/registerVerify`, body)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TPassLogin = {
  email: string
  password: string
}
export const loginWithPasswordReq = async (body: TPassLogin) => {
  try {
    const res = await request.post(`/user/auth/sso/login`, body)
    session.setSession({ expired: false, refreshCallbacks: [] })
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const loginWithOTPReq = async (email: string) => {
  try {
    await request.post(`/user/auth/sso/loginOTP`, {
      email
    })
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const loginWithOTPVerifyReq = async (
  email: string,
  verificationCode: string
) => {
  try {
    const res = await request.post(`/user/auth/sso/loginOTPVerify`, {
      email,
      verificationCode
    })
    session.setSession({ expired: false, refreshCallbacks: [] })
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const resetPassReq = async (
  oldPassword: string,
  newPassword: string
) => {
  try {
    const res = await request.post(`/user/passwordReset`, {
      oldPassword,
      newPassword
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const forgetPassReq = async (email: string) => {
  try {
    await request.post(`/user/auth/sso/passwordForgetOTP`, {
      email
    })
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const forgetPassVerifyReq = async (
  email: string,
  verificationCode: string,
  newPassword: string
) => {
  try {
    await request.post(`/user/auth/sso/passwordForgetOTPVerify`, {
      email,
      verificationCode,
      newPassword
    })
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const logoutReq = async () => {
  try {
    await request.post(`/user/logout`, {})
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getProfileReq = async () => {
  try {
    const res = await request.get(`/user/get`)
    handleStatusCode(res.data.code)
    return [res.data.data.user, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getProfileWithMoreReq = async (refreshCb: () => void) => {
  const [[user, errUser], [countryList, countryErr]] = await Promise.all([
    getProfileReq(),
    getCountryList()
  ])
  const err = errUser || countryErr
  if (null != err) {
    if (err instanceof ExpiredError) {
      updateSessionCb(refreshCb)
    }
    return [null, err]
  }
  return [{ user, countryList }, null]
}

export const saveProfileReq = async (newProfile: IProfile) => {
  try {
    const res = await request.post(`/user/update`, newProfile)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getAppConfigReq = async () => {
  try {
    const res = await request.get(`/system/information/get`, {})
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getMerchantInfoReq = async () => {
  try {
    const res = await request.get(`/user/merchant/get`)
    handleStatusCode(res.data.code)
    return [res.data.data.merchant, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getGatewayListReq = async () => {
  try {
    const res = await request.get(`/user/gateway/list`)
    handleStatusCode(res.data.code)
    return [res.data.data.gateways, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getSublistReq = async (refreshCb?: () => void) => {
  const profile = useProfileStore.getState()
  const body = {
    userId: profile.id,
    // status: 0,
    page: 0,
    count: 100
  }
  try {
    const res = await request.post(`/user/subscription/list`, body)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.subscriptions, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getActiveSub = async () => {
  const profile = useProfileStore.getState()
  try {
    const res = await request.post(`/user/subscription/list`, {
      userId: profile.id,
      status: 2, // active subscription
      page: 0,
      count: 100
    })
    handleStatusCode(res.data.code)
    return [res.data.data.subscriptions, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// this also includes pending sub (we think Pending is a weak version of active)
export const getActiveSubReq = async (refreshCb: () => void) => {
  try {
    const res = await request.get(`/user/subscription/current/detail`)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getSubDetailReq = async (
  subscriptionId: string,
  refreshCb?: () => void
) => {
  try {
    const res = await request.get(
      `/user/subscription/detail?subscriptionId=${subscriptionId}`
    )
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getPlanList = async ({
  type,
  productIds
}: {
  type?: number[]
  productIds?: number[]
}) => {
  try {
    const res = await request.post(`/user/plan/list`, {
      page: 0,
      count: 100,
      type,
      productIds
    })
    handleStatusCode(res.data.code)
    return [res.data.data.plans, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getActiveSubWithMore = async (
  productId: number,
  refreshCb: () => void
) => {
  const [[subscriptions, errSubDetail], [plans, errPlanList]] =
    await Promise.all([
      getActiveSub(),
      getPlanList({ productIds: [productId] })
    ])
  const err = errSubDetail || errPlanList
  if (null != err) {
    if (err instanceof ExpiredError) {
      updateSessionCb(refreshCb)
    }
    return [null, err]
  }
  return [{ subscriptions, plans }, null]
}

type TCreateUpdatePreviewReq = {
  planId: number
  addons: { quantity: number; addonPlanId: number }[]
  subscriptionId: string | null
  discountCode?: string
  applyPromoCredit?: boolean
  applyPromoCreditAmount?: number
}
// update preview
export const createUpdatePreviewReq = async ({
  planId,
  addons,
  subscriptionId,
  discountCode,
  applyPromoCredit,
  applyPromoCreditAmount
}: TCreateUpdatePreviewReq) => {
  const urlPath = 'update_preview'
  const body = {
    subscriptionId,
    newPlanId: planId,
    quantity: 1,
    addonParams: addons,
    discountCode,
    applyPromoCredit,
    applyPromoCreditAmount
  }
  try {
    const res = await request.post(`/user/subscription/${urlPath}`, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TCreatePreviewReq = {
  planId: number
  addons: { quantity: number; addonPlanId: number }[]
  vatNumber: string | null
  vatCountryCode: string | null
  gatewayId: number
  refreshCb: () => void
  discountCode?: string
  applyPromoCredit?: boolean
  applyPromoCreditAmount?: number
}

// create new prview
export const createPreviewReq = async ({
  planId,
  addons,
  vatNumber,
  vatCountryCode,
  gatewayId,
  refreshCb,
  discountCode,
  applyPromoCredit,
  applyPromoCreditAmount
}: TCreatePreviewReq) => {
  const urlPath = 'create_preview'
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
    applyPromoCredit,
    applyPromoCreditAmount
  }
  try {
    const res = await request.post(`/user/subscription/${urlPath}`, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const applyDiscountPreviewReq = async (code: string, planId: number) => {
  try {
    const res = await request.post(`/user/plan/code_apply_preview`, {
      code,
      planId
    })
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TUpdateSubscriptionReq = {
  newPlanId: number
  subscriptionId: string
  addons: { quantity: number; addonPlanId: number }[]
  confirmTotalAmount: number
  confirmCurrency: string
  prorationDate: number
  discountCode?: string
  applyPromoCredit?: boolean
  applyPromoCreditAmount?: number
}
// "create_submit"
export const updateSubscriptionReq = async ({
  newPlanId,
  subscriptionId,
  addons,
  confirmTotalAmount,
  confirmCurrency,
  prorationDate,
  discountCode,
  applyPromoCredit,
  applyPromoCreditAmount
}: TUpdateSubscriptionReq) => {
  const body = {
    subscriptionId,
    newPlanId,
    quantity: 1,
    addonParams: addons,
    confirmTotalAmount,
    confirmCurrency,
    prorationDate,
    discountCode,
    applyPromoCredit,
    applyPromoCreditAmount
  }
  try {
    const res = await request.post(`/user/subscription/update_submit`, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TCreateSubscriptionReq = {
  planId: number
  addons: { quantity: number; addonPlanId: number }[]
  confirmTotalAmount: number
  confirmCurrency: string
  vatCountryCode: string
  vatNumber: string
  gatewayId: number
  discountCode?: string
  applyPromoCredit?: boolean
  applyPromoCreditAmount?: number
}
export const createSubscriptionReq = async ({
  planId,
  addons,
  confirmTotalAmount,
  confirmCurrency,
  vatCountryCode,
  vatNumber,
  gatewayId,
  discountCode,
  applyPromoCredit,
  applyPromoCreditAmount
}: TCreateSubscriptionReq) => {
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
    applyPromoCredit,
    applyPromoCreditAmount
  }
  try {
    const res = await request.post(`/user/subscription/create_submit`, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

/*
export const getSubTimelineReq = async ({page, count}: {page: number, count: number}) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.get(`/user/subscription/onetime_addon_list?page=${page}&count=${count}`)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
*/

export const getSubHistoryReq = async ({
  page,
  count
}: {
  page: number
  count: number
}) => {
  try {
    const res = await request.get(
      `/user/subscription/timeline_list?page=${page}&count=${count}`
    )
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// one-time payment history
export const getOnetimePaymentHistoryReq = async ({
  page,
  count
}: {
  page: number
  count: number
}) => {
  try {
    const res = await request.get(
      `/user/payment/item/list?page=${page}&count=${count}`
    )
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// mark wire transfer as complete
export const markWireCompleteReq = async (subscriptionId: string) => {
  try {
    const res = await request.post(
      `/user/subscription/mark_wire_transfer_paid`,
      { subscriptionId }
    )
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// ----------
type TGetInvoicesReq = {
  page: number
  count: number
  currency?: string
  status?: number[]
  amountStart?: number
  amountEnd?: number
}
export const getInvoiceListReq = async (
  body: TGetInvoicesReq,
  refreshCb?: () => void
) => {
  try {
    const res = await request.post(`/user/invoice/list`, body)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getInvoiceDetailReq = async (
  invoiceId: string,
  refreshCb: () => void
) => {
  try {
    const res = await request.get(`/user/invoice/detail?invoiceId=${invoiceId}`)
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.invoice, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const downloadInvoice = (url: string) => {
  if (url == null || url == '') {
    return
  }
  axios({
    url,
    method: 'GET',
    responseType: 'blob'
  }).then((response) => {
    const href = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = href
    link.setAttribute('download', 'invoice.pdf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  })
}

export const vatNumberCheckReq = async (vatNumber: string) => {
  const body = { vatNumber }
  try {
    const res = await request.post(`/user/vat/vat_number_validate`, body)
    handleStatusCode(res.data.code)
    return [res.data.data.vatNumberValidate, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getPaymentListReq = async (
  { page, count }: { page: number; count: number },
  refreshCb: () => void
) => {
  try {
    const res = await request.get(
      `/user/payment/payment_timeline_list?page=${page}&count=${count}`
    )
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// check payment result
export const checkPaymentReq = async (subscriptionId: string) => {
  const body = { subscriptionId }
  try {
    const res = await request.post(`/user/subscription/pay_check`, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// check one-time addon payment result
export const checkOnetimePaymentReq = async (paymentId: string) => {
  try {
    const res = await request.get(`/user/payment/detail?paymentId=${paymentId}`)
    handleStatusCode(res.data.code)
    return [res.data.data.paymentDetail, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const checkSessionReq = async (sessionId: string) => {
  const body = { session: sessionId }
  try {
    const res = await request.post(`/user/auth/session_login`, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const terminateOrResumeSubReq = async ({
  subscriptionId,
  action
}: {
  subscriptionId: string
  action: 'CANCEL' | 'UN-CANCEL'
}) => {
  let URL = `/user/subscription/`
  URL +=
    action == 'CANCEL'
      ? 'cancel_at_period_end'
      : 'cancel_last_cancel_at_period_end'
  const body = {
    subscriptionId
  }
  try {
    const res = await request.post(URL, body)
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// new user has choosen a sub plan, but not paid yet, befoer the payment due date, user can still cancel it.
// this fn is for this purpose only, it's not the same as terminate an active sub (which is the above terminateOrResumeSubReq's job).
export const cancelSubReq = async (subscriptionId: string) => {
  try {
    const res = await request.post(`/user/subscription/cancel`, {
      subscriptionId
    })
    handleStatusCode(res.data.code)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getCountryList = async () => {
  try {
    const res = await request.post(`/user/vat/country_list`, {})
    handleStatusCode(res.data.code)
    return [res.data.data.vatCountryList, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getPaymentMethodListReq = async (refreshCb: () => void) => {
  try {
    const res = await request.get(
      `/user/payment/method_list?gatewayId=${stripeGatewayId}`
    )
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.methodList, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const addPaymentMethodReq = async ({
  currency,
  redirectUrl
}: {
  currency?: string
  subscriptionId?: string
  redirectUrl: string
}) => {
  const body = { currency, redirectUrl, gatewayId: stripeGatewayId }
  try {
    const res = await request.post('/user/payment/method_new', body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const removePaymentMethodReq = async ({
  paymentMethodId
}: {
  paymentMethodId: string
}) => {
  const body = { gatewayId: stripeGatewayId, paymentMethodId }
  try {
    const res = await request.post('/user/payment/method_delete', body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// change the current subscription's payment method
export const changePaymentMethodReq = async ({
  paymentMethodId,
  subscriptionId
}: {
  paymentMethodId: string
  subscriptionId: string
}) => {
  const body = { paymentMethodId, subscriptionId, gatewayId: stripeGatewayId }
  try {
    const res = await request.post('/user/subscription/change_gateway', body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// globally change payment method, applies to all current and future subscription
//https://api.unibee.top/
export const changeGlobalPaymentMethodReq = async ({
  paymentMethodId
}: {
  paymentMethodId: string
}) => {
  const body = { paymentMethodId, gatewayId: stripeGatewayId }
  try {
    const res = await request.post('/user/change_gateway', body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// one-time-payment for addon, but the payment has nothing to do with subscription
export const onetimePaymentReq = async ({
  gatewayId,
  planId,
  quantity,
  returnUrl
}: {
  gatewayId: number
  planId: number
  quantity: number
  returnUrl: string
}) => {
  const body = { gatewayId, planId, quantity, returnUrl }
  try {
    const res = await request.post(`/user/payment/new`, body)
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// similar to onetimePaymentReq, but it's linked to subscription.
// user can see a list of addon purchase with current subscription.
type TAddonPayment = {
  addonId: number // addon is technically the same as plan, so this is planId
  quantity: number
  returnUrl: string
  subscriptionId: string
}
export const addonPaymentReq = async (body: TAddonPayment) => {
  try {
    const res = await request.post(
      `/user/subscription/new_onetime_addon_payment`,
      body
    )
    handleStatusCode(res.data.code)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const onetimepaymentListReq = async (
  subscriptionId: string,
  refreshCb: () => void
) => {
  try {
    const res = await request.get(
      `/user/subscription/onetime_addon_list?subscriptionId=${subscriptionId}`
    )
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data.subscriptionOnetimeAddons, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getProductListReq = async (refreshCb?: () => void) => {
  try {
    const res = await request.post(`/user/product/list`, {
      count: 50,
      page: 0
    })
    handleStatusCode(res.data.code, refreshCb)
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getProductsWithMoreReq = async (refreshCb: () => void) => {
  const [[products, errProducts], [subscriptions, subErr]] = await Promise.all([
    getProductListReq(),
    getSublistReq()
  ])
  const err = errProducts || subErr
  if (null != err) {
    if (err instanceof ExpiredError) {
      updateSessionCb(refreshCb)
    }
    return [null, err]
  }
  return [{ products, subscriptions }, null]
}
