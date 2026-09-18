import { createContext, useContext, type ReactNode } from "react";
import { useAclProfilData, type AclProfilData } from "./hooks/useAclProfilData";

const AclProfilContext = createContext<AclProfilData | null>(null);

export function AclProfilProvider({ children }: { children: ReactNode }) {
  const data = useAclProfilData();
  return <AclProfilContext.Provider value={data}>{children}</AclProfilContext.Provider>;
}

export function useAclProfil(): AclProfilData {
  const ctx = useContext(AclProfilContext);
  if (!ctx) {
    throw new Error("useAclProfil doit être utilisé dans AclProfilProvider");
  }
  return ctx;
}
