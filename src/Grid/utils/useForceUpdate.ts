import { useState } from "react";

export const useForceUpdate = () => {
  const [count, setCount] = useState(0);

  return () => {
    setCount(count + 1);
  };
};
