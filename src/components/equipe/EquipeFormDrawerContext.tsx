import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import type { EquipeFormDrawerHandle } from "./EquipeFormDrawer";

const EquipeFormDrawerReactContext = createContext<{
  drawerRef: RefObject<EquipeFormDrawerHandle | null>;
} | null>(null);

export function EquipeFormDrawerProvider({ children }: { children: ReactNode }) {
  const drawerRef = useRef<EquipeFormDrawerHandle>(null);
  return (
    <EquipeFormDrawerReactContext.Provider value={{ drawerRef }}>
      {children}
    </EquipeFormDrawerReactContext.Provider>
  );
}

export function useEquipeFormDrawerRef() {
  const ctx = useContext(EquipeFormDrawerReactContext);
  if (!ctx) {
    throw new Error("useEquipeFormDrawerRef doit être utilisé sous EquipeFormDrawerProvider");
  }
  return ctx.drawerRef;
}
