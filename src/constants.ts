import { SubscriptionStatus } from './shared.types'

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

export const SUBSCRIPTION_STATUS: Record<
  SubscriptionStatus,
  { label: string; color: string }
> = {
  [SubscriptionStatus.PENDING]: { label: 'Pending', color: 'magenta' },
  [SubscriptionStatus.ACTIVE]: { label: 'Active', color: '#87d068' },
  [SubscriptionStatus.CANCELLED]: { label: 'Cancelled', color: 'purple' },
  [SubscriptionStatus.EXPIRED]: { label: 'Expired', color: 'red' },
  [SubscriptionStatus.INCOMPLETE]: { label: 'Incomplete', color: 'cyan' },
  [SubscriptionStatus.PROCESSING]: { label: 'Processing', color: 'blue' },
  [SubscriptionStatus.FAILED]: { label: 'Failed', color: '#b71c1c' }
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
