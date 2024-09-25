// import { Link } from "react-router-dom";

import { Result } from 'antd'

export default function NotFound() {
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
  )
}
