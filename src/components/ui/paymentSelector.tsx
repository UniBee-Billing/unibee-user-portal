import { showAmount } from '@/helpers'
import { TGateway } from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import { Col, Row } from 'antd'
import React from 'react'

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
    <div className="flex max-h-64 w-full flex-col gap-3 overflow-y-auto pr-4">
      {gateways.map((g) => {
        return (
          <label
            key={g.gatewayId}
            htmlFor={`payment-${g.gatewayName}`}
            className={`flex h-12 w-full shrink-0 grow-0 cursor-pointer ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}  items-center justify-between rounded border border-solid ${selected == g.gatewayId ? 'border-blue-500' : 'border-gray-200'} px-2`}
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
                <div
                  key={i}
                  className="flex h-7 max-w-14 items-center justify-center"
                >
                  <img src={i} className="h-full w-full object-contain" />
                </div>
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
