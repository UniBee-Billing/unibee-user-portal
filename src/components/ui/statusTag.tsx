import { Tag } from 'antd'
import React, { ReactElement } from 'react'
import {
  DISCOUNT_CODE_STATUS,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  SUBSCRIPTION_HISTORY_STATUS,
  SUBSCRIPTION_STATUS
} from '../../constants'

const SUB_STATUS: { [key: number]: ReactElement } = {
  1: <Tag color="magenta">{SUBSCRIPTION_STATUS[1]}</Tag>, // 1: pending
  2: <Tag color="#87d068">{SUBSCRIPTION_STATUS[2]}</Tag>, // 2: active
  4: <Tag color="purple">{SUBSCRIPTION_STATUS[4]}</Tag>, // 4: cancelled
  5: <Tag color="red">{SUBSCRIPTION_STATUS[5]}</Tag>, // 5: expired
  7: <Tag color="cyan">{SUBSCRIPTION_STATUS[7]}</Tag>, // 7: Incomplete
  8: <Tag color="blue">{SUBSCRIPTION_STATUS[8]}</Tag>, // 8: Incomplete
  9: <Tag color="#b71c1c">{SUBSCRIPTION_STATUS[9]}</Tag> // 9: failed
}
const SubscriptionStatus = (statusId: number) => SUB_STATUS[statusId]

const SUB_HISTORY_STATUS: { [key: number]: ReactElement } = {
  1: <Tag color="#87d068">{SUBSCRIPTION_HISTORY_STATUS[1]}</Tag>, // 1: active
  2: <Tag color="blue">{SUBSCRIPTION_HISTORY_STATUS[2]}</Tag>, // 2: finished
  3: <Tag color="purple">{SUBSCRIPTION_HISTORY_STATUS[3]}</Tag>, // 3: cancelled
  4: <Tag color="red">{SUBSCRIPTION_HISTORY_STATUS[4]}</Tag> // 4: expired
}
const SubHistoryStatus = (statusId: number) => SUB_HISTORY_STATUS[statusId]

const IV_STATUS: { [key: number]: ReactElement } = {
  0: <span>Initiating</span>, // this status only exist for a very short period, users/admin won't even know it exist
  1: <Tag color="magenta">{INVOICE_STATUS[1]}</Tag>, // 1: pending
  2: <Tag color="blue">{INVOICE_STATUS[2]}</Tag>, // 2: processing
  3: <Tag color="#87d068">{INVOICE_STATUS[3]}</Tag>, // 3: paid
  4: <Tag color="red">{INVOICE_STATUS[4]}</Tag>, // 4: failed
  5: <Tag color="purple">{INVOICE_STATUS[5]}</Tag> // 5: cancellled
}
const InvoiceStatus = (statusId: number, isRefund?: boolean) =>
  statusId == 3 && isRefund ? ( // status == 3 means invoice Paid, for refund invoice, description should be Refunded
    <Tag color="#87d068">Refunded</Tag>
  ) : (
    IV_STATUS[statusId]
  )

const PAYMENT_STATUS_TAG: { [key: number]: ReactElement } = {
  0: <Tag color="blue">{PAYMENT_STATUS[0]}</Tag>, // pending
  1: <Tag color="#87d068">{PAYMENT_STATUS[1]}</Tag>, // succeeded
  2: <Tag color="purple">{PAYMENT_STATUS[2]}</Tag> // failed
}
const PaymentStatus = (statusId: number) => PAYMENT_STATUS_TAG[statusId]

const DISCOUNT_CODE_STATUS_TAG: { [key: number]: ReactElement } = {
  1: <Tag color="blue">{DISCOUNT_CODE_STATUS[1]}</Tag>,
  2: <Tag color="#87d068">{DISCOUNT_CODE_STATUS[2]}</Tag>,
  3: <Tag color="purple">{DISCOUNT_CODE_STATUS[3]}</Tag>,
  4: <Tag color="red">{DISCOUNT_CODE_STATUS[4]}</Tag>
}
const DiscountCodeStatus = (statusId: number) =>
  DISCOUNT_CODE_STATUS_TAG[statusId]

const getDiscountCodeStatusTagById = (statusId: number) =>
  DISCOUNT_CODE_STATUS_TAG[statusId]

export {
  DiscountCodeStatus,
  getDiscountCodeStatusTagById,
  InvoiceStatus,
  PaymentStatus,
  SubHistoryStatus,
  SubscriptionStatus,
  getDiscountCodeStatusTagById
}
