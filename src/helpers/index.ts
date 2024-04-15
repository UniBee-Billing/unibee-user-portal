import { CURRENCY } from '../constants';

export const passwordRegx =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*_^?&])[A-Za-z\d@.#$!%*_^?&]{8,15}$/;

export const showAmount = (
  amount: number,
  currency: keyof typeof CURRENCY,
): string => {
  const c = CURRENCY[currency];
  return `${c.symbol}${amount / c.stripe_factor}`;
};

export const timerBySec = (numSeconds: number, cb: (v: number) => void) => {
  let lastTime = new Date().getTime();
  (function timer() {
    const req = window.requestAnimationFrame(timer);
    const currentTime = new Date().getTime();

    if (currentTime - lastTime >= 1000) {
      lastTime = currentTime;
      numSeconds--;
      console.log('num sec: ', numSeconds);
      cb(numSeconds);
      if (numSeconds == 0) {
        cancelAnimationFrame(req);
      }
    }
  })();
};

export const daysBetweenDate = (
  start: string | number, // string: '2022-03-15', number: millisecond since Epoch
  end: string | number,
) => {
  const d1 = new Date(start).getTime(),
    d2 = new Date(end).getTime();
  return Math.ceil(Math.abs((d1 - d2) / (1000 * 60 * 60 * 24)));
};

export const emailValidate = (email: string) =>
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
