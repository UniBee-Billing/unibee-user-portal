import { getProductsWithMoreReq } from '@/requests'
import '@/shared.css'
import { IProduct, ISubAddon, ISubscription } from '@/shared.types'
import { LoadingOutlined } from '@ant-design/icons'
import { Divider, Spin, Tabs, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import OneTimePaymentHistory from './onetimeHistory'
import SubHistory from './subHistory'
import Subscription from './subscription'

const Index = () => {
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [subList, setSubList] = useState<ISubscription[]>([])
  const [productList, setProductList] = useState<IProduct[]>([])
  const [productId, setProductId] = useState('0') // productId is the active tab key

  const normalizeSub = (s: ISubscription): ISubscription => {
    const sub: ISubscription = {
      ...s.subscription,
      plan: s.plan,
      latestInvoice: s.latestInvoice,
      addons:
        s.addons == null
          ? []
          : s.addons.map((a) => ({
              ...a.addonPlan,
              ...a,
              quantity: a.quantity
            })),
      user: s.user,
      unfinishedSubscriptionPendingUpdate: s.unfinishedSubscriptionPendingUpdate
    }

    if (sub.unfinishedSubscriptionPendingUpdate != null) {
      if (sub.unfinishedSubscriptionPendingUpdate.updateAddons != null) {
        sub.unfinishedSubscriptionPendingUpdate.updateAddons =
          sub.unfinishedSubscriptionPendingUpdate.updateAddons.map(
            (a) =>
              ({
                ...a.addonPlan,
                quantity: a.quantity,
                addonPlanId: a.addonPlan?.id
              }) as ISubAddon
          )
      }
    }
    return sub
  }

  const fetchData = async () => {
    setLoading(true)
    const [res, err] = await getProductsWithMoreReq(fetchData)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { products, subscriptions } = res
    setProductList(products.products)
    let subs = subscriptions ?? []
    subs = subs.map(normalizeSub)
    setSubList(subs)

    /*
    setLoading(true)
    const [s, err] = await getActiveSubReq(fetchData)
    setLoading(false)
    console.log('active sub: ', s)
    if (null != err) {
      message.error(err.message)
      return
    }

    if (null == s) {
      // if user enter this route from login and has no subscription(new user or current sub expired/cancelled)
      // they'll be redirected to /product, otherwise, stay.
      if (location.state != null && location.state.from == 'login') {
        navigate(`${APP_PATH}plans`)
      } else {
        // user might cancel a pending sub, after refresh, backend returns a null, I need to set to null
        // thus, page will show 'no subscription'
        setSubscription(null)
      }
      return
    }

    const sub = {
      ...s.subscription,
      plan: s.plan,
      latestInvoice: s.latestInvoice,
      addons:
        s.addons == null
          ? []
          : s.addons.map((a: any) => ({
              ...a.addonPlan,
              quantity: a.quantity
            })),
      user: s.user,
      unfinishedSubscriptionPendingUpdate: s.unfinishedSubscriptionPendingUpdate
    }
    if (sub.unfinishedSubscriptionPendingUpdate != null) {
      if (sub.unfinishedSubscriptionPendingUpdate.updateAddons != null) {
        sub.unfinishedSubscriptionPendingUpdate.updateAddons =
          sub.unfinishedSubscriptionPendingUpdate.updateAddons.map(
            (a: any) => ({
              ...a.addonPlan,
              quantity: a.quantity,
              addonPlanId: a.addonPlan.id
            })
          )
      }
    }

    console.log('sub: ', sub)
    setSubscription(sub)
    */
  }

  const onTabChange = (newActiveKey: string) => setProductId(newActiveKey)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (location.state && location.state.msg) {
      message.info(location.state.msg)
    }
  }, [])

  return (
    <div>
      <Spin
        spinning={loading}
        size="small"
        indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
      >
        <Divider
          orientation="left"
          style={{ margin: '32px 0', color: '#757575' }}
        >
          Current Subscription
        </Divider>
        <Tabs
          onChange={onTabChange}
          activeKey={productId}
          items={productList.map((p) => ({
            label: p.productName,
            key: p.id.toString(),
            children: (
              <Subscription
                productId={p.id.toString()}
                normalizeSub={normalizeSub}
                subDetail={subList.find(
                  (s) => s.productId.toString() == productId
                )}
              />
            )
          }))}
        />
      </Spin>

      <SubHistory />
      <OneTimePaymentHistory />
    </div>
  )
}

export default Index
