import { Currency } from 'dinero.js';

interface IProfile {
  address: string;
  countryName: string;
  countryCode: string;
  companyName: string;
  email: string;
  facebook: string;
  firstName: string;
  lastName: string;
  id: number | null;
  phone: string;
  paymentMethod: string;
  linkedIn: string;
  telegram: string;
  tikTok: string;
  vATNumber: string;
  weChat: string;
  whatsAPP: string;
  otherSocialInfo: string;
  token: string;
}

type TMerchantInfo = {
  id: number;
  address: string;
  companyId: string;
  companyLogo: string;
  companyName: string;
  host: string;
  email: string;
  location: string;
  phone: string;
};

interface IAppConfig {
  env: string;
  isProd: boolean;
  supportTimeZone: string[];
  supportCurrency: { Currency: string; Symbol: string; Scale: number }[];
  gateway: {
    gatewayId: number;
    gatewayName: string;
    gatewayLogo: string;
    gatewayType: number;
  }[];
}

type Country = {
  code: string;
  name: string;
};

interface IAddon extends IPlan {
  quantity: number | null;
  checked: boolean;
}

interface IPlan {
  id: number;
  planName: string;
  description: string;
  type: number; // 1: main plan, 2: add-on
  currency: Currency;
  intervalCount: number;
  intervalUnit: string;
  amount: number;
  status: number;
  addons?: IAddon[];
  onetimeAddons?: IAddon[];
}

interface ISubAddon extends IPlan {
  // when update subscription plan, I need to know which addons users have selected,
  // then apply them on the plan
  quantity: number;
  addonPlanId: number;
}

interface ISubscription {
  id: number;
  subscriptionId: string;
  planId: number;
  userId: number;
  status: number;
  link: string | undefined;
  // gatewayId: number;
  firstPaidTime: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  defaultPaymentMethodId: string;
  trialEnd: number;
  cancelAtPeriodEnd: number; // whether this sub will end at the end of billing cycle, 0: false, 1: true
  amount: number;
  currency: string;
  taxScale: number; // 20000 means 20%
  plan: IPlan;
  addons: ISubAddon[];
  user: IProfile | null;
  unfinishedSubscriptionPendingUpdate?: {
    // downgrading will be effective on the next cycle, this props show this pending stat
    effectImmediate: number;
    effectTime: number;
    prorationAmount: number; // for plan upgrading, you need to pay the difference amt.
    paid: number; // 1: paid,
    link: string; // stripe payment link
    plan: IPlan; // original plan
    updatePlan: IPlan; // plan after change(upgrade/downgrade, or quantity change)
    // these are pending subscription's actual data
    updateAmount: number;
    updateCurrency: string;
    updateAddons: ISubAddon[];
  };
}

type InvoiceItem = {
  amount: number;
  amountExcludingTax: number;
  currency: string;
  description: string;
  periodEnd?: number;
  periodStart?: number;
  proration?: boolean;
  quantity: number;
  tax: number; // tax amount
  taxScale: number; // tax rate
  unitAmountExcludingTax: number;
};

type InvoiceItemTotal = {
  currency: string;
  subscriptionAmount: number;
  subscriptionAmountExcludingTax: number;
  taxAmount: number;
  totalAmount: number;
  totalAmountExcludingTax: number;
  lines: InvoiceItem[];
};

interface IPreview {
  totalAmount: number; // these 3 fields need to be resent to backend when submitting createSub/updateSub
  prorationDate?: number; // ditto
  currency: string; // ditto
  vatCountryCode?: string;
  vatCountryName?: string;
  vatNumber?: string;
  vatNumberValidate?: {
    valid: boolean;
    vatNumber: string;
    countryCode: string;
    companyName: string;
    companyAddress: string;
    validateMessage: string;
  };
  invoice: InvoiceItemTotal;
  nextPeriodInvoice?: InvoiceItemTotal; // same as above invoice obj, only optional, used when downgrading.
}

export class ExpiredError extends Error {
  constructor(m: string) {
    super(m);
  }
}

export type {
  Country,
  IAppConfig,
  IPlan,
  IPreview,
  IProfile,
  ISubscription,
  InvoiceItemTotal,
  TMerchantInfo,
};
