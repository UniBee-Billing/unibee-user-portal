import type { RadioChangeEvent } from 'antd';
import { Radio, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { GATEWAY_TYPE } from '../constants';
import { useAppConfigStore } from '../stores';
import PaymentSelector from './ui/paymentSelector';

const Index = ({
  selectedGateway,
  onSelect,
}: {
  selectedGateway: null | number;
  onSelect: (e: React.ChangeEventHandler<HTMLInputElement>) => void;
}) => {
  const appConfig = useAppConfigStore();
  useEffect(() => {}, []);

  return <div></div>;
};

export default Index;

/*
<Radio.Group
        onChange={onSelect}
        value={selectedGateway}
        style={{ width: '100%' }}
        options={appConfig.gateway.map((g) => ({
          label: (
            <div className="flex items-center justify-between">
              <div>{GATEWAY_TYPE[g.gatewayType]}</div>
              <div>icon</div>
            </div>
          ),
          value: g.gatewayId,
        }))}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {appConfig.gateway.map((g) => (
            <Radio
              key={g.gatewayId}
              value={g.gatewayId}
              style={{ width: '100%' }}
            >
              <div className="flex items-center justify-between">
                <div>{GATEWAY_TYPE[g.gatewayType]}</div>
                <div>icon</div>
              </div>
            </Radio>
          ))}
          </Space>
      </Radio.Group>
      */
