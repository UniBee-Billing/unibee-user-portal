import { StoreApi, UseBoundStore } from "zustand";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { IProfile } from "../shared.types";
import { createStore } from "zustand";

const INITIAL_PROFILE: IProfile = {
  adress: "",
  country: "", // use ISO code to represent country
  companyName: "",
  email: "",
  facebook: "",
  firstName: "",
  lastName: "",
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

export const useProfileStore = create<ProfileSlice>()((set, get) => ({
  ...INITIAL_PROFILE,
  getProfile: () => get(),
  setProfile: (p) => set({ ...p }),
}));
