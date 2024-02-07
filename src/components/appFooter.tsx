import {
  FacebookOutlined,
  GithubOutlined,
  LinkedinOutlined,
  TwitterOutlined,
} from '@ant-design/icons';
import { Divider } from 'antd';
const APP_PATH = import.meta.env.BASE_URL;

const Index = () => (
  <div
    className="absolute bottom-0 flex h-36 w-full flex-col items-center justify-center text-white"
    style={{
      background: '#334b61',
    }}
  >
    <div style={{ width: '80%' }}>
      <Divider style={{ border: '#FFF', width: '80%' }}>
        <div style={{ display: 'flex', gap: '24px', color: '#FFF' }}>
          <GithubOutlined style={{ fontSize: '24px' }} />
          <TwitterOutlined style={{ fontSize: '24px' }} />
          <LinkedinOutlined style={{ fontSize: '24px' }} />
          <FacebookOutlined style={{ fontSize: '24px' }} />
        </div>
      </Divider>
      <div
        style={{
          color: '#FFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        {/* <img src={`${APP_PATH}UniBeeLogo.png`} height={"32px"} /> */}
        <span>Copyright © 2024 Multilogin, Inc.</span>
      </div>
    </div>
  </div>
);
export default Index;
