import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { FormiControllerAny } from './FormiController';
import { FormiErrors } from './FormiError';
import { FormiField, FormiFieldAny } from './FormiField';
import { FormiFieldTree } from './FormiFieldTree';
import { FieldStateOf } from './FormiStore';
import { useFormiController } from './useFormiContext';

export type FieldsStates<Tree extends FormiFieldTree> = Tree extends null
  ? null
  : Tree extends FormiFieldAny
  ? FieldStateOf<Tree>
  : Tree extends Array<infer Inner extends FormiFieldTree>
  ? ReadonlyArray<FieldsStates<Inner>>
  : Tree extends Record<string, FormiFieldAny>
  ? { [K in keyof Tree]: FieldsStates<Tree[K]> }
  : never;

const IS_OBJECT = Symbol('IS_OBJECT');

export function useFieldsState<Tree extends FormiFieldTree>(fields: Tree, controller?: FormiControllerAny): FieldsStates<Tree> {
  const ctrl = useFormiController(controller);

  const state = useSyncExternalStoreWithSelector(
    ctrl.subscribe,
    () => ctrl.getState().states,
    () => ctrl.getState().states,
    (states): any => {
      return select(fields);
      function select(f: FormiFieldTree): any {
        if (f === null) {
          return null;
        }
        if (Array.isArray(f)) {
          return f.map(select);
        }
        if (FormiField.utils.isFormiField(f)) {
          const fieldState = states.get(f.key);
          if (!fieldState) {
            throw FormiErrors.create.MissingFieldState(f);
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
    isEqual
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
