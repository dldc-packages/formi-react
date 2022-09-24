import { useMemo } from 'react';
import { FormStateSelector } from './internal/FormController';
import {
  FieldAny,
  FieldArray,
  FieldArrayItem,
  FieldError,
  FieldObject,
  FieldValue,
  FIELD_TYPE,
  FormPath,
  FORM_INTERNAL,
  GetPathFn,
} from './internal/types';

export type FieldArrayState<T extends FieldArray<any>> = {
  field: T;
  length: number;
  error: FieldError;
};

export type FieldObjectState<T extends FieldObject<any>> = {
  field: T;
  error: FieldError;
};

export type FieldValueState<T extends FieldValue<any, any>> = {
  field: T;
  value: T[typeof FORM_INTERNAL];
  isTouched: boolean;
  isDirty: boolean;
  error: FieldError;
};

// prettier-ignore
export type FieldState<T extends FieldAny> =
  T extends FieldObject<any> ? FieldObjectState<T> :
  T extends FieldArray<any> ? FieldArrayState<T> :
  T extends FieldValue<any, any> ? FieldValueState<T>
  : never;

export type FieldArrayActions<T extends FieldArray<any>> = {
  getPath: GetPathFn<T>;
  push: (obj: T[typeof FORM_INTERNAL]) => void;
  remove(index: number): void;
  insert: (index: number, value: FieldArrayItem<T>) => void;
  // swap: (indexA: number, indexB: number) => void;
  // move: (from: number, to: number) => void;
  // unshift: (value: FieldArrayItem<T>) => number;
  // pop(): FieldArrayItem<T> | undefined;
  // replace: (index: number, value: FieldArrayItem<T>) => void;
};

export type FieldObjectActions<T extends FieldObject<any>> = {
  getPath: GetPathFn<T>;
};

export type FieldValueActions<T extends FieldValue<any, any>> = {
  onBlur: () => void;
  setValue: (value: T[typeof FORM_INTERNAL]) => void;
  reset: () => void;
};

// prettier-ignore
export type FieldActions<T extends FieldAny> =
  T extends FieldObject<any> ? FieldObjectActions<T> :
  T extends FieldArray<any> ? FieldArrayActions<T> :
  T extends FieldValue<any, any> ? FieldValueActions<T>
  : never;

/**
 * Get state and actions for a field
 */
export function useField<T extends FieldAny>(
  formPath: FormPath<T>
): [FieldState<T>, FieldActions<T>] {
  const controller = formPath[FORM_INTERNAL].controller;
  const path = formPath.path;

  const selector = useMemo(
    (): FormStateSelector<FieldState<T>> => (state) => state.fields.getOrThrow(path) as any,
    [path]
  );

  const state = controller.useState(selector);
  const fieldType = state.field[FIELD_TYPE];
  const actions = useMemo((): FieldActions<T> => {
    if (fieldType === 'FieldArray') {
      const actions: FieldArrayActions<any> = {
        getPath: (...subPath) => controller.getPath(...([...path, ...subPath] as any)) as any,
        push: (item) => controller.dispatch({ type: 'ArrayPush', path, item }),
        remove: (index) => controller.dispatch({ type: 'ArrayRemove', path, index }),
        insert: (index, value) => controller.dispatch({ type: 'ArrayInsert', path, index, value }),
      };
      return actions as any;
    }
    if (fieldType === 'FieldObject') {
      const actions: FieldObjectActions<any> = {
        getPath: (...subPath) => controller.getPath(...([...path, ...subPath] as any)) as any,
      };
      return actions as any;
    }
    if (fieldType === 'FieldValue') {
      const actions: FieldValueActions<any> = {
        onBlur: () => controller.dispatch({ type: 'OnFieldBlur', path }),
        reset: () => controller.dispatch({ type: 'OnFieldReset', path }),
        setValue: (value) => controller.dispatch({ type: 'SetFieldValue', path, value }),
      };
      return actions as any;
    }
    throw new Error(`Unhandled field type`);
  }, [controller, fieldType, path]);

  return [state, actions];
}
