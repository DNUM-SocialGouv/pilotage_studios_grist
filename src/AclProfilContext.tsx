import { createContext, useContext, type ReactNode } from "react";
import { useAclProfilData, type AclProfilData } from "./hooks/useAclProfilData";
import { PAGE_ACCESS_FAIL_CLOSED } from "./security/pageAccess";

const AclProfilContext = createContext<AclProfilData | null>(null);

export function AclProfilProvider({ children }: { children: ReactNode }) {
  const data = useAclProfilData();
  return <AclProfilContext.Provider value={data}>{children}</AclProfilContext.Provider>;
}

export function useAclProfil(): AclProfilData {
  const ctx = useContext(AclProfilContext);
  if (!ctx) {
    return {
      status: "loading",
      role: null,
      flags: PAGE_ACCESS_FAIL_CLOSED,
      error: null,
    };
  }
  return ctx;
}
