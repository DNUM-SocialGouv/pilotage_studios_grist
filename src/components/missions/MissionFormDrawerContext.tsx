import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import type { MissionFormDrawerHandle } from "./MissionFormDrawer";

const MissionFormDrawerReactContext = createContext<{
  drawerRef: RefObject<MissionFormDrawerHandle | null>;
} | null>(null);

export function MissionFormDrawerProvider({ children }: { children: ReactNode }) {
  const drawerRef = useRef<MissionFormDrawerHandle>(null);
  return (
    <MissionFormDrawerReactContext.Provider value={{ drawerRef }}>
      {children}
    </MissionFormDrawerReactContext.Provider>
  );
}

export function useMissionFormDrawerRef() {
  const ctx = useContext(MissionFormDrawerReactContext);
  if (!ctx) {
    throw new Error("useMissionFormDrawerRef doit être utilisé sous MissionFormDrawerProvider");
  }
  return ctx.drawerRef;
}
