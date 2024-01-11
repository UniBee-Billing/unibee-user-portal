export const CURRENCY: {
  [key: string]: { symbol: string; stripe_factor: number };
} = {
  // what about PayPal
  CNY: { symbol: "¥", stripe_factor: 100 },
  USD: { symbol: "$", stripe_factor: 100 },
  JPY: { symbol: "¥", stripe_factor: 1 },
};
