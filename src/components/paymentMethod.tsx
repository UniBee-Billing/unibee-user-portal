import type { RadioChangeEvent } from 'antd';
import { Radio, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { GATEWAY_TYPE } from '../constants';
import { useAppConfigStore } from '../stores';

const Index = ({
  selectedGateway,
  onSelect,
}: {
  selectedGateway: null | number;
  onSelect: (e: RadioChangeEvent) => void;
}) => {
  const appConfig = useAppConfigStore();
  useEffect(() => {}, []);

  return (
    <div>
      <Radio.Group onChange={onSelect} value={selectedGateway}>
        <Space direction="vertical">
          {appConfig.gateway.map((g) => (
            <Radio key={g.gatewayId} value={g.gatewayId}>
              {GATEWAY_TYPE[g.gatewayType]}
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </div>
  );
};

export default Index;
