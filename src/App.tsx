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
import Subscription from "./components/subscription";
import Profile from "./components/profile";
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

const items: MenuItem[] = [
  getItem("Profile", "1", <PieChartOutlined />),
  getItem("My subscription", "2", <DesktopOutlined />),
  /*
  getItem("User", "sub1", <UserOutlined />, [
    getItem("Tom", "3"),
    getItem("Bill", "4"),
    getItem("Alex", "5"),
  ]),
  
  getItem("Team", "sub2", <TeamOutlined />, [
    getItem("Team 1", "6"),
    getItem("Team 2", "8"),
  ]),
  */
  /*
  getItem("Events", "3", <FileOutlined />),
  getItem("Billable items", "4", <FileOutlined />),
  getItem("Customers", "5", <FileOutlined />),
  getItem("Billings", "6", <FileOutlined />),
  getItem("Admin center", "7", <FileOutlined />),
  */
];

const noSiderRoutes = [`${APP_PATH}login`, `${APP_PATH}signup`];

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const navigate = useNavigate();

  const onItemClick = ({
    // item,
    key,
  }: // keyPath,
  // domEvent,
  {
    // item: any;
    key: any;
    // keyPath: any;
    // domEvent: any;
  }) => {
    if (key == "1") {
      navigate(`${APP_PATH}profile`);
    } else if (key == "2") {
      navigate(`${APP_PATH}subscription`);
    }
  };

  const logout = () => {
    axios
      .post(`${API_URL}/user/auth/sso/logout`, {})
      .then((res) => {
        console.log("logout res: ", res);
        if (res.data.code != 0) {
          throw new Error(res.data.message);
        }
        localStorage.removeItem("token");
        navigate(`${APP_PATH}login`);
      })
      .catch((err) => {
        localStorage.removeItem("token");
        navigate(`${APP_PATH}login`);
      });

    navigate(`${APP_PATH}login`);
  };

  return (
    <>
      {noSiderRoutes.findIndex((r) => r == location.pathname) != -1 ? (
        <Layout style={{ minHeight: "100vh" }}>
          <Routes>
            <Route path={`${APP_PATH}login`} Component={Login} />
            <Route path={`${APP_PATH}signup`} Component={Signup} />
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
              <img src={"/MultiloginLogo.png"} height={"80px"} />
            </div>
            <Menu
              theme="dark"
              defaultSelectedKeys={["1"]}
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
              this is app header
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
                  <Route path={`${APP_PATH}`} Component={Profile} />
                  <Route path={`${APP_PATH}profile`} Component={Profile} />
                  <Route
                    path={`${APP_PATH}subscription`}
                    Component={Subscription}
                  />
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
