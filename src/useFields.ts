import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { FormiController } from './FormiController';
import { FormiDefAny } from './FormiDef';
import { FormiFieldOf } from './FormiField';
import { useFormiController } from './useFormiContext';

export function useFields<Def extends FormiDefAny>(controller?: FormiController<Def>): FormiFieldOf<Def> {
  const ctrl = useFormiController(controller);
  const fields = useSyncExternalStore(ctrl.subscribeFields, () => ctrl.getFields());

  return fields as any;
}
