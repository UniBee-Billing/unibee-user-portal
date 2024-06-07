import { LoadingOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProfileStore } from '../../stores';
import MainPlanList from './mainPlanList';
import OnetimePlanList from './oneTimePlanList';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const profileStore = useProfileStore();
  // const appConfigStore = useAppConfigStore();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ?? 'plans',
  );

  const onChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'plans',
      label: 'Plans',
      children: <MainPlanList />,
    },
    {
      key: 'one-time-addons',
      label: 'One-time Addons',
      children: <OnetimePlanList />,
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} items={tabItems} onChange={onChange} />
    </div>
  );
};

export default Index;
