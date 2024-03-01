import {
  DesktopOutlined,
  LogoutOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, message, theme } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useMerchantInfoStore, useProfileStore } from './stores';

import Invoices from './components/invoices';
import Login from './components/login';
import NotFound from './components/notFound';
import PaymentResult from './components/paymentResult';
import ProductsUpdate from './components/productUpdate';
import ProfileBasic from './components/profile/basicInfo';
import ProfileSubscription from './components/profile/subscription';
import SessionResult from './components/sessionResult';
import Signup from './components/signup';
import { logoutReq } from './requests';

const APP_PATH = import.meta.env.BASE_URL;
const { Header, Content, Footer, Sider } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Products', '/products', <PieChartOutlined />),
  getItem('Profile', '/profile', <DesktopOutlined />, [
    getItem('My Subscription', '/profile/subscription'),
    getItem('Basic Info', '/profile/basic-info'),
  ]),
  getItem('Invoices', '/invoices', <DesktopOutlined />),
];

const noSiderRoutes = [
  `${APP_PATH}login`,
  `${APP_PATH}signup`,
  `${APP_PATH}session-result`,
  // `${APP_PATH}payment-result`,
];

const App: React.FC = () => {
  const merchantStore = useMerchantInfoStore();
  const profileStore = useProfileStore();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [activeMenuItem, setActiveMenuItem] = useState<string[]>(['/profile']);
  // this is the default open keys after successful login.
  const [openKeys, setOpenKeys] = useState<string[]>(['/profile']);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const navigate = useNavigate();

  const onItemClick = ({
    key,
    needNavigate = true,
  }: {
    key: string;
    needNavigate?: boolean;
  }) => {
    needNavigate && navigate(`${APP_PATH}${key.substring(1)}`); // remove the leading '/' character, coz APP_PATH already has it
    setActiveMenuItem([key]);
    const pathItem = key.split('/').filter((k) => !!k); // remove the empty leading item
    if (pathItem.length == 2) {
      // submenu item clicked
      setOpenKeys(['/' + pathItem[0]]);
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    try {
      await logoutReq();
      navigate(`${APP_PATH}login`);
    } catch (err) {
      if (err instanceof Error) {
        console.log('logout err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  useEffect(() => {
    // when user refresh or enter URL then ENTER, call this fn to highlight the active menu
    // since we are already in the current path, there is no need to navigate
    console.log('app mounted, pathname: ', window.location.pathname);
    onItemClick({ key: window.location.pathname, needNavigate: false });
  }, []);

  // similar to onItemClick, try to refactor into one fn.
  useEffect(() => {
    const p = location.pathname;
    console.log('location changed: ', p);
    if (p == '/products/update') {
      setActiveMenuItem(['/products']);
    } else if (p == '/profile/subscription') {
      setActiveMenuItem([p]);
    }

    if (location) {
      const pathItems = location.pathname.split('/').filter((p) => p != '');
      const keys = ['/' + pathItems[0]];
      if (pathItems.length > 1) {
        keys.push('/' + pathItems.join('/'));
      }
      setOpenKeys(['/profile', location.pathname]);
    }
  }, [location]);

  return (
    <>
      {noSiderRoutes.findIndex((r) => r == location.pathname) != -1 ? (
        <Layout>
          <Routes>
            <Route path={`${APP_PATH}login`} Component={Login} />
            <Route path={`${APP_PATH}signup`} Component={Signup} />
            <Route
              path={`${APP_PATH}payment-result`}
              Component={PaymentResult}
            />
            <Route
              path={`${APP_PATH}session-result`}
              Component={SessionResult}
            />
          </Routes>
        </Layout>
      ) : (
        <Layout style={{ minHeight: '100vh' }}>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
          >
            <div className="demo-logo-vertical" />
            <div
              style={{
                color: '#FFF',
                margin: '18px 0',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <img
                src={`${merchantStore.companyLogo || APP_PATH + 'logoPlaceholder.png'}`}
                height={'80px'}
              />
            </div>
            <Menu
              theme="dark"
              selectedKeys={activeMenuItem}
              openKeys={openKeys}
              mode="inline"
              items={items}
              onClick={onItemClick}
              // onOpenChange={(keys) => console.log("on open change: ", keys)}
            />
            <div className="absolute bottom-20 flex w-full flex-col items-center justify-center text-gray-50">
              <div className="flex flex-col items-center">
                <div className="text-xs">{profileStore.email}</div>
                <div>{`${profileStore.firstName} ${profileStore.lastName}`}</div>
              </div>
              <div onClick={logout} className=" my-4 cursor-pointer">
                <LogoutOutlined />
                &nbsp;&nbsp;Logout
              </div>
            </div>
          </Sider>
          <Layout>
            <Header style={{ padding: 0, background: colorBgContainer }}>
              {/* this is app header */}
            </Header>
            <Content
              style={{
                padding: '16px',
                height: 'calc(100vh - 180px)',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  padding: 24,
                  minHeight: 360,
                  // height: '100%',
                  background: colorBgContainer,
                  borderRadius: borderRadiusLG,
                }}
              >
                <Routes>
                  <Route path="*" Component={NotFound} />
                  <Route
                    path={APP_PATH}
                    element={
                      <Navigate to={`${APP_PATH}profile/subscription`} />
                    }
                  />
                  <Route
                    path={`${APP_PATH}payment-result`}
                    Component={PaymentResult}
                  />
                  <Route
                    path={`${APP_PATH}session-result`}
                    Component={SessionResult}
                  />
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
                  <Route
                    path={`${APP_PATH}products`}
                    Component={ProductsUpdate}
                  />
                  <Route path={`${APP_PATH}invoices`} Component={Invoices} />
                </Routes>
              </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>Copyright © 2024</Footer>
          </Layout>
        </Layout>
      )}
    </>
  );
};

export default App;
