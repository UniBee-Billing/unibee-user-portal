import { useAppConfigStore } from '@/stores'
import dayjs from 'dayjs'
import Dinero, { Currency } from 'dinero.js'
import passwordValidator from 'password-validator'
import { IPlan, PlanType, UserInvoice } from '../shared.types'

export const passwordSchema = new passwordValidator()
passwordSchema
  .is()
  .min(8) // Minimum length 8
  .is()
  .max(30) // Maximum length 30
  .has()
  .uppercase() // Must have uppercase letters
  .has()
  .lowercase() // Must have lowercase letters
  .has()
  .digits(1) // Must have at least 1 digits
  .has()
  .not()
  .spaces() // Should not have spaces
  .is()
  .symbols(1) // should have special characters

export const showAmount = (
  amount: number | undefined,
  currency: string | undefined,
  ignoreFactor?: boolean
): string => {
  if (amount == undefined || currency == undefined) {
    return ''
  }
  const isNegative = amount < 0
  if (isNegative) {
    amount *= -1
  }

  const CURRENCIES = useAppConfigStore.getState().supportCurrency
  const c = CURRENCIES.find((c) => c.Currency == currency)
  if (c == undefined) {
    return ''
  }
  return `${isNegative ? '-' : ''}${c.Symbol}${amount / (ignoreFactor ? 1 : c.Scale)}`
}

export const ramdonString = (length: number | null) => {
  if (length == null || length <= 0) {
    length = 8
  }
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
  const charLength = chars.length
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charLength))
  }
  return result
}

export const daysBetweenDate = (
  start: string | number, // string: '2022-03-15', number: millisecond since Epoch
  end: string | number
) => {
  const d1 = new Date(start).getTime(),
    d2 = new Date(end).getTime()
  return Math.ceil(Math.abs((d1 - d2) / (1000 * 60 * 60 * 24)))
}

export const formatDate = (d: number, showTime?: boolean) => {
  const timeFormat = showTime ? ' HH:mm:ss' : ''
  const result = dayjs(d * 1000)
  return result.year() == dayjs().year()
    ? result.format(`MMM-DD ${timeFormat}`)
    : result.format(`YYYY-MMM-DD ${timeFormat}`)
}

export const formatPlanPrice = (plan: IPlan) => {
  const amount = Dinero({
    amount: plan.amount,
    currency: plan.currency
  }).toFormat('$0,0.00')
  if (plan.type == PlanType.MAIN || plan.type == PlanType.ADD_ON) {
    const itv = `/${plan.intervalCount == 1 ? '' : plan.intervalCount} ${plan.intervalUnit}`
    return `${amount}${itv}`
  } else {
    return amount
  }
}

export const emailValidate = (email: string) =>
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )

export const normalizeAmt = (iv: UserInvoice[]) => {
  iv.forEach((v) => {
    const c = v.currency
    const CURRENCIES = useAppConfigStore.getState().currency
    const f = CURRENCIES[c as Currency]!.Scale
    v.subscriptionAmount /= f
    v.subscriptionAmountExcludingTax /= f
    v.taxAmount /= f
    v.totalAmount /= f
    v.totalAmountExcludingTax /= f
    if (v.refund != null) {
      v.refund.refundAmount /= f
    }
    if (v.discountAmount != null) {
      v.discountAmount /= f
    }
    if (v.originAmount != null) {
      v.originAmount /= f
    }
    v.lines?.forEach((l) => {
      ;(l.amount as number) /= f
      ;(l.amountExcludingTax as number) /= f
      ;(l.tax as number) /= f
      ;(l.unitAmountExcludingTax as number) /= f
      if (l.originAmount != null) {
        l.originAmount /= f
      }
      if (l.discountAmount != null) {
        l.discountAmount /= f
      }
    })
  })
}
