import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { FormiController } from './FormiController';
import { FormiFieldTree } from './FormiFieldTree';
import { useFormiController } from './useFormiContext';

export function useFields<Tree extends FormiFieldTree>(controller?: FormiController<Tree>): Tree {
  const ctrl = useFormiController(controller);
  const fields = useSyncExternalStore(
    ctrl.subscribe,
    () => ctrl.getState().rootField.children,
    () => ctrl.getState().rootField.children
  );

  return fields as any;
}
