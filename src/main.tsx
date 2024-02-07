import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
// import "./index.css";
import "antd/dist/reset.css";
import { BrowserRouter } from "react-router-dom";
import { Button, ConfigProvider, Space } from "antd";

/*
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        theme={{
          token: {
            // Seed Token
            // colorPrimary: "rgb(51, 75, 97)", // "#00b96b",
            borderRadius: 2,

            // Alias Token
            // colorBgContainer: "#f6ffed",
          },
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
    ,
  </React.StrictMode>,
);
*/

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
