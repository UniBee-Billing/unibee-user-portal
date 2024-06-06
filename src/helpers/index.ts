import dayjs from 'dayjs';
import passwordValidator from 'password-validator';
import { CURRENCY } from '../constants';
import { UserInvoice } from '../shared.types';

export const passwordSchema = new passwordValidator();
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
  .symbols(1); // should have special characters

export const showAmount = (
  amount: number,
  currency: keyof typeof CURRENCY,
  ignoreFactor?: boolean,
): string => {
  const isNegative = amount < 0;
  if (isNegative) {
    amount *= -1;
  }
  const c = CURRENCY[currency];
  return `${isNegative ? '-' : ''}${c.symbol}${amount / (ignoreFactor ? 1 : c.stripe_factor)}`;
};

export const ramdonString = (length: number | null) => {
  if (length == null || length <= 0) {
    length = 8;
  }
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  const charLength = chars.length;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return result;
};

export const timerBySec = (numSeconds: number, cb: (v: number) => void) => {
  let lastTime = new Date().getTime();
  (function timer() {
    const req = window.requestAnimationFrame(timer);
    const currentTime = new Date().getTime();

    if (currentTime - lastTime >= 1000) {
      lastTime = currentTime;
      numSeconds--;
      console.log('num sec: ', numSeconds);
      cb(numSeconds);
      if (numSeconds == 0) {
        cancelAnimationFrame(req);
      }
    }
  })();
};

export const daysBetweenDate = (
  start: string | number, // string: '2022-03-15', number: millisecond since Epoch
  end: string | number,
) => {
  const d1 = new Date(start).getTime(),
    d2 = new Date(end).getTime();
  return Math.ceil(Math.abs((d1 - d2) / (1000 * 60 * 60 * 24)));
};

export const formatDate = (d: number, showTime?: boolean) => {
  const timeFormat = showTime ? ' HH:mm:ss' : '';
  const result = dayjs(d * 1000);
  return result.year() == dayjs().year()
    ? result.format(`MMM-DD ${timeFormat}`)
    : result.format(`YYYY-MMM-DD ${timeFormat}`);
};

export const emailValidate = (email: string) =>
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );

export const normalizeAmt = (iv: UserInvoice[]) => {
  iv.forEach((v) => {
    const c = v.currency;
    const f = CURRENCY[c].stripe_factor;
    v.subscriptionAmount /= f;
    v.subscriptionAmountExcludingTax /= f;
    v.taxAmount /= f;
    v.totalAmount /= f;
    v.totalAmountExcludingTax /= f;
    if (v.refund != null) {
      v.refund.refundAmount /= f;
    }
    if (v.discountAmount != null) {
      v.discountAmount /= f;
    }
    if (v.originAmount != null) {
      v.originAmount /= f;
    }
    v.lines &&
      v.lines.forEach((l) => {
        (l.amount as number) /= f;
        (l.amountExcludingTax as number) /= f;
        (l.tax as number) /= f;
        (l.unitAmountExcludingTax as number) /= f;
        if (l.originAmount != null) {
          l.originAmount /= f;
        }
        if (l.discountAmount != null) {
          l.discountAmount /= f;
        }
      });
  });
};
