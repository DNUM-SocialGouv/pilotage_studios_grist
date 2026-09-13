import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import type { MissionEnfantDrawerHandle } from "./missionEnfantDrawerTypes.ts";

const MissionEnfantDrawerReactContext = createContext<{
  drawerRef: RefObject<MissionEnfantDrawerHandle | null>;
} | null>(null);

export function MissionEnfantDrawerProvider({ children }: { children: ReactNode }) {
  const drawerRef = useRef<MissionEnfantDrawerHandle>(null);
  return (
    <MissionEnfantDrawerReactContext.Provider value={{ drawerRef }}>
      {children}
    </MissionEnfantDrawerReactContext.Provider>
  );
}

export function useMissionEnfantDrawerRef() {
  const ctx = useContext(MissionEnfantDrawerReactContext);
  if (!ctx) {
    throw new Error(
      "useMissionEnfantDrawerRef doit être utilisé sous MissionEnfantDrawerProvider",
    );
  }
  return ctx.drawerRef;
}
