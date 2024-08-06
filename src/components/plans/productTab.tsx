import { LoadingOutlined } from '@ant-design/icons'
import type { TabsProps } from 'antd'
import { Tabs } from 'antd'
import React, { useEffect, useState } from 'react'
import { getProductListReq } from '../../requests'
import { IProduct } from '../../shared.types'
import { useProfileStore } from '../../stores'
import MainPlanList from './mainPlanList'

const Index = () => {
  const [productList, setProductList] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(false)
  // const appConfigStore = useAppConfigStore();
  const [productId, setProductId] = useState('0') // productId is current active tab key

  const getProductList = async () => {
    setLoading(true)
    const [res, err] = await getProductListReq()
    console.log('get productList res: ', res)
    setLoading(false)
    if (null != err) {
      // message.error(err.message)
      return
    }

    const productList = res.products ?? []
    setProductList(productList)
  }

  const onTabChange = (newActiveKey: string) => {
    setProductId(newActiveKey)
  }

  useEffect(() => {
    getProductList()
  }, [])

  // it's better to fetch all plans in this component, then pass them to 2 children
  // maybe later
  return (
    <div>
      <Tabs
        activeKey={productId}
        items={productList.map((p) => ({
          label: p.productName,
          key: p.id.toString(),
          children: <MainPlanList productId={p.id} />
        }))}
        onChange={onTabChange}
      />
    </div>
  )
}

export default Index
