import { Button, Form, Input, Modal, Select, message } from 'antd'
import { useEffect, useState } from 'react'
import { getCountryList, saveProfileReq } from '../../requests'
import { Country, IProfile } from '../../shared.types'
import { useProfileStore } from '../../stores'

interface Props {
  isOpen: boolean
  closeModal: () => void
  openPreviewModal: () => void
}
const Index = ({ isOpen, closeModal, openPreviewModal }: Props) => {
  // const appConfigStore = useAppConfigStore();
  const profile = useProfileStore.getState()
  const [form] = Form.useForm()
  const [countryList, setCountryList] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)

  const hiddenFields = [
    'id',
    'countryName',
    'vATNumber',
    'telegram',
    'whatsAPP',
    'weChat',
    'linkedIn',
    'facebook',
    'tikTok',
    'otherSocialInfo',
    'paymentMethod'
  ]

  const onConfirm = async () => {
    const user: IProfile = form.getFieldsValue()
    setLoading(true)
    const [_, err] = await saveProfileReq(user)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('saved')
    profile.setProfile(user)
    closeModal()
    openPreviewModal()
  }

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

  useEffect(() => {
    const fetchData = async () => {
      const [list, err] = await getCountryList()
      if (null != err) {
        message.error(err.message)
        return
      }
      setCountryList(
        list.map((c: Country) => ({
          countryCode: c.countryCode,
          countryName: c.countryName
        }))
      )
    }
    fetchData()
  }, [])

  const countryCode = Form.useWatch('countryCode', form)
  useEffect(() => {
    if (countryCode) {
      form.setFieldValue(
        'countryName',
        countryList.find((c) => c.countryCode == countryCode)!.countryName
      )
    }
  }, [countryCode])

  return (
    <Modal
      title="Fill out your billing address"
      width={'640px'}
      open={isOpen}
      footer={null}
      closeIcon={null}
    >
      <div style={{ height: '24px' }}></div>
      <Form
        form={form}
        name="basic"
        labelCol={{
          span: 5
        }}
        wrapperCol={{
          span: 16
        }}
        style={{
          maxWidth: 600
        }}
        initialValues={profile}
        autoComplete="off"
      >
        {hiddenFields.map((f, idx) => (
          <Form.Item key={idx} label={f} name={f} hidden>
            <Input disabled />
          </Form.Item>
        ))}
        <Form.Item label="First name" name="firstName">
          <Input />
        </Form.Item>

        <Form.Item label="Last name" name="lastName">
          <Input />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Phone"
          name="phone"
          rules={[
            {
              required: true,
              message: 'Please input your phone!'
            }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Country"
          name="countryCode"
          rules={[
            {
              required: true,
              message: 'Please select your country!'
            }
          ]}
        >
          <Select
            showSearch
            placeholder="Type to search"
            optionFilterProp="children"
            // onSearch={onSearch}
            filterOption={filterOption}
            options={countryList.map((c) => ({
              label: c.countryName,
              value: c.countryCode
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Billing address"
          name="address"
          rules={[
            {
              required: true,
              message: 'Please input your billing address!'
            }
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
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
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default Index
