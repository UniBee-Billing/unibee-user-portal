import { GithubOutlined, LinkedinOutlined, XOutlined } from '@ant-design/icons'
import { Divider } from 'antd'

const Index = () => (
  <div
    className="absolute bottom-0 flex h-36 w-full flex-col items-center justify-center text-white"
    style={{
      background: '#334b61'
    }}
  >
    <div style={{ width: '80%' }}>
      <Divider style={{ border: '#FFF', width: '80%' }}>
        <div style={{ display: 'flex', gap: '24px', color: '#FFF' }}>
          <a
            href="https://github.com/UniBee-Billing"
            target="_blank"
            style={{ color: 'white' }}
          >
            <GithubOutlined style={{ fontSize: '24px' }} />
          </a>
          <XOutlined style={{ fontSize: '24px' }} />

          <LinkedinOutlined style={{ fontSize: '24px' }} />
        </div>
      </Divider>
      <div
        style={{
          color: '#FFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}
      >
        <span>Copyright © {new Date().getFullYear()} UniBee</span>
      </div>
    </div>
  </div>
)
export default Index
