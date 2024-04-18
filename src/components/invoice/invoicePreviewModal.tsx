import { Button, Col, Divider, Input, Modal, Row, Select, message } from 'antd';
interface Props {
  ivLink: string;
  closeModal: () => void;
}

const Index = ({ ivLink, closeModal }: Props) => {
  return (
    <Modal
      title="Invoice"
      open={true}
      width={'820px'}
      footer={null}
      closeIcon={null}
    >
      <object
        data={ivLink}
        type="application/pdf"
        style={{
          height: 'calc(100vh - 460px)',
          width: '100%',
          marginTop: '24px',
        }}
      >
        <p>
          <a href={ivLink}>Download invoice</a>
        </p>
      </object>

      <div className="mt-6 flex items-center justify-end gap-4">
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button type="primary" onClick={closeModal}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Index;
