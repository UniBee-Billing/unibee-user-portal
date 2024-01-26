import { Input } from "antd";

const { Search } = Input;
const APP_PATH = import.meta.env.BASE_URL;

const Index = () => (
  <div
    style={{
      position: "absolute",
      top: "0",
      height: "64px",
      padding: "0 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      background: "#334b61",
      color: "#FFF",
    }}
  >
    <div>
      <img src={`${APP_PATH}UniBeeLogo.png`} height={"32px"} />
      <span style={{ marginLeft: "8px", fontSize: "12px" }}>
        Your one-stop solution for billing and invoicing
      </span>
    </div>
    <ul style={{ marginBottom: "0", display: "flex", alignItems: "center" }}>
      <li style={{ display: "inline", marginRight: "16px" }}>
        <span>Home</span>
      </li>
      <li style={{ display: "inline", marginRight: "16px" }}>
        <span>About</span>
      </li>
      <li style={{ display: "inline", marginRight: "16px" }}>
        <span>Contact</span>
      </li>
      <li style={{ display: "inline", marginRight: "0px" }}>
        <Search style={{ width: 120 }} />
      </li>
    </ul>
  </div>
);
export default Index;
