import { CURRENCY } from "../constants";

export const showAmount = (
  amount: number,
  currency: keyof typeof CURRENCY
): string => {
  const c = CURRENCY[currency];
  return `${c.symbol}${amount / c.stripe_factor}`;
};
