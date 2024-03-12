import { LoadingOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Modal, Row, Spin, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showAmount } from '../../helpers';
import { createUpdatePreviewReq, updateSubscriptionReq } from '../../requests';
import { IPlan, IPreview, InvoiceItemTotal } from '../../shared.types';

const APP_PATH = import.meta.env.BASE_URL;

interface Props {
  plan: IPlan;
  subscriptionId: string;
  closeModal: () => void;
  refresh: () => void; // after upgrade, refresh parent component
}

const Index = ({ plan, subscriptionId, closeModal, refresh }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // when the Modal is loading, preview is null, Modal has no content, but a loading spinner
  const [submitting, setSubmitting] = useState(false); // when user click submit, preview is not null, Modal has content.
  const [preview, setPreview] = useState<IPreview | null>(null);
  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: 'session expired, please re-login' },
    });

  const onConfirm = async () => {
    setSubmitting(true);
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    const [updateSubRes, err] = await updateSubscriptionReq(
      plan?.id,
      subscriptionId,
      addons.map((a) => ({
        quantity: a.quantity as number,
        addonPlanId: a.id,
      })),
      preview?.totalAmount as number,
      preview?.currency as string,
      preview?.prorationDate as number,
    );
    setSubmitting(false);
    if (null != err) {
      message.error(err.message);
      return;
    }

    const { paid, link } = updateSubRes;
    // if you're upgrading your plan, Stripe will use your card info from your last time purchase record.
    // so it won't redirect you to chckout form, only if your card is expired or has insufficient fund.
    // the payment will be done immediaetly(most of time).
    if (paid) {
      refresh();
      message.success('Plan updated');
      closeModal();
      return;
    }
    navigate(`${APP_PATH}profile/subscription`, {
      // receiving route hasn't read this msg yet.
      state: { msg: 'Subscription updated' },
    });
    window.open(link, '_blank');
  };

  useEffect(() => {
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    const fetchPreview = async () => {
      setLoading(true);
      const [previewRes, err] = await createUpdatePreviewReq(
        plan!.id,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        })),
        subscriptionId as string,
      );
      setLoading(false);
      if (null != err) {
        message.error(err.message);
        return;
      }

      setPreview(previewRes);
    };
    fetchPreview();
  }, []);

  return (
    <Modal
      title="Subscription Update Preview"
      maskClosable={false}
      open={true}
      footer={null}
      closeIcon={null}
      width={'720px'}
    >
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Spin
            spinning={true}
            indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
          />
        </div>
      ) : (
        preview != null && (
          <>
            <InvoiceLines label="Current Invoices" invoice={preview.invoice} />
            <InvoiceLines
              label="Next Billing Cycle Invoices"
              invoice={preview.nextPeriodInvoice}
            />
          </>
        )
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'end',
          alignItems: 'center',
          gap: '18px',
          marginTop: '24px',
        }}
      >
        <Button onClick={closeModal} disabled={loading || submitting}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={submitting}
          disabled={loading || submitting}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};

export default Index;

const InvoiceLines = ({
  invoice,
  label,
}: {
  invoice: InvoiceItemTotal | undefined;
  label: string;
}) => (
  <>
    <Divider orientation="left" style={{ margin: '32px 0', color: '#757575' }}>
      {label}
    </Divider>
    {invoice == null || invoice.lines.length == 0 ? (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: '16px',
          color: '#757575',
        }}
      >
        No Items
      </div>
    ) : (
      <>
        <Row style={{ fontWeight: 'bold', margin: '16px 0' }}>
          <Col span={8}>Description</Col>
          <Col span={4}>Quantity</Col>
          <Col span={4}>Amt(Exc Tax)</Col>
          <Col span={4}>Tax</Col>
          <Col span={4}>Amt</Col>
        </Row>
        {invoice.lines.map((i, idx) => (
          <div key={idx}>
            <Row>
              <Col span={8}>{i.description}</Col>
              <Col span={4}>{i.quantity}</Col>
              <Col span={4}>{showAmount(i.amountExcludingTax, i.currency)}</Col>
              <Col span={4}>{showAmount(i.tax, i.currency)}</Col>
              <Col span={4}>{showAmount(i.amount, i.currency)}</Col>
            </Row>
            {idx != invoice.lines.length - 1 && (
              <Divider style={{ margin: '8px 0' }} />
            )}
          </div>
        ))}

        <Row>
          <Col span={20}>
            <span style={{ fontSize: '18px' }}>Total</span>
          </Col>
          <Col span={4}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {' '}
              {`${showAmount(invoice.totalAmount, invoice.currency)}`}
            </span>
          </Col>
        </Row>
      </>
    )}
  </>
);
