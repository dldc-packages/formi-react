import { FormiField, FormiFieldAny } from './FormiField';
import { FieldStateOf } from './types';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { FormiControllerAny } from './FormiController';
import { useFormiController } from './useFormiContext';

export type FieldsBase = null | FormiFieldAny | FieldsBase[] | { [key: string]: FieldsBase };

export type FieldsStates<F extends FieldsBase> = F extends null
  ? null
  : F extends FormiFieldAny
  ? FieldStateOf<F>
  : F extends FieldsBase[]
  ? FieldsStates<F[number]>[]
  : F extends { [key: string]: FieldsBase }
  ? { [K in keyof F]: FieldsStates<F[K]> }
  : never;

const IS_OBJECT = Symbol('IS_OBJECT');

export function useFieldsState<Fields extends FieldsBase>(fields: Fields, controller?: FormiControllerAny): FieldsStates<Fields> {
  const ctrl = useFormiController(controller);

  const state = useSyncExternalStoreWithSelector(
    ctrl.subscribeStates,
    () => ctrl.getStates(),
    () => ctrl.getStates(),
    (s): any => {
      return select(fields);
      function select(f: FieldsBase): any {
        if (f === null) {
          return null;
        }
        if (Array.isArray(f)) {
          return f.map(select);
        }
        if (FormiField.isFormiField(f)) {
          const fieldState = s.get(f.key);
          if (!fieldState) {
            throw new Error('No field state, return default ?');
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
