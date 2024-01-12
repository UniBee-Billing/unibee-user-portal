import React, { useState } from "react";
import {
  DesktopOutlined,
  // FileOutlined,
  PieChartOutlined,
  // TeamOutlined,
  // UserOutlined
  LogoutOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  // BrowserRouter as Router,
  Routes,
  Route,
  // Outlet,
  // Link,
  useNavigate,
} from "react-router-dom";
import { Layout, Menu, theme } from "antd";

import Dashboard from "./components/dashboard";
import PricePlans from "./components/pricePlans";
import NotFound from "./components/notFound";
import Products from "./components/product";
import ProductsUpdate from "./components/productUpdate";
// import CheckoutForm from "./components/checkoutForm";
import PaymentResult from "./components/paymentResult";
import ProfileBasic from "./components/profile/basicInfo";
import ProfileSubscription from "./components/profile/subscription";
import Invoices from "./components/invoices";
import Login from "./components/login";
import Signup from "./components/signup";
import axios from "axios";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;
const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}
/*
// old design, obsolete
const items: MenuItem[] = [
  getItem("product list", "2", <DesktopOutlined />),
  getItem("My Subscription", "1", <PieChartOutlined />),
  getItem("Profile", "3", <PieChartOutlined />),
];
*/
const items: MenuItem[] = [
  getItem("Products", "products", <PieChartOutlined />),
  getItem("Profile", "profile", <DesktopOutlined />, [
    getItem("My Subscription", "profile/subscription"),
    getItem("Basic Info", "profile/basic-info"),
  ]),
  getItem("Invoices", "invoices", <DesktopOutlined />),
  /*
  getItem('Navigation Two', 'sub2', <DesktopOutlined />, [
    getItem('Option 9', '9'),
    getItem('Option 10', '10'),
    getItem('Submenu', 'sub3', null, [getItem('Option 11', '11'), getItem('Option 12', '12')]),
  ]),
  */
];

const noSiderRoutes = [
  `${APP_PATH}login`,
  `${APP_PATH}signup`,
  // `${APP_PATH}payment-result`,
];

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const navigate = useNavigate();

  /*
getItem('Products', 'products', <PieChartOutlined />),
  getItem('Profile', 'profile', <DesktopOutlined />, [
    getItem('My Subscription', 'profile/subscription'),
    getItem('Basic Info', 'profile/basic-info'),
  ]),
  getItem('Invoices', 'invoices', <DesktopOutlined />),
  */
  const onItemClick = ({
    // item,
    key,
  }: // keyPath,
  // domEvent,
  {
    // item: any;
    key: string;
    // keyPath: any;
    // domEvent: any;
  }) => {
    if (key == "products") {
      navigate(`${APP_PATH}products`);
    } else if (key == "profile/subscription") {
      navigate(`${APP_PATH}profile/subscription`);
    } else if (key == "profile/basic-info") {
      navigate(`${APP_PATH}profile/basic-info`);
    } else if (key == "invoices") {
      navigate(`${APP_PATH}invoices`);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    axios
      .post(`${API_URL}/user/auth/sso/logout`, {})
      .then((res) => {
        console.log("logout res: ", res);
        if (res.data.code != 0) {
          throw new Error(res.data.message);
        }
        navigate(`${APP_PATH}login`);
      })
      .catch((err) => {
        navigate(`${APP_PATH}login`);
      });
  };

  return (
    <>
      {noSiderRoutes.findIndex((r) => r == location.pathname) != -1 ? (
        <Layout style={{ minHeight: "100vh" }}>
          <Routes>
            <Route path={`${APP_PATH}login`} Component={Login} />
            <Route path={`${APP_PATH}signup`} Component={Signup} />
            <Route
              path={`${APP_PATH}payment-result`}
              Component={PaymentResult}
            />
          </Routes>
        </Layout>
      ) : (
        <Layout style={{ minHeight: "100vh" }}>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
          >
            <div className="demo-logo-vertical" />
            <div
              style={{
                color: "#FFF",
                margin: "18px 0",
                display: "flex",
                justifyContent: "center",
              }}
            >
<<<<<<< HEAD
              <img src={`${APP_PATH}/MultiloginLogo.png`} height={"80px"} />
=======
              <img src={`${APP_PATH}multiLoginLogo.png`} height={"80px"} />
>>>>>>> development
            </div>
            <Menu
              theme="dark"
              defaultSelectedKeys={["2"]}
              mode="inline"
              items={items}
              onClick={onItemClick}
            />
            <div
              onClick={logout}
              style={{
                color: "#FFF",
                position: "absolute",
                bottom: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                cursor: "pointer",
              }}
            >
              <LogoutOutlined />
              &nbsp;Logout
            </div>
          </Sider>
          <Layout>
            <Header style={{ padding: 0, background: colorBgContainer }}>
              {/* this is app header */}
            </Header>
            <Content style={{ margin: "0 16px" }}>
              <div
                style={{
                  padding: 24,
                  minHeight: 360,
                  background: colorBgContainer,
                  borderRadius: borderRadiusLG,
                }}
              >
                <Routes>
                  <Route path="*" Component={NotFound} />
                  <Route
                    path={`${APP_PATH}payment-result`}
                    Component={PaymentResult}
                  />
                  {/* <Route
                    path={`${APP_PATH}checkout`}
                    Component={CheckoutForm}
              /> */}
                  <Route
                    path={`${APP_PATH}profile/basic-info`}
                    Component={ProfileBasic}
                  />
                  <Route
                    path={`${APP_PATH}profile/subscription`}
                    Component={ProfileSubscription}
                  />
                  <Route
                    path={`${APP_PATH}products/update`}
                    Component={ProductsUpdate}
                  />
                  <Route path={`${APP_PATH}products`} Component={Products} />
                  <Route path={`${APP_PATH}invoices`} Component={Invoices} />
                </Routes>
              </div>
            </Content>
            <Footer style={{ textAlign: "center" }}>Unibee ©2023-</Footer>
          </Layout>
        </Layout>
      )}
    </>
  );
};

export default App;
