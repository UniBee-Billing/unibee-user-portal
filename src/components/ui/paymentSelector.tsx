import { Col, Row } from 'antd'
import React, { ReactNode } from 'react'
import { showAmount } from '../../helpers'
import { TGateway } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import PayPalIcon from './icon/PayPal.svg?react'
import AmexIcon from './icon/amex.svg?react'
import BitcoinIcon from './icon/bitcoin-btc-logo.svg?react'
import EthIcon from './icon/ethereum-eth-logo.svg?react'
import LitecoinIcon from './icon/litecoin-ltc-logo.svg?react'
import MastercardIcon from './icon/mastercard.svg?react'
import UsdtIcon from './icon/tether-usdt-logo.svg?react'
import VisaIcon from './icon/visa.svg?react'
import WireIcon from './icon/wire-transfer-1.svg?react'

enum PAYMENT_METHODS {
  stripe = 'stripe',
  paypal = 'paypal',
  changelly = 'changelly',
  wire_transfer = 'wire_transfer'
}

const PAYMENTS: {
  [key in PAYMENT_METHODS]: {
    label: string
    order: number
    logo: ReactNode
  }
} = {
  stripe: {
    label: 'Bank Cards',
    logo: [<VisaIcon />, <MastercardIcon />, <AmexIcon />].map((c, idx) => (
      <div key={idx} className="flex h-7 w-7 items-center">
        {c}
      </div>
    )),
    order: 1
  },
  paypal: {
    label: 'PayPal',
    logo: [<PayPalIcon />].map((c, idx) => (
      <div key={idx} className="flex h-16 w-16 items-center">
        {c}
      </div>
    )),
    order: 2
  },
  changelly: {
    label: 'Crypto',
    logo: [<BitcoinIcon />, <EthIcon />, <UsdtIcon />, <LitecoinIcon />].map(
      (c, idx) => (
        <div key={idx} className="flex h-5 w-5 items-center">
          {c}
        </div>
      )
    ),
    order: 3
  },
  wire_transfer: {
    label: 'Wire Transfer',
    logo: [<WireIcon />].map((c, idx) => (
      <div key={idx} className="flex h-12 w-12 items-center">
        {c}
      </div>
    )),
    order: 4
  }
}

const Index = ({
  selected,
  onSelect,
  showWTtips,
  disabled
}: {
  selected: number | undefined
  onSelect: React.ChangeEventHandler<HTMLInputElement>
  showWTtips?: boolean
  disabled?: boolean
}) => {
  const appConfig = useAppConfigStore()
  const gateways = appConfig.gateway.sort(
    (a: TGateway, b: TGateway) => a.sort - b.sort
  )
  const wire = gateways.find((g) => g.gatewayName == 'wire_transfer')

  return (
    <div className="flex flex-col gap-3">
      {gateways.map((g) => {
        return (
          <label
            key={g.gatewayId}
            htmlFor={`payment-${g.gatewayName}`}
            className={`flex h-12 w-full cursor-pointer ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}  items-center justify-between rounded border border-solid ${selected == g.gatewayId ? 'border-blue-500' : 'border-gray-200'} px-2`}
          >
            <div className="flex">
              <input
                type="radio"
                name="payment-method"
                id={`payment-${g.gatewayName}`}
                value={g.gatewayId}
                checked={g.gatewayId == selected}
                onChange={onSelect}
                disabled={disabled}
              />
              <div className="ml-2 flex justify-between">{g.displayName}</div>
            </div>
            <div className="flex items-center justify-center gap-2">
              {g.gatewayIcons.map((i) => (
                <img key={i} height={24} src={i} />
              ))}
            </div>
          </label>
        )
      })}
      {wire != null && selected == wire.gatewayId && showWTtips && (
        <div>
          <Row style={{ marginBottom: '6px' }}>
            <Col span={10} className=" text-xs font-bold text-gray-500">
              Account Holder
            </Col>
            <Col className=" text-xs text-gray-400" span={14}>
              {wire.bank?.accountHolder}
            </Col>
          </Row>
          <Row style={{ marginBottom: '6px' }}>
            <Col className=" text-xs font-bold text-gray-500" span={10}>
              Minimum Amount
            </Col>
            <Col className=" text-xs text-gray-400" span={14}>
              {showAmount(
                wire.minimumAmount as number,
                wire.currency as string
              )}
            </Col>
          </Row>
          <Row style={{ marginBottom: '6px' }}>
            <Col className=" text-xs font-bold text-gray-500" span={10}>
              BIC
            </Col>
            <Col className=" text-xs text-gray-400" span={14}>
              {wire.bank?.bic}
            </Col>
          </Row>
          <Row style={{ marginBottom: '6px' }}>
            <Col className=" text-xs font-bold text-gray-500" span={10}>
              IBAN
            </Col>
            <Col className=" text-xs text-gray-400" span={14}>
              {wire.bank?.iban}
            </Col>
          </Row>
        </div>
      )}
    </div>
  )
}

export default Index
