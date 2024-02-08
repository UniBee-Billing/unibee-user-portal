import { Checkbox, Input } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import React, { useEffect, useState } from 'react';
import { showAmount } from '../helpers';
import { IPlan } from '../shared.types';

interface IPLanProps {
  plan: IPlan;
  selectedPlan: number | null;
  isActive: boolean; // whether current plan is the one user has subscribed(Y: highlight it)
  setSelectedPlan: (p: number) => void;
  onAddonChange: (
    addonId: number,
    quantity: number | null,
    checked: boolean | null,
  ) => void;
}

const Index = ({
  plan,
  selectedPlan,
  isActive,
  setSelectedPlan,
  onAddonChange,
}: IPLanProps) => {
  const [totalAmount, setTotalAmount] = useState(0);
  const addonCheck = (addonId: number) => (e: CheckboxChangeEvent) => {
    onAddonChange(addonId, null, e.target.checked);
  };
  const addonQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddonChange(Number(e.target.id), Number(e.target.value), null);
  };

  useEffect(() => {
    let amount = plan.amount;
    if (plan.addons != null && plan.addons.length > 0) {
      plan.addons.forEach((a) => {
        if (a.checked && Number.isInteger(Number(a.quantity))) {
          amount += Number(a.amount) * Number(a.quantity);
        }
      });
      if (isNaN(amount)) {
        amount = plan.amount;
      }
    }
    setTotalAmount(amount);
  }, [plan]);

  return (
    <div>
      <div className="flex h-8 items-center justify-center">
        {isActive ? (
          <span style={{ color: 'orange' }}>My Subscription</span>
        ) : null}
      </div>
      <div
        className="flex h-80 w-64 cursor-pointer flex-col items-center justify-center rounded-md px-2 py-2"
        onClick={() => setSelectedPlan(plan.id)}
        style={{
          border: `1px solid ${isActive ? 'orange' : '#EEE'}`,
          gap: '24px',
          background: selectedPlan == plan.id ? '#FFF' : '#FBFBFB',
          boxShadow:
            selectedPlan == plan.id
              ? 'rgba(0, 0, 0, 0.35) 0px 5px 15px'
              : 'unset',
        }}
      >
        <div style={{ fontSize: '28px' }}>{plan.planName}</div>
        <div>{plan.description}</div>

        {plan.addons && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {plan.addons.map((a) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Checkbox onChange={addonCheck(a.id)} checked={a.checked}>
                  <div style={{ display: 'flex' }}>
                    <div>
                      <div
                        style={{
                          width: '120px',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.planName}
                      </div>
                      <div style={{ fontSize: '11px' }}>{` ${showAmount(
                        a.amount,
                        a.currency,
                      )}/${a.intervalCount == 1 ? '' : a.intervalCount}${
                        a.intervalUnit
                      }`}</div>
                    </div>

                    <Input
                      id={a.id.toString()}
                      value={a.quantity || 0}
                      onChange={addonQuantityChange}
                      disabled={!a.checked}
                      size="small"
                      style={{ width: '48px', height: '24px' }}
                      placeholder="count"
                    />
                  </div>
                </Checkbox>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: '14px' }}>{`${showAmount(
          plan.amount,
          plan.currency,
        )}/${plan.intervalCount == 1 ? '' : plan.intervalCount}${
          plan.intervalUnit
        }`}</div>
        <div style={{ fontSize: '24px' }}>
          Total:&nbsp;
          {`${showAmount(totalAmount, plan.currency)}/${
            plan.intervalCount == 1 ? '' : plan.intervalCount
          }${plan.intervalUnit}`}
        </div>
      </div>
    </div>
  );
};

export default Index;
