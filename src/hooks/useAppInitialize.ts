import { useCallback } from 'react'
import { initializeReq } from '../requests'
import { CURRENCY } from '../shared.types'
import { useAppConfigStore, useMerchantInfoStore } from '../stores'

export const useAppInitialize = (): (() => Promise<void>) => {
  const appConfigStore = useAppConfigStore()
  const merchantStore = useMerchantInfoStore()
  const appInitialize = useCallback(async () => {
    const [initRes, errInit] = await initializeReq()
    if (null != errInit) {
      return
    }
    const { appConfig, gateways, merchantInfo } = initRes
    const currency: Record<string, CURRENCY> = {}
    appConfig.supportCurrency.forEach((c: CURRENCY) => {
      currency[c.Currency] = c
    })
    appConfig.currency = currency
    appConfigStore.setAppConfig(appConfig)
    appConfigStore.setGateway(gateways)
    merchantStore.setMerchantInfo(merchantInfo)
  }, [])

  return appInitialize
}
