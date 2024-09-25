import { LoadingOutlined, StarOutlined } from '@ant-design/icons'
import { Spin, Tabs, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getSublistReq } from '../../requests'
import { IProduct, ISubAddon, ISubscription } from '../../shared.types'
import MainPlanList from './mainPlanList'

const Index = ({ productList }: { productList: IProduct[] }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  // const [productList, setProductList] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(false)
  // const appConfigStore = useAppConfigStore();
  const [productId, setProductId] = useState(
    searchParams.get('productId') ?? '0'
  ) // set default tab
  const [subList, setSubList] = useState<ISubscription[]>([])

  const fetchData = async () => {
    setLoading(true)
    const [subs, subErr] = await getSublistReq()
    setLoading(false)
    if (null != subErr) {
      message.error(subErr.message)
      return
    }
    console.log('sub list res: ', subs)
    setSubList(
      subs == null
        ? []
        : subs.map((sub: ISubscription & { addonParams: ISubAddon[] }) => {
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
  }

  const onTabChange = (newActiveKey: string) => {
    setProductId(newActiveKey)
    setSearchParams({ productId: newActiveKey })
  }

  useEffect(() => {
    fetchData()
  }, [])

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
            children: (
              <MainPlanList
                productId={p.id}
                activeSub={subList.find((s) => s.productId == p.id)}
              />
            ),
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
