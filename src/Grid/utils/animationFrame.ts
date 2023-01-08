/** @flow */

import { AnimationTimeoutId } from "../types";

type Callback = (timestamp: number) => void;
type CancelAnimationFrame = (requestId: number) => void;
type RequestAnimationFrame = (callback: Callback) => number;


// requestAnimationFrame() shim by Paul Irish
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
const request = requestAnimationFrame

const cancel = cancelAnimationFrame

export const raf: RequestAnimationFrame = request;
export const caf: CancelAnimationFrame = cancel;

export const cancelAnimationTimeout = (frame: AnimationTimeoutId) =>
  caf(frame.id);

/**
 * Recursively calls requestAnimationFrame until a specified delay has been met or exceeded.
 * When the delay time has been reached the function you're timing out will be called.
 *
 * Credit: Joe Lambert (https://gist.github.com/joelambert/1002116#file-requesttimeout-js)
 */
export const requestAnimationTimeout = (
  callback: Function,
  delay: number
): AnimationTimeoutId => {
  let start: any;
  // wait for end of processing current event handler, because event handler may be long
  Promise.resolve().then(() => {
    start = Date.now();
  });

  const timeout = () => {
    if (Date.now() - start >= delay) {
      // @ts-ignore
      callback.call();
    } else {
      frame.id = raf(timeout);
    }
  };

  const frame: AnimationTimeoutId = {
    id: raf(timeout),
  };

  return frame;
};
