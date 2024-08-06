import { LoadingOutlined } from '@ant-design/icons'
import type { TabsProps } from 'antd'
import { Tabs } from 'antd'
import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProfileStore } from '../../stores'
import OnetimePlanList from './oneTimePlanList'
import ProductTab from './productTab'

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const profileStore = useProfileStore()
  // const appConfigStore = useAppConfigStore();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'plans')

  const onChange = (key: string) => {
    setActiveTab(key)
    setSearchParams({ tab: key })
  }

  const tabItems: TabsProps['items'] = [
    {
      key: 'plans',
      label: 'Plans',
      children: <ProductTab />
    },
    {
      key: 'one-time-addons',
      label: 'One-time Addons',
      children: <OnetimePlanList />
    }
  ]

  // it's better to fetch all plans in this component, then pass them to 2 children
  // maybe later
  return (
    <div>
      <Tabs activeKey={activeTab} items={tabItems} onChange={onChange} />
    </div>
  )
}

export default Index
