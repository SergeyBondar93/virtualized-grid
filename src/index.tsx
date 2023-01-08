import React, { createContext, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { BGProvider } from "./BGContext";
import { createBgc } from "./data";


const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <BGProvider>
      <App />
    </BGProvider>
  </React.StrictMode>
);
