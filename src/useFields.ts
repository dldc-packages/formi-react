import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { FormiController } from './FormiController';
import { FormiFieldTree } from './FormiFieldTree';
import { useFormiController } from './useFormiContext';

export function useFields<Tree extends FormiFieldTree>(controller?: FormiController<Tree>): Tree {
  const ctrl = useFormiController(controller);
  const fields = useSyncExternalStoreWithSelector(
    ctrl.subscribe,
    () => ctrl.getState(),
    () => ctrl.getState(),
    (state) => FormiFieldTree.unwrap(state.rootField, state.rootFieldWrapped)
  );

  return fields as any;
}
