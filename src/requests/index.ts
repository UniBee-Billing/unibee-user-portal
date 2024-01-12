import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useProfileStore } from "../stores";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

export const getActiveSub = async () => {
  const profile = useProfileStore.getState();
  console.log("profile from store: ", profile);
  return await axios.post(
    `${API_URL}/user/subscription/subscription_list`,
    {
      merchantId: 15621,
      userId: profile.id,
      status: 2, // active subscription
      page: 0,
      count: 100,
    },
    {
      headers: {
        Authorization: `${profile.token}`, // Bearer: ******
      },
    }
  );
};

export const getPlanList = async () => {
  // pass page/count as params
  const profile = useProfileStore.getState();
  return await axios.post(
    `${API_URL}/user/plan/subscription_plan_list`,
    {
      merchantId: 15621,
      page: 0,
      count: 100,
    },
    {
      headers: {
        Authorization: `${profile.token}`, // Bearer: ******
      },
    }
  );
};

export const createPreviewReq = async (
  isNew: boolean,
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  subscriptionId: string | null
) => {
  // isNew: true: create new subscription, false: update existing sub
  const profile = useProfileStore.getState();
  const urlPath = isNew
    ? "subscription_create_preview"
    : "subscription_update_preview";

  const body = {
    subscriptionId,
    UserId: profile.id,
    channelId: 25,
    planId,
    newPlanId: planId,
    quantity: 1,
    addonParams: addons,
  };
  return await axios.post(`${API_URL}/user/subscription/${urlPath}`, body, {
    headers: {
      Authorization: `${profile.token}`, // Bearer: ******
    },
  });
};

export const updateSubscription = async (
  newPlanId: number,
  subscriptionId: string,
  addons: { quantity: number; addonPlanId: number }[],
  confirmTotalAmount: number,
  confirmCurrency: string,
  prorationDate: number
) => {
  const profile = useProfileStore.getState();
  // "subscription_create_submit"
  const body = {
    subscriptionId,
    newPlanId,
    quantity: 1,
    addonParams: addons,
    confirmTotalAmount,
    confirmCurrency,
    prorationDate,
  };
  return await axios.post(
    `${API_URL}/user/subscription/subscription_update_submit`,
    body,
    {
      headers: {
        Authorization: `${profile.token}`, // Bearer: ******
      },
    }
  );
};

export const createSubscription = async (
  planId: number,
  addons: { quantity: number; addonPlanId: number }[],
  confirmTotalAmount: number,
  confirmCurrency: string
) => {
  const profile = useProfileStore.getState();
  const body = {
    planId,
    quantity: 1,
    channelId: 25,
    UserId: profile.id,
    addonParams: addons,
    confirmTotalAmount,
    confirmCurrency,
    returnUrl: `${window.location.origin}/payment-result`, // .origin doesn't work on IE
  };
  return await axios.post(
    `${API_URL}/user/subscription/subscription_create_submit`,
    body,
    {
      headers: {
        Authorization: `${profile.token}`, // Bearer: ******
      },
    }
  );
};

export const terminateSub = async (SubscriptionId: string) => {
  const profile = useProfileStore.getState();
  const body = {
    SubscriptionId,
  };
  return await axios.post(
    `${API_URL}/user/subscription/subscription_cancel_at_period_end`,
    body,
    {
      headers: {
        Authorization: `${profile.token}`, // Bearer: ******
      },
    }
  );
};
