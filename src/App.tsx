import { Layout, theme } from 'antd'
import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import AddPaymentMethodResult from './components/addPaymentMethodResult'
import InvoiceDetail from './components/invoice/detail'
import InvoiceList from './components/invoice/list'
import Login from './components/login'
import NotFound from './components/notFound'
import OnetimePaymentResult from './components/onetimePaymentResult'
import OutletPage from './components/outletPage'
import PaymentList from './components/payment/list'
import PaymentResult from './components/paymentResult'
// import ProductsUpdate from './components/productUpdate';
import PlanList from './components/plans'
import ProfileBasic from './components/profile/basicInfo'
import SubscriptionList from './components/profile/subscriptionList'
import SessionResult from './components/sessionResult'
import Sidebar from './components/siderbar'
import Signup from './components/signup'

const APP_PATH = import.meta.env.BASE_URL
const { Header, Content, Footer } = Layout

const noSiderRoutes = [
  `${APP_PATH}login`,
  `${APP_PATH}signup`,
  `${APP_PATH}session-result`
  // `${APP_PATH}payment-result`,
]

const App: React.FC = () => {
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

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
              path={`${APP_PATH}onetime-payment-result`}
              Component={OnetimePaymentResult}
            />
            <Route
              path={`${APP_PATH}session-result`}
              Component={SessionResult}
            />
          </Routes>
        </Layout>
      ) : (
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar />
          <Layout>
            <Header
              style={{ padding: 0, background: colorBgContainer }}
            ></Header>
            <Content
              style={{
                padding: '16px',
                height: 'calc(100vh - 180px)',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  padding: 24,
                  minHeight: 360,
                  // height: '100%',
                  background: colorBgContainer,
                  borderRadius: borderRadiusLG
                }}
              >
                <Routes>
                  <Route path="*" Component={NotFound} />
                  <Route
                    path={APP_PATH}
                    element={<Navigate to={`${APP_PATH}my-subscription`} />}
                  />
                  <Route
                    path={`${APP_PATH}payment-result`}
                    Component={PaymentResult}
                  />
                  <Route
                    path={`${APP_PATH}onetime-payment-result`}
                    Component={OnetimePaymentResult}
                  />
                  <Route
                    path={`${APP_PATH}add-payment-method-result`}
                    Component={AddPaymentMethodResult}
                  />
                  <Route
                    path={`${APP_PATH}session-result`}
                    Component={SessionResult}
                  />
                  <Route
                    path={`${APP_PATH}my-account`}
                    Component={ProfileBasic}
                  />
                  <Route
                    path={`${APP_PATH}my-subscription`}
                    Component={SubscriptionList}
                  />
                  <Route
                    path={`${APP_PATH}plans/update`}
                    Component={PlanList}
                  />
                  <Route path={`${APP_PATH}plans`} Component={PlanList} />
                  <Route path={`${APP_PATH}invoice`} Component={OutletPage}>
                    <Route path="list" element={<InvoiceList />} />
                    <Route path=":invoiceId" element={<InvoiceDetail />} />
                  </Route>
                  <Route path={`${APP_PATH}transaction`} Component={OutletPage}>
                    <Route path="list" element={<PaymentList />} />
                    {/* <Route path=":invoiceId" element={<InvoiceDetail />} /> */}
                  </Route>
                </Routes>
              </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>
              Copyright © {new Date().getFullYear()}{' '}
            </Footer>
          </Layout>
        </Layout>
      )}
    </>
  )
}

export default App
