import { create } from 'zustand'
// import { immer } from "zustand/middleware/immer";
import { persist } from 'zustand/middleware'
import { IAppConfig, IProfile, TGateway, TMerchantInfo } from '../shared.types'
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
  id: null,
  externalUserId: '',
  phone: '',
  paymentMethod: '',
  linkedIn: '',
  telegram: '',
  tikTok: '',
  vATNumber: '',
  registrationNumber: '',
  weChat: '',
  whatsAPP: '',
  otherSocialInfo: '',
  token: '',
  type: 1,
  language: 'en'
}

interface ProfileSlice extends IProfile {
  getProfile: () => IProfile
  setProfile: (p: IProfile) => void
  reset: () => void
  // setProfileField: (field: string, value: any) => void;
}

export const useProfileStore = create<ProfileSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_PROFILE,
      getProfile: () => get(),
      setProfile: (p) => set({ ...p }),
      reset: () => set(INITIAL_PROFILE)
    }),
    { name: 'profile' }
  )
)

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
  phone: ''
}

interface MerchantInfoSlice extends TMerchantInfo {
  getMerchantInfo: () => TMerchantInfo
  setMerchantInfo: (p: TMerchantInfo) => void
  reset: () => void
}

export const useMerchantInfoStore = create<MerchantInfoSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_INFO,
      getMerchantInfo: () => get(),
      setMerchantInfo: (p) => set({ ...p }),
      reset: () => set(INITIAL_INFO)
    }),
    { name: 'merchantInfo' }
  )
)

// --------------------------------
const INITIAL_APP_VALUE: IAppConfig = {
  env: 'local',
  isProd: false,
  supportCurrency: [],
  supportTimeZone: [],
  gateway: []
}

interface AppConfigSlice extends IAppConfig {
  getAppConfig: () => IAppConfig
  setAppConfig: (a: IAppConfig) => void
  setGateway: (g: TGateway[]) => void
  reset: () => void
}

export const useAppConfigStore = create<AppConfigSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_APP_VALUE,
      getAppConfig: () => get(),
      setAppConfig: (a) => set({ ...a }),
      setGateway: (g: TGateway[]) => {
        set({ ...get(), gateway: g })
      },
      reset: () => set(INITIAL_APP_VALUE)
    }),
    { name: 'appConfig' }
  )
)

// ---------------
interface ISession {
  expired: boolean
  // you are at /my-account, then logout, you are now at /login, if you click GO-BACK button in browser,
  // you'll go to /my-account, but there'll be many "session expired" error, page structure is there, only content is blank
  // redirectToLogin is to force you to be at /login if you have logged out.
  redirectToLogin?: boolean
  refresh: null | (() => void) // if session is expired when making an async fn call, save this fn here, so after re-login, re-run this fn
}
const INITIAL_SESSION: ISession = {
  expired: true,
  redirectToLogin: false,
  refresh: null
}
interface SessionStoreSlice extends ISession {
  getSession: () => ISession
  setSession: (s: ISession) => void
  reset: () => void
}

export const useSessionStore = create<SessionStoreSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_SESSION,
      getSession: () => get(),
      setSession: (a) => set({ ...a }),
      reset: () => set(INITIAL_SESSION)
    }),
    { name: 'session' }
  )
)
