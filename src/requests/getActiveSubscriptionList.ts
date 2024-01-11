import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useProfileStore } from "../stores";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

/*
function useFetchActiveSub() {
  const profile = useProfileStore.getState();
  const [cards, setCards] = useState([]);
  // const []
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchCards = async () => {
    const url = `${API_URL}/user/subscription/subscription_list`;
    const body = {
      merchantId: 15621,
      userId: profile.id,
      status: 2, // active subscription
      page: 0,
      count: 100,
    };
    const headers = { Authorization: `${profile.token}` };
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await axios.post(url, body, { headers });
      if (!response.data) {
        // setCards([]);
        throw new Error("No results returned!");
      }
      // setCards(response.data);
    } catch (err) {
      // setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cards,
    errorMessage,
    fetchCards,
    isLoading,
  };
}
*/

export const getActiveSub = async () => {
  // const navigate = useNavigate();
  const profile = useProfileStore.getState();
  console.log("profile from store: ", profile);
  const res = await axios.post(
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
  return res;
};
