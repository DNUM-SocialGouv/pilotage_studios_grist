import { createContext, useContext, type ReactNode } from "react";
import type { GristPaData } from "./hooks/useGristPaData";
import { useGristPaData } from "./hooks/useGristPaData";

const GristPaContext = createContext<GristPaData | null>(null);

export function GristPaProvider({ children }: { children: ReactNode }) {
  const data = useGristPaData();
  return <GristPaContext.Provider value={data}>{children}</GristPaContext.Provider>;
}

export function useGristPa(): GristPaData {
  const ctx = useContext(GristPaContext);
  if (!ctx) {
    throw new Error("useGristPa doit être utilisé dans GristPaProvider");
  }
  return ctx;
}
