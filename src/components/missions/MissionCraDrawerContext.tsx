import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import type { MissionCraDrawerHandle } from "./missionCraDrawerTypes.ts";

const MissionCraDrawerReactContext = createContext<{
  drawerRef: RefObject<MissionCraDrawerHandle | null>;
} | null>(null);

export function MissionCraDrawerProvider({ children }: { children: ReactNode }) {
  const drawerRef = useRef<MissionCraDrawerHandle>(null);
  return (
    <MissionCraDrawerReactContext.Provider value={{ drawerRef }}>
      {children}
    </MissionCraDrawerReactContext.Provider>
  );
}

export function useMissionCraDrawerRef() {
  const ctx = useContext(MissionCraDrawerReactContext);
  if (!ctx) {
    throw new Error(
      "useMissionCraDrawerRef doit être utilisé sous MissionCraDrawerProvider",
    );
  }
  return ctx.drawerRef;
}
