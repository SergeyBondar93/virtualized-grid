import { createContext, useContext, useEffect, useState } from "react";
import { createBgc } from "./data";

export const BGContext = createContext({ bgs: [] as any });

export const BGProvider = (props: any) => {
  const [bgs, setBgs] = useState(createBgc());

  useEffect(() => {
    setInterval(() => {
      setBgs(createBgc());
    }, 1000);
  }, []);

  return <BGContext.Provider value={{ bgs }} {...props} />;
};

export const useBGContext = () => useContext(BGContext).bgs;
