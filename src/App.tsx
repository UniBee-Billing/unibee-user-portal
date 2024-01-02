import React, { useState } from "react";
import {
  DesktopOutlined,
  // FileOutlined,
  PieChartOutlined,
  // TeamOutlined,
  // UserOutlined,
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
import Login from "./components/login";
import Signup from "./components/signup";

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
  getItem("Dashboard", "1", <PieChartOutlined />),
  getItem("Price plans", "2", <DesktopOutlined />),
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

const APP_PATH = import.meta.env.BASE_URL; // import.meta.env.VITE_APP_PATH;
console.log("base url: ", APP_PATH);
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
      navigate(`${APP_PATH}dashboard`);
    } else if (key == "2") {
      navigate(`${APP_PATH}price-plan`);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
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
            <div style={{ color: "#FFF" }}>Logo here</div>
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
              logout
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
                  <Route path={`${APP_PATH}`} Component={Dashboard} />
                  <Route path={`${APP_PATH}dashboard`} Component={Dashboard} />
                  <Route
                    path={`${APP_PATH}price-plan`}
                    Component={PricePlans}
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
