import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import React from 'react';
import './pagination.css';

const Index = ({
  current,
  pageSize,
  disabled,
  onChange,
  isLastPage,
}: {
  current: number;
  pageSize: number;
  disabled: boolean;
  isLastPage?: boolean;
  onChange: (page: number, pageSize: number) => void;
}) => {
  const goForward = () => {
    if (disabled || isLastPage) {
      return;
    }
    onChange(current + 1, pageSize);
  };
  const goBackward = () => {
    if (disabled || current <= 1) {
      return;
    }
    onChange(current - 1, pageSize);
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <div
        onClick={goBackward}
        className={`${disabled || current == 1 ? ' cursor-not-allowed' : 'cursor-pointer'} pagination-prev`}
      >
        <LeftOutlined
          style={{ color: disabled || current == 1 ? '#BDBDBD' : 'unset' }}
        />
      </div>
      {current}{' '}
      <div
        onClick={goForward}
        className={`${disabled || isLastPage ? ' cursor-not-allowed' : 'cursor-pointer'} pagination-next`}
      >
        <RightOutlined style={{ color: disabled ? '#BDBDBD' : 'unset' }} />
      </div>
    </div>
  );
};

export default Index;
