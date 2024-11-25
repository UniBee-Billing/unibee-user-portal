import {
  Button,
  Form,
  Input,
  message,
  Radio,
  RadioChangeEvent,
  Select
} from 'antd'
import React, { useEffect, useState } from 'react'
import OtpInput from 'react-otp-input'
import { useNavigate } from 'react-router-dom'
import { emailValidate, passwordSchema } from '../helpers'
import { getCountryList, signUpReq, signUpVerifyReq } from '../requests'
import { Country } from '../shared.types'
import AppFooter from './appFooter'
import AppHeader from './appHeader'
import { useCountdown } from './hooks'

const APP_PATH = import.meta.env.BASE_URL

const Index = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [accountType, setAccountType] = useState('1') // 1: individual, 2: business, backend use number, front-end uses string
  const [countryList, setCountryList] = useState<Country[]>([])
  const [currentStep, setCurrentStep] = useState(0) // 0: signup-basic-info  |  1: enter verfication code
  const [submitting, setSubmitting] = useState(false)
  const [countVal, isCounting, startCountdown, stopCounter] = useCountdown(60)
  const [otp, setOtp] = useState('')
  const onOTPchange = (value: string) => {
    setOtp(value.toUpperCase())
  }

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

  const onAccountTypeChange = (evt: RadioChangeEvent) =>
    setAccountType(evt.target.value)

  const goLogin = () => navigate(`${APP_PATH}login`)

  // send basic signup info
  const onSubmitBasicInfo = async () => {
    const body = JSON.parse(JSON.stringify(form.getFieldsValue()))
    body.type = Number(accountType)
    if (accountType == '1') {
      delete body.companyName
      delete body.vATNumber
      delete body.address
      delete body.city
      delete body.zipCode
    }
    // return;
    setSubmitting(true)
    const [_, err] = await signUpReq(body)
    setSubmitting(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Verification code sent.')
    setCurrentStep(1)
    stopCounter()
    startCountdown()
  }

  // send verification code
  const onSubmitCode = async () => {
    setSubmitting(true)
    const [_, err] = await signUpVerifyReq({
      email: form.getFieldValue('email'),
      verificationCode: otp
    })
    setSubmitting(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    navigate(`${APP_PATH}login`, {
      state: { msg: 'Thanks for your sign-up.' }
    })
  }

  const signUpForm = (name: string) => (
    <div
      style={{ width: '580px', maxHeight: '480px', overflowY: 'auto' }}
      className=" mb-4 flex justify-center"
    >
      <Form
        form={form}
        name={name}
        onFinish={onSubmitBasicInfo}
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        style={{ maxWidth: 640, width: 480 }}
      >
        <Form.Item
          label="First Name"
          name="firstName"
          rules={[
            {
              required: true,
              message: 'Please input your first name!'
            }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Last Lame"
          name="lastName"
          rules={[
            {
              required: true,
              message: 'Please input yourn last name!'
            }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: 'Please input your Email!'
            },
            () => ({
              validator(_, value) {
                if (value != null && value != '' && emailValidate(value)) {
                  return Promise.resolve()
                }
                return Promise.reject('Invalid email address')
              }
            })
          ]}
        >
          <Input />
        </Form.Item>

        {accountType == '2' && (
          <Form.Item
            label="Company Name"
            name="companyName"
            rules={[
              {
                required: true,
                message: 'Please input your company name!'
              }
            ]}
          >
            <Input />
          </Form.Item>
        )}

        {accountType == '2' && (
          <Form.Item
            label="VAT number"
            name="vATNumber"
            /* rules={[
              {
                required: true,
                message: 'Please input your VAT number!',
              },
            ]}
            */
          >
            <Input />
          </Form.Item>
        )}

        <Form.Item label="Country Name" name="countryName" hidden>
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
            // style={{ width: '300px' }}
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

        {accountType == '2' && (
          <Form.Item
            label="City"
            name="city"
            rules={[
              {
                required: true,
                message: 'Please input your city name!'
              }
            ]}
          >
            <Input />
          </Form.Item>
        )}

        {accountType == '2' && (
          <Form.Item
            label="Zipcode"
            name="zipCode"
            rules={[
              {
                required: true,
                message: 'Please input your zipcode!'
              }
            ]}
          >
            <Input />
          </Form.Item>
        )}

        {accountType == '2' && (
          <Form.Item
            label="Address detail"
            name="address"
            rules={[
              {
                required: true,
                message: 'Please input your company address!'
              }
            ]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        )}

        <Form.Item
          label="Password"
          name="password"
          dependencies={['password2']}
          rules={[
            {
              required: true,
              message: 'Please input your password!'
            },
            () => ({
              validator(_, value) {
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
          label="Password Confirm"
          name="password2"
          dependencies={['password']}
          rules={[
            {
              required: true,
              message: 'Please retype your password!'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value == getFieldValue('password')) {
                  return Promise.resolve()
                }
                return Promise.reject('Please retype the same password')
              }
            })
          ]}
        >
          <Input.Password onPressEnter={form.submit} />
        </Form.Item>

        <Form.Item
          wrapperCol={{
            offset: 11,
            span: 8
          }}
        >
          <Button type="primary" onClick={form.submit} loading={submitting}>
            OK
          </Button>
        </Form.Item>
      </Form>
    </div>
  )

  useEffect(() => {
    const getCountries = async () => {
      const [vatCountryList, err] = await getCountryList()
      if (null != err) {
        message.error('Getting country list err')
        return
      }
      setCountryList(vatCountryList)
    }
    getCountries()
  }, [])

  return (
    <div
      style={{
        height: 'calc(100vh - 132px)',
        overflowY: 'auto'
      }}
    >
      <AppHeader />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '60px'
        }}
      >
        <h1 className="mb-9 mt-16">Customer Sign-up</h1>
        <div
          style={{
            width: '640px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            background: '#FFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '24px'
          }}
        >
          {currentStep == 0 ? (
            <>
              <Radio.Group onChange={onAccountTypeChange} value={accountType}>
                <Radio.Button value="1">Individual</Radio.Button>
                <Radio.Button value="2">Business</Radio.Button>
              </Radio.Group>
              <div className=" my-4"></div>
              {signUpForm(
                accountType == '1' ? 'individual-signup' : 'business-signup'
              )}
            </>
          ) : (
            <Form
              name="login_OTP_code"
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 17 }}
              style={{ maxWidth: 640, width: 480 }}
              autoComplete="off"
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '78px'
                }}
              >
                <h3>
                  Enter verification code for {form.getFieldValue('email')}
                </h3>
              </div>
              <OtpInput
                value={otp}
                onChange={onOTPchange}
                numInputs={6}
                shouldAutoFocus={true}
                skipDefaultStyles={true}
                inputStyle={{
                  height: '80px',
                  width: '60px',
                  border: '1px solid gray',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontSize: '36px'
                }}
                renderSeparator={<span style={{ width: '36px' }}></span>}
                renderInput={(props) => <input {...props} />}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  marginTop: '36px'
                }}
              >
                <Button
                  type="primary"
                  onClick={onSubmitCode}
                  loading={submitting}
                  disabled={submitting}
                  size="large"
                >
                  OK
                </Button>
                <div style={{ display: 'flex', margin: '12px 0' }}>
                  <Button
                    type="link"
                    onClick={() => setCurrentStep(0)}
                    disabled={submitting}
                  >
                    Go Back
                  </Button>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      maxWidth: '180px'
                    }}
                  >
                    <Button
                      type="link"
                      onClick={startCountdown}
                      disabled={isCounting as boolean}
                    >
                      Resend
                    </Button>
                    {isCounting && (
                      <div style={{ width: '100px' }}>
                        {' '}
                        in {countVal} seconds
                      </div>
                    )}
                  </div>
                  {/* <Button type="link" onClick={onSubmit} disabled={submitting}>
                  Resend
            </Button> */}
                </div>
              </div>
            </Form>
          )}
        </div>
        <>
          <div
            style={{
              display: 'flex',
              color: '#757575',
              justifyContent: 'center',
              alignItems: 'center'
              // margin: "-12px 0 18px 0",
            }}
          >
            Already have an account?
            <Button type="link" onClick={goLogin}>
              Login
            </Button>
          </div>
        </>
      </div>
      <AppFooter />
    </div>
  )
}

export default Index
