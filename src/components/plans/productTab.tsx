import { LoadingOutlined, StarOutlined } from '@ant-design/icons'
import { Spin, Tabs, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProductListReq, getSublistReq } from '../../requests'
import { IProduct, ISubscription } from '../../shared.types'
import MainPlanList from './mainPlanList'

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [productList, setProductList] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(false)
  // const appConfigStore = useAppConfigStore();
  const [productId, setProductId] = useState(
    searchParams.get('productId') ?? '0'
  ) // set default tab
  const [subList, setSubList] = useState<ISubscription[]>([])

  // todo: combine the following 2 calls into one call
  const fetchData = async () => {
    setLoading(true)
    const [res, err] = await getProductListReq(fetchData)
    console.log('get productList res: ', res)
    if (null != err) {
      setLoading(false)
      message.error(err.message)
      return
    }

    const [subs, subErr] = await getSublistReq()
    if (null != subErr) {
      setLoading(false)
      message.error(err.message)
      return
    }
    setLoading(false)
    console.log('sub list res: ', subs)
    setSubList(
      subs == null
        ? []
        : subs.map((sub: any) => {
            // const { id, status, planId, productId } = s.subscription
            // return { id, status, planId, productId }
            const activeSub = { ...sub.subscription }
            ;(activeSub as ISubscription).addons = sub.addonParams
            console.log('local sub: ', activeSub)
            // setActiveSub(localActiveSub)
            // setSelectedPlan(sub.subscription.planId)
            return activeSub
          })
    )

    const productList = res.products ?? []
    setProductList(productList)
  }

  const onTabChange = (newActiveKey: string) => {
    setProductId(newActiveKey)
    setSearchParams({ productId: newActiveKey })
  }

  useEffect(() => {
    fetchData()
  }, [])

  // it's better to fetch all plans in this component, then pass them to 2 children
  // maybe later
  return (
    <div>
      <Spin
        spinning={loading}
        indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
      >
        <Tabs
          activeKey={productId}
          items={productList.map((p) => ({
            label: p.productName,
            key: p.id.toString(),
            children: <MainPlanList productId={p.id} subList={subList} />,
            icon:
              subList.find((s) => s.productId == p.id) != null ? (
                <StarOutlined />
              ) : null
          }))}
          onChange={onTabChange}
        />
      </Spin>
    </div>
  )
}

export default Index
