import { StoreApi, UseBoundStore, create } from 'zustand';
// import { immer } from "zustand/middleware/immer";
import { createJSONStorage, persist } from 'zustand/middleware';
import { IAppConfig, IProfile, TMerchantInfo } from '../shared.types';
// import { createStore } from "zustand";

const INITIAL_PROFILE: IProfile = {
  address: '',
  companyName: '',
  email: '',
  facebook: '',
  firstName: '',
  lastName: '',
  countryCode: '',
  countryName: '',
  id: 0,
  phone: '',
  paymentMethod: '',
  linkedIn: '',
  telegram: '',
  tikTok: '',
  vATNumber: '',
  weChat: '',
  whatsAPP: '',
  otherSocialInfo: '',
  token: '',
};

interface ProfileSlice extends IProfile {
  getProfile: () => IProfile;
  setProfile: (p: IProfile) => void;
  // setProfileField: (field: string, value: any) => void;
}

export const useProfileStore = create<ProfileSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_PROFILE,
      getProfile: () => get(),
      setProfile: (p) => set({ ...p }),
    }),
    { name: 'profile' },
  ),
);

// -----------------------------------

const INITIAL_INFO: TMerchantInfo = {
  id: -1,
  address: '',
  companyId: '',
  companyLogo: '',
  companyName: '',
  host: '',
  email: '',
  location: '',
  phone: '',
};

interface MerchantInfoSlice extends TMerchantInfo {
  getMerchantInfo: () => TMerchantInfo;
  setMerchantInfo: (p: TMerchantInfo) => void;
}

export const useMerchantInfoStore = create<MerchantInfoSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_INFO,
      getMerchantInfo: () => get(),
      setMerchantInfo: (p) => set({ ...p }),
    }),
    { name: 'merchantInfo' },
  ),
);

// --------------------------------
const INITIAL_APP_VALUE: IAppConfig = {
  env: 'local',
  isProd: false,
  supportCurrency: [],
  supportTimeZone: [],
  gateway: [],
};

interface AppConfigSlice extends IAppConfig {
  getAppConfig: () => IAppConfig;
  setAppConfig: (a: IAppConfig) => void;
  setGateway: (g: any) => void;
}

export const useAppConfigStore = create<AppConfigSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_APP_VALUE,
      getAppConfig: () => get(),
      setAppConfig: (a) => set({ ...a }),
      setGateway: (g: any) => {
        set({ ...get(), gateway: g });
      },
    }),
    { name: 'appConfig' },
  ),
);

// ---------------
interface ISession {
  expired: boolean;
  refresh: null | (() => void); // if session is expired when making an async fn call, save this fn here, so after re-login, re-run this fn
}
const INITIAL_SESSION: ISession = {
  expired: true,
  refresh: null,
};
interface SessionStoreSlice extends ISession {
  getSession: () => ISession;
  setSession: (s: ISession) => void;
}

export const useSessionStore = create<SessionStoreSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_SESSION,
      getSession: () => get(),
      setSession: (a) => set({ ...a }),
    }),
    { name: 'session' },
  ),
);
