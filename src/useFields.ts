import type { IFormiController, TFormiFieldTree } from '@dldc/formi';
import { FormiFieldTree } from '@dldc/formi';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector.js';
import { useFormiController } from './useFormiContext';

/**
 * Subscribe to the entire fields tree.
 */
export function useFields<Tree extends TFormiFieldTree>(controller?: IFormiController<Tree>): Tree {
  const ctrl = useFormiController(controller);
  const fields = useSyncExternalStoreWithSelector(
    ctrl.subscribe,
    () => ctrl.getState(),
    () => ctrl.getState(),
    (state) => FormiFieldTree.unwrap(state.rootField, state.rootFieldWrapped),
  );

  return fields as any;
}
