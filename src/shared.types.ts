interface IProfile {
  adress: string;
  country: string; // use ISO code to represent country
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
  plan: IPlan;
  status: number;
  firstPayTime: Date;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  trailEnd: number;
  addons: ISubAddon[];
}

export type { IProfile, IPlan, ISubscription };
