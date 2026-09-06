/** Sous-ensemble de l’API Custom Widget Grist (window.grist). */
export type GristRecord = Record<string, unknown> & { id: number };

export type GristFetchTableResult = Record<string, unknown[]> & { id: number[] };

export interface GristApi {
  ready: (options?: {
    requiredAccess?: "none" | "read table" | "full";
    allowSelectBy?: boolean;
  }) => void;
  onRecords: (callback: (records: GristRecord[]) => void) => void;
  onRecord: (callback: (record: GristRecord | null) => void) => void;
  docApi: {
    fetchTable: (tableId: string) => Promise<GristFetchTableResult>;
    fetchSelectedTable?: () => Promise<GristFetchTableResult>;
  };
}

declare global {
  interface Window {
    grist?: GristApi;
    __pilotageGristEarlyReady?: boolean;
  }
}
