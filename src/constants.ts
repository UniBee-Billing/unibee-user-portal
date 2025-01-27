export const CURRENCY: {
  [key: string]: { symbol: string; stripe_factor: number }
} = {
  // what about PayPal
  CNY: { symbol: '¥', stripe_factor: 100 },
  USD: { symbol: '$', stripe_factor: 100 },
  JPY: { symbol: '¥', stripe_factor: 1 },
  RUB: { symbol: '₽', stripe_factor: 100 },
  EUR: { symbol: '€', stripe_factor: 100 },
  USDT: { symbol: '₮', stripe_factor: 100 }
}

export const REFUND_STATUS: { [key: number]: string } = {
  10: 'Pending',
  20: 'Succeeded',
  30: 'Failed',
  40: 'Cancelled'
}

export const SUBSCRIPTION_STATUS: { [key: number]: string } = {
  0: 'Initiating', // used when creating the sub, it only exist for a very short time, user might not realize it exists
  1: 'Pending', // when sub is created, but user hasn't paid yet,
  2: 'Active', // user paid the sub fee
  // 3: "Suspended", // suspend: not used yet. For future implementation: users might want to suspend the sub for a period of time, during which, they don't need to pay
  3: 'PendingInActive', // when status is transitioning from 1 to 2, or 2 to 4, there is a pending status, transition is not synchronous,
  // coz payment is not synchronous, so we have to wait, in status 3: no action can be taken on UI.
  4: 'Cancelled', // users(or admin) cancelled the sub(immediately or automatically at the end of billing cycle). It's triggered by human.
  5: 'Expired', // sub ended.
  6: 'Suspended', // suspend for a while, might want to resume later. Not yet used.
  7: 'Incomplete', // you claimed you've finished the payment, and want to use our service immiedately.
  8: 'Processing', // you claimed you've finished the payment, but admin need to verify it.
  9: 'Failed'
}

export const SUBSCRIPTION_HISTORY_STATUS: { [key: number]: string } = {
  1: 'Active',
  2: 'Finished',
  3: 'Cancelled',
  4: 'Expired'
}

export const INVOICE_STATUS: { [key: number]: string } = {
  0: 'Initiating', // this status only exist for a very short period, users/admin won't even know it exist
  1: 'Draft', // admin manually create an invoice, ready for edit, but not published yet, users won't see it, won't receive email.
  // this is user portal, so user won't see this status
  2: 'Awaiting payment', // admin has published the invoice, user will receive a mail with payment link. Admin can revoke the invoice if user hasn't made the payment.
  3: 'Paid', // user paid the invoice
  4: 'Failed', // user not pay the invoice before it get expired
  5: 'Cancelled', // admin cancel the invoice after publishing, only if user hasn't paid yet. If user has paid, admin cannot cancel it.
  6: 'Reversed' // 取消后被通知支付成功的，这种情况一般是要排查的
}

export const PAYMENT_STATUS: { [key: number]: string } = {
  0: 'Pending',
  1: 'Succeeded',
  2: 'Failed'
}

export const PAYMENT_TYPE: { [key: number]: string } = {
  0: 'Payment',
  1: 'Refund'
}

export const DISCOUNT_CODE_STATUS: { [key: number]: string } = {
  1: 'Editing',
  2: 'Active',
  3: 'Inactive',
  4: 'Expired'
}

export enum PlanType {
  MainPlan = 1,
  Addon = 2,
  OnetimePayment = 3
}
