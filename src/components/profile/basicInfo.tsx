import { passwordSchema, showAmount } from '@/helpers'
import {
  getProfileWithMoreReq,
  logoutReq,
  resetPassReq,
  saveProfileReq
} from '@/requests'
import { Country, CreditType, IProfile } from '@/shared.types'
import {
  useAppConfigStore,
  useMerchantInfoStore,
  useProfileStore,
  useSessionStore
} from '@/stores'
import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Spin,
  message
} from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PaymentSelector from '../ui/paymentSelector'
import './basicInfo.css'
import EditCard from './editCard'

const APP_PATH = import.meta.env.BASE_URL // default is / (if no --base specified in build cmd)

const Index = () => {
  const appConfigStore = useAppConfigStore()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<IProfile | null>(null)
  const [form] = Form.useForm()
  const watchAccountType = Form.useWatch('type', form)
  const [countryList, setCountryList] = useState<Country[]>([])
  const [resetPasswordModal, setResetPasswordModal] = useState(false)
  const togglePasswordModal = () => setResetPasswordModal(!resetPasswordModal)
  const profileStore = useProfileStore()
  const [gatewayId, setGatewayId] = useState<number | undefined>(undefined) // payment gateway is not a antd native radio component, I have to manually update its value here
  const onGatewayChange = (gatewayId: number) => setGatewayId(gatewayId) // React.ChangeEventHandler<HTMLInputElement> = (evt) =>
  const [gatewayPaymentType, setGatewayPaymentType] = useState<
    string | undefined
  >(undefined)

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

  const onSave = async () => {
    const u = JSON.parse(JSON.stringify(form.getFieldsValue()))
    if (gatewayId != undefined) {
      u.gatewayId = gatewayId
      u.gatewayPaymentType = gatewayPaymentType
    }

    setLoading(true)
    const [saveProfileRes, err] = await saveProfileReq(u)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('saved')
    const { user } = saveProfileRes
    setGatewayId(user.gatewayId)
    setProfile(user)
    profileStore.setProfile(user)
  }

  const fetchData = async () => {
    setLoading(true)
    const [res, err] = await getProfileWithMoreReq(fetchData)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { user, countryList } = res
    setProfile(user)
    form.setFieldsValue(user)
    setGatewayId(user.gatewayId)
    setGatewayPaymentType(user.gatewayPaymentType)
    setCountryList(
      countryList.map((c: Country) => ({
        countryCode: c.countryCode,
        countryName: c.countryName
      }))
    )
  }

  const promoCredit = useMemo(() => {
    return profile?.promoCreditAccounts?.find(
      (p) => p.type == CreditType.PROMO_CREDIT && p.currency == 'EUR'
    )
  }, [profile])

  useEffect(() => {
    fetchData()
  }, [])

  const isCardPaymentSelected =
    appConfigStore.gateway.find(
      (g) => g.gatewayId == gatewayId && g.gatewayName == 'stripe'
    ) != null

  return (
    <div>
      {resetPasswordModal && (
        <ResetPasswordModal
          closeModal={togglePasswordModal}
          email={profileStore.email}
        />
      )}
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />

      <Form
        form={form}
        onFinish={onSave}
        // initialValues={profile ?? {}}
        labelCol={{ span: 7 }}
        disabled={loading}
      >
        <Form.Item label="ID" name="id" hidden>
          <Input disabled />
        </Form.Item>
        <Form.Item label="gatewayId" name="gatewayId" hidden>
          <Input disabled />
        </Form.Item>

        <Form.Item label="paymentMethod" name="paymentMethod" hidden>
          <Input disabled />
        </Form.Item>

        <Divider
          orientation="left"
          style={{ margin: '32px 0', color: '#757575' }}
        >
          General Info
        </Divider>
        <Row>
          <Col span={24}>
            <Form.Item label="Account Type" labelCol={{ span: 3 }}>
              <Form.Item name="type" noStyle>
                <Radio.Group disabled={profile?.type == 2}>
                  <Radio value={1}>Individual</Radio>
                  <Radio value={2}>Business</Radio>
                </Radio.Group>
              </Form.Item>
              <span className=" text-xs text-gray-400">
                You can switch account type from <b>Individual</b> to{' '}
                <b>Business</b>, but not the other way around.
              </span>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item
              label="First name"
              name="firstName"
              labelCol={{ span: 6 }}
              rules={[
                {
                  required: true,
                  message: 'Please input your first name!'
                }
              ]}
            >
              <Input style={{ width: '300px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Last name"
              name="lastName"
              labelCol={{ span: 6 }}
              rules={[
                {
                  required: true,
                  message: 'Please input your last name!'
                }
              ]}
            >
              <Input style={{ width: '300px' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item name="email" label="Email" labelCol={{ span: 6 }}>
              <Input disabled style={{ width: '300px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              labelCol={{ span: 6 }}
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
                style={{ width: '300px' }}
                showSearch
                placeholder="Type to search"
                optionFilterProp="children"
                filterOption={filterOption}
                options={countryList.map((c) => ({
                  label: c.countryName,
                  value: c.countryCode
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item
              label="City"
              name="city"
              labelCol={{ span: 6 }}
              rules={[
                {
                  required: watchAccountType == 2, // biz user
                  message: 'Please input your city!'
                }
              ]}
            >
              <Input style={{ width: '300px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="ZIP code"
              name="zipCode"
              labelCol={{ span: 6 }}
              rules={[
                {
                  required: watchAccountType == 2, // biz user
                  message: 'Please input your ZIP code!'
                }
              ]}
            >
              <Input style={{ width: '300px' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item
              label="Billing address"
              labelCol={{ span: 6 }}
              name="address"
              rules={[
                {
                  required: true,
                  message: 'Please input your billing address!'
                }
              ]}
            >
              <Input.TextArea rows={4} style={{ width: '300px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Company name"
              name="companyName"
              labelCol={{ span: 6 }}
              rules={[
                {
                  required: watchAccountType == 2, // biz user
                  message: 'Please input your company name!'
                }
              ]}
            >
              <Input style={{ width: '300px' }} />
            </Form.Item>

            <Form.Item
              label="Registration number"
              name="registrationNumber"
              labelCol={{ span: 6 }}
            >
              <Input style={{ width: '300px' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item
              label="VAT number"
              name="vATNumber"
              labelCol={{ span: 6 }}
              /* rules={[
                {
                  required: watchAccountType == 2, // biz user
                  message: 'Please input your VAT number!',
                },
              ]} */
            >
              <Input style={{ width: '300px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Phone number" name="phone" labelCol={{ span: 6 }}>
              <Input style={{ width: '300px' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item
              label="Payment Method"
              name="gatewayId"
              labelCol={{ span: 6 }}
            >
              <PaymentSelector
                selected={gatewayId}
                selectedPaymentType={gatewayPaymentType}
                onSelect={onGatewayChange}
                onSelectPaymentType={setGatewayPaymentType}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <div
              style={{
                visibility: isCardPaymentSelected ? 'visible' : 'hidden',
                position: 'relative',
                display: 'flex',
                maxWidth: '560px',
                height: '100%'
              }}
            >
              <div className="triangle-left" />
              <div
                style={{
                  left: '6px',
                  width: '100%',
                  borderRadius: '6px',
                  padding: '16px',
                  background: '#f5f5f5',
                  position: 'relative'
                  // border: '1px solid #eee',
                }}
              >
                <EditCard
                  defaultPaymentId={profile?.paymentMethod}
                  refresh={fetchData}
                />
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item
              label="Preferred language"
              name="language"
              labelCol={{ span: 6 }}
            >
              <Select
                style={{ width: '300px' }}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ru', label: 'Russian' },
                  { value: 'cn', label: 'Chinese' },
                  { value: 'vi', label: 'Vietnamese' },
                  { value: 'pt', label: 'Portuguese' }
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Divider
          orientation="left"
          style={{ margin: '32px 0', color: '#757575' }}
        >
          Promo Credit
        </Divider>
        <Row>
          <Col span={12}>
            <Form.Item label="Credit Amount" labelCol={{ span: 6 }}>
              {`${promoCredit?.amount} (${promoCredit && showAmount(promoCredit?.currencyAmount, promoCredit?.currency)})`}
            </Form.Item>
          </Col>
          <Col span={12}>{}</Col>
        </Row>

        <Divider
          orientation="left"
          style={{ margin: '32px 0', color: '#757575' }}
        >
          Social Media Contact
        </Divider>
        {[
          [
            { label: 'Telegram', name: 'telegram' },
            { label: 'WhatsApp', name: 'whatsAPP' }
          ],
          [
            { label: 'WeChat', name: 'weChat' },
            { label: 'LinkedIn', name: 'linkedIn' }
          ],
          [
            { label: 'Facebook', name: 'facebook' },
            { label: 'TikTok', name: 'tikTok' }
          ],
          [{ label: 'Other Social Info', name: 'otherSocialInfo' }]
        ].map((s, idx) => (
          <Row key={idx}>
            <Col span={12}>
              <Form.Item
                label={s[0].label}
                name={s[0].name}
                labelCol={{ span: 6 }}
              >
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              {s[1] != null && (
                <Form.Item
                  label={s[1].label}
                  name={s[1].name}
                  labelCol={{ span: 6 }}
                >
                  <Input style={{ width: '300px' }} />
                </Form.Item>
              )}
            </Col>
          </Row>
        ))}

        <div className="mx-8 my-8 flex justify-center">
          <Button onClick={togglePasswordModal}>Change Password</Button>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <Button
            type="primary"
            onClick={form.submit}
            disabled={loading}
            loading={loading}
          >
            Save
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default Index

interface IResetPassProps {
  email: string
  closeModal: () => void
}
const ResetPasswordModal = ({ email, closeModal }: IResetPassProps) => {
  const navigate = useNavigate()
  const profile = useProfileStore()
  const merchant = useMerchantInfoStore()
  const appConfig = useAppConfigStore()
  const sessionStore = useSessionStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const logout = async () => {
    const [_, err] = await logoutReq()
    if (null != err) {
      message.error(err.message)
      return
    }
    profile.reset()
    merchant.reset()
    appConfig.reset()
    sessionStore.reset()
    localStorage.removeItem('appConfig')
    localStorage.removeItem('merchantInfo')
    localStorage.removeItem('token')
    localStorage.removeItem('profile')
    localStorage.removeItem('session')
    navigate(`${APP_PATH}login`, {
      state: { msg: 'Password reset succeeded, please relogin.' }
    })
  }

  const onConfirm = async () => {
    const formValues = form.getFieldsValue()
    setLoading(true)
    const [_, err] = await resetPassReq(
      formValues.oldPassword,
      formValues.newPassword
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    await logout()
  }

  return (
    <Modal
      title="Change Password"
      open={true}
      width={'640px'}
      footer={null}
      closeIcon={null}
    >
      <Form
        form={form}
        onFinish={onConfirm}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        className="my-6"
        initialValues={{
          email,
          oldPassword: '',
          newPassword: '',
          newPassword2: ''
        }}
      >
        <Form.Item
          label="Old Password"
          name="oldPassword"
          dependencies={['newPassword']}
          rules={[
            {
              required: true,
              message: 'Please input your old password!'
            }
          ]}
        >
          <Input.Password />
        </Form.Item>

        {/* <div className="mb-4 flex justify-center text-red-500">{errMsg}</div> */}

        <Form.Item
          label="New Password"
          name="newPassword"
          dependencies={['newPassword2', 'oldPassword']}
          rules={[
            {
              required: true,
              message: 'Please input your new password!'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (getFieldValue('oldPassword') == value) {
                  return Promise.reject(
                    'New password should not be the same as old password.'
                  )
                }
                if (!passwordSchema.validate(value)) {
                  return Promise.reject(
                    'At least 8 characters containing lowercase, uppercase, number and special character.'
                  )
                }
                return Promise.resolve()
              }
            })
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="New Password Confirm"
          name="newPassword2"
          dependencies={['newPassword']}
          rules={[
            {
              required: true,
              message: 'Please retype your new password!'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value == getFieldValue('newPassword')) {
                  return Promise.resolve()
                }
                return Promise.reject('Please retype the same password')
              }
            })
          ]}
        >
          <Input.Password onPressEnter={form.submit} />
        </Form.Item>
      </Form>

      <div className="my-6 flex items-center justify-end">
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Button
          type="primary"
          onClick={form.submit}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}
