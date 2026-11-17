import { createContext, useContext, type ReactNode } from "react";

type ProStore = {};

const ProContext = createContext<ProStore | undefined>(undefined);

export function ProProvider({ children }: { children: ReactNode }) {
  return <ProContext.Provider value={{}}>{children}</ProContext.Provider>;
}

export function useProStore() {
  const context = useContext(ProContext);

  if (!context) {
    throw new Error("useProStore must be used inside ProProvider");
  }

  return context;
}
