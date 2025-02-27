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

export const useProfileStore = create<ProfileSlice>()((set, get) => ({
  ...INITIAL_PROFILE,
  getProfile: () => get(),
  setProfile: (p) => set({ ...p }),
  reset: () => set(INITIAL_PROFILE)
}))

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

export const useAppConfigStore = create<AppConfigSlice>()((set, get) => ({
  ...INITIAL_APP_VALUE,
  getAppConfig: () => get(),
  setAppConfig: (a) => set({ ...a }),
  setGateway: (g: TGateway[]) => {
    set({ ...get(), gateway: g })
  },
  reset: () => set(INITIAL_APP_VALUE)
}))

// ---------------
interface ISession {
  expired: boolean
  // you are at /my-account, then logout, you are now at /login, if you click GO-BACK button in browser,
  // you'll go to /my-account, but there'll be many "session expired" error, page structure is there, only content is blank
  // redirectToLogin is to force you to be at /login if you have logged out.
  redirectToLogin?: boolean
  refreshCallbacks: (() => void)[]
}
const INITIAL_SESSION: ISession = {
  expired: false,
  redirectToLogin: false,
  refreshCallbacks: []
}
interface SessionStoreSlice extends ISession {
  getSession: () => ISession
  setSession: (s: ISession) => void
  reset: () => void
  resetCallback: () => void
}

export const useSessionStore = create<SessionStoreSlice>()((set, get) => ({
  ...INITIAL_SESSION,
  getSession: () => get(),
  setSession: (a) => set({ ...a }),
  reset: () => set(INITIAL_SESSION),
  resetCallback: () => {
    set({ ...get(), refreshCallbacks: [] })
  }
}))

// --------------------------------
interface UIConfig {
  sidebarCollapsed: boolean
}

const INITIAL_UI_CONFIG: UIConfig = {
  sidebarCollapsed: false
}

interface UIConfigSlice extends UIConfig {
  getUIConfig: () => UIConfig
  setUIConfig: (u: UIConfig) => void
  toggleSidebar: () => void
}

export const uiConfigStore = create<UIConfigSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_UI_CONFIG,
      getUIConfig: () => get(),
      setUIConfig: (a) => set({ ...a }),
      toggleSidebar: () => {
        set({ ...get(), sidebarCollapsed: !get().sidebarCollapsed })
      }
    }),
    {
      name: 'ui-config'
    }
  )
)
