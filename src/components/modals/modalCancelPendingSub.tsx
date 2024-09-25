import { Button, Modal, message } from 'antd'
import { useState } from 'react'
import { cancelSubReq } from '../../requests'
import { ISubscription } from '../../shared.types'

interface Props {
  subInfo: ISubscription | null | undefined
  closeModal: () => void
  refresh: () => void
}
const Index = ({ subInfo, closeModal, refresh }: Props) => {
  const [loading, setLoading] = useState(false)

  const onConfirm = async () => {
    setLoading(true)
    const [_, err] = await cancelSubReq(subInfo?.subscriptionId as string)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`Subscription cancelled`)
    closeModal()
    refresh()
  }

  return (
    <Modal
      title={'Cancel Subscription'}
      width={'640px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div style={{ margin: '16px 0' }}>
        {`Are you sure you want to cancel this subscription?`}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'end',
          alignItems: 'center',
          gap: '18px',
          marginTop: '24px'
        }}
      >
        <Button onClick={closeModal} disabled={loading}>
          No
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          Yes, Cancel it
        </Button>
      </div>
    </Modal>
  )
}

export default Index
