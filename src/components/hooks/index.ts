import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const APP_PATH = import.meta.env.BASE_URL;

const useCountdown = (
  initialVal: number,
): [number, boolean, () => void, () => void] => {
  const [currentVal, setCurrentVal] = useState(initialVal);
  const [counting, setCounting] = useState(false);
  const countdownReqId = useRef(0);

  const start = () => {
    const valBK = currentVal;
    let val = currentVal;
    let lastTime = new Date().getTime();
    setCounting(true);
    (function timer() {
      countdownReqId.current = requestAnimationFrame(timer);
      const currentTime = new Date().getTime();
      if (currentTime - lastTime >= 1000) {
        lastTime = currentTime;
        val--;
        val >= 0 && setCurrentVal(val); // I don't want to use many if/else checks
        val == 0 && setCounting(false);
        val < 0 &&
          (setCurrentVal(valBK), cancelAnimationFrame(countdownReqId.current));
      }
    })();
  };

  // after a stop, start() will start with initialValue, not from leftover value, 'resume' not implemented yet
  const stop = () => {
    cancelAnimationFrame(countdownReqId.current);
    setCurrentVal(initialVal);
    setCounting(false);
    countdownReqId.current = 0;
  };
  return [currentVal, counting, start, stop];
};

const useRelogin = () => {
  const navigate = useNavigate();
  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: 'session expired, please re-login' },
    });
  return relogin;
};

export { useCountdown, useRelogin };
