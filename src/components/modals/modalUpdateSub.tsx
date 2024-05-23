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
    navigate(`${APP_PATH}my-subscription`, {
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
      console.log('update preview res: ', previewRes);
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
      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading || submitting}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading || submitting}
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
          <Col span={9}>Description</Col>
          <Col span={5}>Amt(Exc Tax)</Col>
          <Col span={5}>Quantity</Col>
          <Col span={5}>Amt</Col>
        </Row>
        {invoice.lines.map((i, idx) => (
          <div key={idx}>
            <Row>
              <Col span={9}>{i.description}</Col>
              <Col span={5}>
                {showAmount(i.unitAmountExcludingTax, i.currency)}
              </Col>
              <Col span={5}>{i.quantity}</Col>
              <Col span={5}>
                {showAmount(i.unitAmountExcludingTax * i.quantity, i.currency)}
              </Col>
            </Row>
            {idx != invoice.lines.length - 1 && (
              <Divider style={{ margin: '8px 0' }} />
            )}
          </div>
        ))}

        <Row>
          <Col span={19}>
            <div
              style={{
                fontSize: '18px',
                textAlign: 'right',
                marginRight: '18px',
              }}
            >
              VAT({`${invoice.taxPercentage / 100} %`})
            </div>
          </Col>
          <Col span={5}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {' '}
              {`${showAmount(invoice.taxAmount, invoice.currency)}`}
            </span>
          </Col>
        </Row>
        <Row>
          <Col span={19}>
            <div
              style={{
                fontSize: '18px',
                textAlign: 'right',
                marginRight: '18px',
              }}
            >
              Total
            </div>
          </Col>
          <Col span={5}>
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
