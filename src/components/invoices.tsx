import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  console.log("token: ", token);

  useEffect(() => {}, []);

  return <div>invoices</div>;
};

export default Index;
