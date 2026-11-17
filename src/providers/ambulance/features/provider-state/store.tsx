import { createContext, useContext, type ReactNode } from "react";

type AmbulanceStore = {};

const AmbulanceContext = createContext<AmbulanceStore | undefined>(undefined);

export function AmbulanceProvider({ children }: { children: ReactNode }) {
  return (
    <AmbulanceContext.Provider value={{}}>{children}</AmbulanceContext.Provider>
  );
}

export function useAmbulanceStore() {
  const context = useContext(AmbulanceContext);

  if (!context) {
    throw new Error("useAmbulanceStore must be used inside AmbulanceProvider");
  }

  return context;
}
