import React, { useState, FunctionComponent, PropsWithChildren } from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Breadcrumb, Layout, Menu, theme } from "antd";

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

const AppLayout: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const noSiderRoutes = ["/login", "/signup"];

  const navigate = useNavigate();

  const onItemClick = ({
    item,
    key,
    keyPath,
    domEvent,
  }: {
    item: any;
    key: any;
    keyPath: any;
    domEvent: any;
  }) => {
    if (key == "1") {
      navigate("/dashboard");
    } else if (key == "2") {
      navigate("/price-plan");
    }
  };

  return noSiderRoutes.findIndex((r) => r == location.pathname) != -1 ? (
    <Layout style={{ minHeight: "100vh" }}>{children}</Layout>
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
              <Route path="/" Component={Dashboard} />
              <Route path="/dashboard" Component={Dashboard} />
              <Route path="/price-plan" Component={PricePlans} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>Unibee ©2023</Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
