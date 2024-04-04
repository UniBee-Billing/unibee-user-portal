import { LoadingOutlined } from '@ant-design/icons';
import { Button, Col, Modal, Row, Spin, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { showAmount } from '../../helpers';
import { onetimepaymentListReq } from '../../requests';
import { IPlan } from '../../shared.types';

type TBuyRecord = {
  addon: IPlan;
  addonId: number;
  createTime: number;
  id: number;
  quantity: number;
  payment: null | {
    userId: number;
    failureReason: string;
    gatewayId: number;
    link: string;
    paidTime: number;
    totalAmount: number;
    status: 10 | 20 | 30 | 40; // 10-pending，20-success，30-failure, 40-cancel
  };
  status: 1 | 2 | 3 | 4; // 1-create, 2-paid, 3-cancel, 4-expired
  subscriptionId: string;
};

interface Props {
  subscriptionId: string;
  closeModal: () => void;
}
const Index = ({ subscriptionId, closeModal }: Props) => {
  const [loading, setLoading] = useState(false);
  const [buyList, setBuyList] = useState<TBuyRecord[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [list, err] = await onetimepaymentListReq(subscriptionId, fetchData);
    list.sort((a: any, b: any) => b.createTime - a.createTime);
    console.log('purchase list res: ', list);
    setLoading(false);
    if (null != err) {
      message.error(err.message);
      return;
    }
    setBuyList(list);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Modal
      title="Addon purchase record"
      width={'640px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div style={{ height: '24px' }}></div>
      <Row gutter={[16, 16]} style={{ fontWeight: 'bold', color: 'gray' }}>
        <Col span={6}>Addon name</Col>
        <Col span={4}>Price</Col>
        <Col span={3}>Quantity</Col>
        <Col span={6}>Created at</Col>
        <Col span={5}>Paid</Col>
      </Row>
      <div className="flex w-full flex-col">
        {loading ? (
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        ) : (
          buyList.map((c) => (
            <Row
              gutter={[16, 16]}
              key={c.id}
              style={{
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <Col span={6}>{c.addon.planName}</Col>
              <Col span={4}>{showAmount(c.addon.amount, c.addon.currency)}</Col>
              <Col span={3}>{c.quantity}</Col>
              <Col span={6}>
                {dayjs(c.createTime * 1000).format('YYYY-MMM-DD')}
              </Col>
              <Col span={5}>
                {c.status == 2 ? (
                  'Yes'
                ) : (
                  <div>
                    <span>No</span>
                    {c.payment && (
                      <a href={c.payment.link} target="_blank">
                        &nbsp;&nbsp;payment link
                      </a>
                    )}
                  </div>
                )}
              </Col>
            </Row>
          ))
        )}
      </div>
      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default Index;
