import ProductPlanSvg from '@/assets/navIcons/productPlan.svg?react'
import SubscriptionSvg from '@/assets/navIcons/subscription.svg?react'
import UserInfoSvg from '@/assets/user.svg?react'

import InvoiceSvg from '@/assets/navIcons/invoice.svg?react'
import MyAccountSvg from '@/assets/navIcons/myAccount.svg?react'
import { initializeReq, logoutReq } from '@/requests'
import {
  uiConfigStore,
  useAppConfigStore,
  useMerchantInfoStore,
  useProfileStore,
  useSessionStore
} from '@/stores'
import { withEnvBasePath } from '@/utils'
import Icon, {
  ArrowLeftOutlined,
  DollarOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { Divider, Menu, MenuProps, message, Popover } from 'antd'
import Sider from 'antd/es/layout/Sider'
import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginModal from './login/LoginModal'
const APP_PATH = import.meta.env.BASE_URL
type MenuItem = Required<MenuProps>['items'][number]

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
    label
  } as MenuItem
}

const items: MenuItem[] = [
  getItem('Plans', '/plans', <Icon component={ProductPlanSvg} />),
  getItem(
    'My Subscription',
    '/my-subscription',
    <Icon component={SubscriptionSvg} />
  ),
  getItem('Invoice', '/invoice/list', <Icon component={InvoiceSvg} />),
  getItem('Transaction', '/transaction/list', <DollarOutlined />),
  getItem('My Account', '/my-account', <Icon component={MyAccountSvg} />)
]

const Sidebar = () => {
  const navigate = useNavigate()
  const profileStore = useProfileStore()
  const sessionStore = useSessionStore()
  const appConfigStore = useAppConfigStore()

  const { sidebarCollapsed, toggleSidebar } = uiConfigStore()
  const merchantStore = useMerchantInfoStore()
  const [activeMenuItem, setActiveMenuItem] = useState<string[]>(['/profile'])
  const [openKeys, setOpenKeys] = useState<string[]>(['/profile'])
  const [openLoginModal, setOpenLoginModal] = useState(false)

  const onItemClick = ({
    key,
    needNavigate = true
  }: {
    key: string
    needNavigate?: boolean
  }) => {
    if (needNavigate) {
      navigate(`${APP_PATH}${key.substring(1)}`) // remove the leading '/' character, coz APP_PATH already has it
    }

    setActiveMenuItem([key])
    const pathItem = key.split('/').filter((k) => !!k) // remove the empty leading item
    if (pathItem.length == 2) {
      // submenu item clicked
      setOpenKeys(['/' + pathItem[0]])
    }
  }

  const logout = async () => {
    const [_, err] = await logoutReq()
    if (null != err) {
      message.error(err.message)
      return
    }
    sessionStore.setSession({
      expired: true,
      refreshCallbacks: [],
      redirectToLogin: true
    })
    profileStore.reset()
    merchantStore.reset()
    appConfigStore.reset()
    localStorage.removeItem('appConfig')
    localStorage.removeItem('merchantInfo')
    localStorage.removeItem('token')
    localStorage.removeItem('profile')
    localStorage.removeItem('session')
    navigate(`${APP_PATH}login`)
  }

  // similar to onItemClick, try to refactor into one fn.
  useEffect(() => {
    const pathItems = location.pathname.split('/').filter((p) => p != '')
    if (pathItems[0] == 'invoice') {
      setActiveMenuItem(['/invoice/list'])
    } else if (pathItems[0] == 'transaction') {
      setActiveMenuItem(['/transaction/list'])
    } else {
      setActiveMenuItem(['/' + pathItems[0]])
    }
  }, [location, location.pathname])

  useEffect(() => {
    if (sessionStore.expired) {
      if (sessionStore.redirectToLogin) {
        navigate(`${APP_PATH}login`)
      } else {
        setOpenLoginModal(true)
      }
    } else {
      setOpenLoginModal(false)
    }
  }, [sessionStore])

  useEffect(() => {
    // when user refresh or enter URL then ENTER, call this fn to highlight the active menu
    // since we are already in the current path, there is no need to navigate
    // console.log('app mounted, pathname: ', window.location.pathname);
    onItemClick({ key: window.location.pathname, needNavigate: false })

    // detect reload
    const init = async () => {
      const navigationEntries =
        window.performance.getEntriesByType('navigation')
      if (
        navigationEntries.length > 0 &&
        (navigationEntries[0] as PerformanceNavigationTiming).type === 'reload'
      ) {
        const [initRes, errInit] = await initializeReq()
        if (null != errInit) {
          return
        }
        const { appConfig, gateways, merchantInfo, user } = initRes
        appConfigStore.setAppConfig(appConfig)
        appConfigStore.setGateway(gateways)
        merchantStore.setMerchantInfo(merchantInfo.merchant)
        profileStore.setProfile(user)
      }
    }
    init()
  }, [])

  return (
    <>
      {openLoginModal && <LoginModal email={profileStore.email} />}
      <Sider
        trigger={
          <ArrowLeftOutlined
            style={{
              color: 'gray',
              fontSize: '18px',
              transition: 'all 0.3s ease-in-out',
              transform: `rotate(${sidebarCollapsed ? 180 : 0}deg)`
            }}
          />
        }
        theme="dark"
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={toggleSidebar}
      >
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <div>
            <Logo />
            <Menu
              theme="dark"
              selectedKeys={activeMenuItem}
              openKeys={openKeys}
              mode="inline"
              items={items}
              onClick={onItemClick}
              // onOpenChange={(keys) => console.log("on open change: ", keys)}
            />
          </div>

          <div className="absolute bottom-16 w-full">
            <div className="flex w-full items-center justify-center">
              <div className="flex w-[82%]">
                <Divider style={{ borderColor: '#595959', margin: '0 0' }} />
              </div>
            </div>
            <div className="flex flex-col items-center">
              {/* <AboutUniBee collapsed={sidebarCollapsed} /> */}
              <LogoWithAction
                collapsed={sidebarCollapsed}
                text="Account Info"
                logo={<UserInfoSvg />}
                logoColor="text-gray-400"
                popoverText={
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-14 text-sm text-gray-500">Name:</div>
                      <div>
                        {profileStore.firstName} {profileStore.lastName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-14 text-sm text-gray-500">Email:</div>
                      <div>{profileStore.email}</div>
                    </div>
                    {/* <div className="flex items-center gap-2">
                    <div className="w-14 text-sm text-gray-500">Role:</div>
                    <div>{role}</div>
                  </div> */}
                  </div>
                }
              />
              <LogoWithAction
                collapsed={sidebarCollapsed}
                clickHandler={() => logout()}
                text="Log out"
                logo={<LogoutOutlined className="mr-2" />}
                logoColor="text-red-400"
              />
            </div>
          </div>

          {/* <div className="absolute bottom-20 flex w-full flex-col items-center justify-center text-gray-50">
            <div className="flex flex-col items-center">
              <div className="text-xs">{profileStore.email}</div>
              <div>{`${profileStore.firstName} ${profileStore.lastName}`}</div>
            </div>
            <div onClick={logout} className=" my-4 cursor-pointer">
              <LogoutOutlined />
              &nbsp;&nbsp;Logout
            </div>
          </div> */}
        </div>
      </Sider>
    </>
  )
}

export default Sidebar

const LOGO_CONTAINER_HEIGHT = 56

export const Logo = () => {
  const merchantInfoStore = useMerchantInfoStore()

  return (
    <div
      style={{ height: LOGO_CONTAINER_HEIGHT + 'px', width: '100%' }}
      className="relative my-5 flex max-h-full max-w-full items-center justify-center"
    >
      <img
        className={`h-full w-full object-contain px-2 transition-all duration-300`}
        src={
          merchantInfoStore.companyLogo ||
          withEnvBasePath('/logoPlaceholder.png')
        }
      />
    </div>
  )
}

const LogoWithAction = ({
  collapsed,
  clickHandler,
  text,
  logoColor,
  logo,
  height,
  popoverText
}: {
  collapsed: boolean
  clickHandler?: () => void
  text: string
  logo?: React.ReactNode
  logoColor?: string
  height?: string
  popoverText?: ReactNode
}) => (
  <PopoverWrapper needPopover={popoverText != undefined} content={popoverText}>
    <div
      style={{ height: height ?? '40px' }}
      className={`relative flex w-full ${clickHandler != undefined && 'cursor-pointer'} items-center pl-7 opacity-80 hover:text-gray-900 hover:opacity-100`}
      onClick={clickHandler}
    >
      {logo != undefined && (
        <div
          className={`h-4 w-4 flex-shrink-0 ${logoColor} transition-all duration-300`}
        >
          {logo}
        </div>
      )}
      <div
        className={`${logo != undefined && 'ml-3'} flex-shrink-0 text-gray-100 ${
          collapsed ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}
      >
        {text}
      </div>
    </div>
  </PopoverWrapper>
)

const PopoverWrapper = ({
  children,
  needPopover,
  content
}: React.PropsWithChildren<{ content?: ReactNode; needPopover: boolean }>) => {
  return !needPopover ? (
    <>{children}</>
  ) : (
    <Popover
      content={content}
      placement="top"
      overlayStyle={{ maxWidth: '360px' }}
    >
      {children}
    </Popover>
  )
}
