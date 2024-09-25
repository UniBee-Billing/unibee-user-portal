import { message } from 'antd'
import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppFooter from '../appFooter'
import AppHeader from '../appHeader'
import LoginContainer from './loginContainer'

const Index = () => {
  const location = useLocation()
  useEffect(() => {
    if (location.state && location.state.msg) {
      message.info(location.state.msg)
    }
  }, [])

  return (
    <div
      style={{
        height: 'calc(100vh - 142px)',
        overflowY: 'auto'
      }}
    >
      <AppHeader />
      <LoginContainer triggeredByExpired={false} initialEmail="" />
      <AppFooter />
    </div>
  )
}

export default Index
