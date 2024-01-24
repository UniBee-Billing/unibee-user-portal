import { StoreApi, UseBoundStore } from "zustand";
import { create } from "zustand";
// import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import { IProfile } from "../shared.types";
// import { createStore } from "zustand";

const INITIAL_PROFILE: IProfile = {
  address: "",
  companyName: "",
  email: "",
  facebook: "",
  firstName: "",
  lastName: "",
  countryCode: "",
  countryName: "",
  id: 0,
  phone: "",
  paymentMethod: "",
  linkedIn: "",
  telegram: "",
  tikTok: "",
  vATNumber: "",
  weChat: "",
  whatsAPP: "",
  otherSocialInfo: "",
  token: "",
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
    { name: "profile" }
  )
);
