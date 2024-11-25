import { LoadingOutlined } from '@ant-design/icons'
import { message, Spin, Tabs } from 'antd'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProductListReq } from '../../requests'
import { IProduct } from '../../shared.types'
import OnetimePlanList from './oneTimePlanList'
import ProductTab from './productTab'

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [productList, setProductList] = useState<IProduct[]>([])
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'plans')

  const onChange = (key: string) => {
    setActiveTab(key)
    setSearchParams({ tab: key })
  }

  const getProductList = async () => {
    setLoading(true)
    const [res, err] = await getProductListReq(getProductList)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    setProductList(res.products ?? [])
  }

  useEffect(() => {
    getProductList()
  }, [])
  /*
  const tabItems: TabsProps['items'] = [
    {
      key: 'plans',
      label: 'Plans',
      children: <ProductTab productList={productList}/>
    },
    {
      key: 'one-time-addons',
      label: 'One-time Addons',
      children: <OnetimePlanList productList={productList}/>
    }
  ]
    */

  return (
    <Spin
      indicator={<LoadingOutlined />}
      size="large"
      spinning={loading}
      style={{
        width: '100%',
        height: '320px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Tabs
        activeKey={activeTab}
        items={[
          {
            key: 'plans',
            label: 'Plans',
            children: <ProductTab productList={productList} />
          },
          {
            key: 'one-time-addons',
            label: 'One-time Addons',
            children: <OnetimePlanList productList={productList} />
          }
        ]}
        onChange={onChange}
      />
    </Spin>
  )
}

export default Index
