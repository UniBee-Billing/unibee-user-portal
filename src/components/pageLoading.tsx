import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

const Index = (loading: boolean) => {
  return (
    <Spin
      spinning={loading}
      indicator={
        <LoadingOutlined style={{ fontSize: 32, color: "#FFF" }} spin />
      }
      fullscreen
    />
  );
};

export default Index;
