import { Button, Col, Divider, Popover, Row, Table, message } from 'antd';

import { ISubscription } from '../shared.types';
import { useAppConfigStore } from '../stores';
// import { useAppConfigStore, useProfileStore } from '../../stores';

// productUpdate.tsx has the same code, refactor it
const Index = ({
  sub,
  toggleModal,
}: {
  sub: ISubscription | null;
  toggleModal: () => void;
}) => {
  const appConfigStore = useAppConfigStore();
  const wireSetup = appConfigStore.gateway.find(
    (g) => g.gatewayName == 'wire_transfer',
  );
  let isWire = false;
  if (wireSetup != null && sub?.gatewayId == wireSetup.gatewayId) {
    isWire = true;
  }

  const getReminder = () => {
    let n;
    switch (sub!.status) {
      case 0:
        n = 'Your subscription is initializing, please wait a few moment.';
        break;
      case 1:
        n = (
          <div
            style={{
              color: '#757575',
              fontSize: '12px',
              background: '#fbe9e7',
              borderRadius: '4px',
              padding: '6px',
              marginBottom: '12px',
            }}
          >
            Your subscription has been created, but not activated, please go to{' '}
            <a href={sub!.link} target="_blank">
              checkout page
            </a>{' '}
            to finish the payment within 3 days. If you haven't finished the
            payment within 3 days, your subscription will be cancelled, or you
            can{' '}
            <Button type="link" style={{ padding: '0' }} onClick={toggleModal}>
              Cancel
            </Button>{' '}
            this subscription immediately.
          </div>
        );
        break;
      case 3:
        n = 'Your subscription is in pending status, please wait';
        break;
      default:
        n = '';
    }
    return n;
    // STATUS[sub?.status as keyof typeof STATUS]
  };

  if (sub == null || sub.status == 2) {
    // 2: active, only with this status, users can upgrade/downgrad/change
    return null; // nothing need to be shown on page.
  }
  return getReminder();
};

export default Index;
