interface IProfile {
  address: string;
  countryName: string;
  countryCode: string;
  companyName: string;
  email: string;
  facebook: string;
  firstName: string;
  lastName: string;
  id: number;
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
  currency: number;
  intervalCount: number;
  intervalUnit: string;
  amount: number;
  status: number;
  addons?: IAddon[];
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
  // channelId: number;
  firstPayTime: Date;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  trailEnd: number;
  cancelAtPeriodEnd: number; // whether this sub will end at the end of billing cycle, 0: false, 1: true
  amount: number;
  currency: string;
  plan: IPlan;
  addons: ISubAddon[];
  user: IProfile | null;
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
  totalAmount: number;
  prorationDate?: number;
  currency: string;
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

export type {
  IProfile,
  IPlan,
  ISubscription,
  InvoiceItemTotal,
  IPreview,
  Country,
};
