declare module 'use-sync-external-store' {
  export type SyncExternalStoreSubscribe = (callback: () => void) => () => void;

  export function useSyncExternalStore<Snapshot>(
    subscribe: SyncExternalStoreSubscribe,
    getSnapshot: () => Snapshot
  ): Snapshot;
}

declare module 'use-sync-external-store/extra' {
  export type SyncExternalStoreSubscribe = (callback: () => void) => () => void;

  export function useSyncExternalStoreExtra<Snapshot, Selection>(
    subscribe: SyncExternalStoreSubscribe,
    getSnapshot: () => Snapshot,
    selector: (snapshot: Snapshot) => Selection,
    isEqual?: (a: Selection, b: Selection) => boolean
  ): Selection;
}
