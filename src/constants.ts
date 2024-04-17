export const CURRENCY: {
  [key: string]: { symbol: string; stripe_factor: number };
} = {
  // what about PayPal
  CNY: { symbol: '¥', stripe_factor: 100 },
  USD: { symbol: '$', stripe_factor: 100 },
  JPY: { symbol: '¥', stripe_factor: 1 },
  EUR: { symbol: '€', stripe_factor: 100 },
};

export const SUBSCRIPTION_STATUS: { [key: number]: string } = {
  0: 'Initiating', // used when creating the sub, it only exist for a very short time, user might not realize it exists
  1: 'Pending', // when sub is created, but user hasn't paid yet,
  2: 'Active', // user paid the sub fee
  // 3: "Suspended", // suspend: not used yet. For future implementation: users might want to suspend the sub for a period of time, during which, they don't need to pay
  3: 'Pending', // when status is transitioning from 1 to 2, or 2 to 4, there is a pending status, transition is not synchronous,
  // coz payment is not synchronous, so we have to wait, in status 3: no action can be taken on UI.
  4: 'Cancelled', // users(or admin) cancelled the sub(immediately or automatically at the end of billing cycle). It's triggered by human.
  5: 'Expired', // sub ended.
  6: 'Suspended', // suspend for a while, might want to resume later
  7: 'Incomplete',
};

export const GATEWAY_TYPE: { [key: number]: string } = {
  1: 'Card',
  2: 'Crypto',
};

export const INVOICE_STATUS: { [key: number]: string } = {
  0: 'Initiating', // this status only exist for a very short period, users/admin won't even know it exist
  1: 'Pending', // admin manually create an invoice, ready for edit, but not published yet, users won't see it, won't receive email.
  // in pending, admin can also delete the invoice
  2: 'Pocessing', // admin has published the invoice, user will receive a mail with payment link. Admin can revoke the invoice if user hasn't made the payment.
  3: 'Paid', // user paid the invoice
  4: 'Failed', // user not pay the invoice before it get expired
  5: 'Cancelled', // admin cancel the invoice after publishing, only if user hasn't paid yet. If user has paid, admin cannot cancel it.
};
