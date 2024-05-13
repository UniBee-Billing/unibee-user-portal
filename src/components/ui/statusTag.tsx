import { Pagination, Spin, Table, Tag, message } from 'antd';
import React, { ReactElement, useEffect, useState } from 'react';
import { CURRENCY, PAYMENT_STATUS, SUBSCRIPTION_STATUS } from '../../constants';

const SUB_STATUS: { [key: number]: ReactElement } = {
  1: <Tag color="magenta">{SUBSCRIPTION_STATUS[1]}</Tag>, // 1: pending
  2: <Tag color="#87d068">{SUBSCRIPTION_STATUS[2]}</Tag>, // 2: active
  4: <Tag color="purple">{SUBSCRIPTION_STATUS[4]}</Tag>, // 4: cancelled
  5: <Tag color="red">{SUBSCRIPTION_STATUS[5]}</Tag>, // 5: expired
  7: <Tag color="cyan">{SUBSCRIPTION_STATUS[7]}</Tag>, // 7: Incomplete
  8: <Tag color="blue">{SUBSCRIPTION_STATUS[8]}</Tag>, // 7: Incomplete
};
const SubscriptionStatus = (statusId: number) => SUB_STATUS[statusId];

const PAYMENT_STATUS_TAG: { [key: number]: ReactElement } = {
  0: <Tag color="blue">{PAYMENT_STATUS[0]}</Tag>, // pending
  1: <Tag color="#87d068">{PAYMENT_STATUS[1]}</Tag>, // succeeded
  2: <Tag color="purple">{PAYMENT_STATUS[2]}</Tag>, // failed
};
const PaymentStatus = (statusId: number) => PAYMENT_STATUS_TAG[statusId];

export { PaymentStatus, SubscriptionStatus };
