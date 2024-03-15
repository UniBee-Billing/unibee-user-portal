import React from 'react';
import { useAppConfigStore } from '../../stores';
import AmexIcon from './icon/amex.svg?react';
import BitcoinIcon from './icon/bitcoin-btc-logo.svg?react';
import EthIcon from './icon/ethereum-eth-logo.svg?react';
import LitecoinIcon from './icon/litecoin-ltc-logo.svg?react';
import MastercardIcon from './icon/mastercard.svg?react';
import UsdtIcon from './icon/tether-usdt-logo.svg?react';
import VisaIcon from './icon/visa.svg?react';

const Cards = [<VisaIcon />, <MastercardIcon />, <AmexIcon />];
const Cryptos = [<BitcoinIcon />, <EthIcon />, <UsdtIcon />, <LitecoinIcon />];

const Index = ({
  selected,
  onSelect,
}: {
  selected: number | undefined;
  onSelect: React.ChangeEventHandler<HTMLInputElement>;
}) => {
  const appConfig = useAppConfigStore();
  const gateways = appConfig.gateway
    .map((g) => ({
      ...g,
      label: g.gatewayName == 'stripe' ? 'Bank Card' : 'Cryptocurrency',
    }))
    .sort((a, b) => a.gatewayId - b.gatewayId);

  return (
    <div className="flex flex-col gap-3">
      {gateways.map((g) => {
        const isCard = g.gatewayName == 'stripe';
        return (
          <label
            key={g.gatewayId}
            htmlFor={isCard ? 'card-payment' : 'crypto-payment'}
            className={`flex h-12 w-full cursor-pointer items-center justify-between rounded border border-solid ${selected == g.gatewayId ? 'border-blue-500' : 'border-gray-200'} px-2`}
          >
            <div className="flex">
              <input
                type="radio"
                name="payment-method"
                id={isCard ? 'card-payment' : 'crypto-payment'}
                value={g.gatewayId}
                checked={g.gatewayId == selected}
                onChange={onSelect}
              />
              <div className="ml-2 flex justify-between">{g.label}</div>
            </div>
            <div className="flex items-center justify-center gap-2">
              {isCard
                ? Cards.map((c, idx) => (
                    <div key={idx} className="h-6 w-6">
                      <div className="h-6 w-6">{c}</div>
                    </div>
                  ))
                : Cryptos.map((c, idx) => (
                    <div key={idx} className="h-4 w-4">
                      {c}
                    </div>
                  ))}
            </div>
          </label>
        );
      })}
    </div>
  );
};

export default Index;
