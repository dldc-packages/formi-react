import type { TFieldStateOf, TFormiControllerAny, TFormiFieldAny, TFormiFieldTree } from '@dldc/formi';
import { FormiErrors, FormiField } from '@dldc/formi';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { useFormiController } from './useFormiContext';

export type TFieldsStates<Tree extends TFormiFieldTree> = Tree extends null
  ? null
  : Tree extends TFormiFieldAny
  ? TFieldStateOf<Tree>
  : Tree extends Array<infer Inner extends TFormiFieldTree>
  ? ReadonlyArray<TFieldsStates<Inner>>
  : Tree extends Record<string, TFormiFieldAny>
  ? { [K in keyof Tree]: TFieldsStates<Tree[K]> }
  : never;

const IS_OBJECT = Symbol('IS_OBJECT');

export function useFieldsState<Tree extends TFormiFieldTree>(
  fields: Tree,
  controller?: TFormiControllerAny,
): TFieldsStates<Tree> {
  const ctrl = useFormiController(controller);

  const state = useSyncExternalStoreWithSelector(
    ctrl.subscribe,
    () => ctrl.getState().states,
    () => ctrl.getState().states,
    (states): any => {
      return select(fields);
      function select(f: TFormiFieldTree): any {
        if (f === null) {
          return null;
        }
        if (Array.isArray(f)) {
          return f.map(select);
        }
        if (FormiField.utils.isFormiField(f)) {
          const fieldState = states.get(f.key);
          if (!fieldState) {
            throw FormiErrors.MissingFieldState.create(f);
          }
          return fieldState;
        }
        const res: Record<string, any> = { [IS_OBJECT]: true };
        Object.entries(f).forEach(([k, v]) => {
          res[k] = select(v);
        });
        return res;
      }
    },
    isEqual,
  );

  return state;
}

/**
 * Shallow compare array and object with [IS_OBJECT] symbol.
 */
function isEqual(left: any, right: any): boolean {
  if (left === null || right === null) {
    return left === right;
  }
  if (typeof left !== typeof right) {
    return false;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }
    return left.every((l, i) => isEqual(l, right[i]));
  }
  if (left[IS_OBJECT] && right[IS_OBJECT]) {
    const keys = Object.keys(left);
    if (keys.length !== Object.keys(right).length) {
      return false;
    }
    return keys.every((k) => isEqual(left[k], right[k]));
  }
  return left === right;
}
