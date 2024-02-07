import { Input } from 'antd';

const { Search } = Input;
const APP_PATH = import.meta.env.BASE_URL;

const Index = () => (
  <div
    className="absolute top-0 z-50 flex h-16 w-full items-center justify-between px-6 py-0 text-white"
    style={{
      background: '#334b61',
    }}
  >
    <div>
      <img
        src={`${APP_PATH}Multilogin-logo-white-horizontal.svg`}
        height={'36px'}
      />
    </div>
    <ul style={{ marginBottom: '0', display: 'flex', alignItems: 'center' }}>
      <li style={{ display: 'inline', marginRight: '16px' }}>
        <span>Home</span>
      </li>
      <li style={{ display: 'inline', marginRight: '16px' }}>
        <span>About</span>
      </li>
      <li style={{ display: 'inline', marginRight: '16px' }}>
        <span>Contact</span>
      </li>
      <li style={{ display: 'inline', marginRight: '0px' }}>
        <Search style={{ width: 120 }} />
      </li>
    </ul>
  </div>
);
export default Index;
