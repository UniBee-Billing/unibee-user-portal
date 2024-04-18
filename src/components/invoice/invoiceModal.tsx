import { EditFilled, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Input, Modal, Row, Select, message } from 'antd';
import { useState } from 'react';

import { CURRENCY } from '../../constants';
import { daysBetweenDate, showAmount } from '../../helpers';
import { IProfile, InvoiceItem, UserInvoice } from '../../shared.types';

interface Props {
  isOpen: boolean;
  detail: UserInvoice;
  // items: InvoiceItem[] | null;
  closeModal: () => void;
}

const Index = ({ isOpen, detail, closeModal }: Props) => {
  const [loading, setLoading] = useState(false);
  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>(detail.lines);
  const defaultCurrency =
    detail == null || detail.lines == null || detail.lines.length == 0
      ? 'EUR'
      : detail.lines[0].currency; // assume all invoice items have the same currencies.
  const [currency, setCurrency] = useState(defaultCurrency);
  const taxPercentageTmp = detail == null ? '' : detail.taxPercentage / 100;
  const [taxPercentage, setTaxScale] = useState<string>(taxPercentageTmp + '');
  // to get a numerical value with 2 decimal points, but still not right
  // https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
  // TODO:
  // line1: 33.93 * 35
  // line2: 77.95 * 3
  // we get: 1421.3999999999
  const getTotal = (
    invoices: InvoiceItem[],
    asNumber?: boolean,
  ): string | number => {
    // if (asNumber == null) {
    // asNumber = false;
    // }
    if (invoices == null) {
      invoices = [];
    }
    let total = invoices.reduce(
      (accu, curr) =>
        accu +
        Math.round(
          (Number(curr.unitAmountExcludingTax) * (curr.quantity as number) +
            Number(curr.tax) +
            Number.EPSILON) *
            100,
        ) /
          100,
      0,
    );
    if (isNaN(total)) {
      if (asNumber) {
        return 0;
      } else return '';
      // return "";
    }

    total = Math.round((total + Number.EPSILON) * 100) / 100;
    // 3rd argument is 'whether ignoreFactor',
    // readonly: false, is used when admin need to create a new invoice, $100 need to be shown as $100, no factor considered
    return asNumber ? total : showAmount(total, currency, true);
  };

  return (
    <Modal
      title="Invoice Detail"
      open={isOpen}
      width={'820px'}
      footer={null}
      closeIcon={null}
    >
      <Row style={{ marginTop: '16px' }}>
        <Col span={4} style={{ fontWeight: 'bold' }}>
          Currency
        </Col>
        <Col span={4} style={{ fontWeight: 'bold' }}>
          Tax Rate
        </Col>
        <Col span={6} style={{ fontWeight: 'bold' }}>
          Invoice title
        </Col>
      </Row>
      <Row
        style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}
      >
        <Col span={4}>{currency}</Col>
        <Col span={4}>{taxPercentage}</Col>
        <Col span={6}>{detail?.invoiceName}</Col>
      </Row>

      <Row style={{ display: 'flex', alignItems: 'center' }}>
        <Col span={10}>
          <span style={{ fontWeight: 'bold' }}>Item description</span>
        </Col>
        <Col span={4}>
          <div style={{ fontWeight: 'bold' }}>Amount</div>
          <div style={{ fontWeight: 'bold' }}>(exclude Tax)</div>
        </Col>
        <Col span={1}></Col>
        <Col span={3}>
          <span style={{ fontWeight: 'bold' }}>Quantity</span>
        </Col>
        <Col span={2}>
          <span style={{ fontWeight: 'bold' }}>Tax</span>
        </Col>
        <Col span={3}>
          <span style={{ fontWeight: 'bold' }}>Total</span>
        </Col>
      </Row>
      {invoiceList &&
        invoiceList.map((v, i) => (
          <Row
            key={i}
            style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}
          >
            <Col span={10}>{v.description}</Col>
            <Col span={4}>
              {showAmount(v.unitAmountExcludingTax as number, v.currency, true)}
            </Col>
            <Col span={1} style={{ fontSize: '18px' }}>
              ×
            </Col>
            <Col span={3}>{v.quantity}</Col>
            <Col span={2}>{`${CURRENCY[currency].symbol} ${v.tax}`}</Col>
            <Col span={3}>{getTotal([invoiceList[i]])}</Col>
          </Row>
        ))}
      <Divider />

      <Row className="flex items-center">
        <Col span={20}></Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>{getTotal(invoiceList)}</span>
          {detail != null && detail.link != '' && detail.link != null && (
            <a
              href={detail.link}
              target="_blank"
              style={{ fontSize: '11px', marginLeft: '4px', color: '#757575' }}
              rel="noreferrer"
            >
              Payment Link
            </a>
          )}
        </Col>
      </Row>

      <div className="mt-6 flex items-center justify-end">
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button type="primary" onClick={closeModal} disabled={loading}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Index;
