// import { Link } from "react-router-dom";

import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  const goBack = () => navigate('/plans');

  return (
    <Result
      status="404"
      title="404"
      subTitle="Oops! This page doesn’t seem to exist."
      /* extra={
        <Button onClick={goBack} type="primary">
          Back Home
        </Button>
      } */
    />
  );
}
