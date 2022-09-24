import * as z from 'zod';
import { FormController } from './FormController';
import { FieldState } from '../useField';
import { ReadonlyPathMap } from './ReadonlyPathMap';

export type Key = string | number;
export type Path = Array<Key>;

export type Entry = [path: Path, state: FieldState<FieldAny>];
export type Entries = Array<Entry>;

export const FORM_INTERNAL = Symbol('FORM_INTERNAL');
export const FIELD_TYPE = Symbol('FIELD_TYPE');

export type FieldObjectChildren = Record<string, FieldAny>;

export type FieldAny = FieldValue<any, any> | FieldObject<Record<string, any>> | FieldArray<any>;

export type FieldValue<ValidValue, Value> = {
  [FIELD_TYPE]: 'FieldValue';
  [FORM_INTERNAL]: Value | ValidValue;
  initialValue: Value | ValidValue;
  schema: z.Schema<ValidValue>;
};

export type FieldObject<Children extends FieldObjectChildren> = {
  [FIELD_TYPE]: 'FieldObject';
  children: Children;
};

export type FieldArray<Item extends FieldAny> = {
  [FIELD_TYPE]: 'FieldArray';
  [FORM_INTERNAL]: Item;
  children: Array<Item>;
};

export type FieldKey = { [FORM_INTERNAL]: true };

type SubFieldPaths<Prefix, T> = T extends FieldAny ? [Prefix, ...FieldsPaths<T>] : never;

// prettier-ignore
type FieldObjectPaths<T extends FieldObject<any>> = { [K in keyof T["children"]]: [K] | SubFieldPaths<K, T["children"][K]>; }[keyof T["children"]];

// prettier-ignore
type FieldArrayPaths<T extends FieldArray<any>> = T["children"] extends Array<infer V> ? [number] | SubFieldPaths<number, V> : never;

// prettier-ignore
export type FieldsPaths<T extends FieldAny> = T extends FieldObject<any> ? FieldObjectPaths<T> : T extends FieldArray<any> ? FieldArrayPaths<T> : never;

// prettier-ignore
type FieldFromPathAccess<T extends FieldAny, K> = 
  T extends FieldObject<infer Children> ? K extends keyof Children ? Children[K] : never :
  T extends FieldArray<infer Children> ? K extends number ? Children : never :
  never;

// prettier-ignore
export type FieldFromPath<T extends FieldAny, P> = P extends [infer First]  ? FieldFromPathAccess<T, First> : P extends [infer First, ...infer Rest] ? FieldFromPath<FieldFromPathAccess<T, First>, Rest> : never;

// prettier-ignore
export type RawFields<T> = 
  T extends FieldObject<infer Children> ? { [K in keyof Children]: RawFields<Children[K]> } :
  T extends FieldArray<infer Children> ? Array<RawFields<Children>> :
  T extends FieldValue<infer Val, any> ? Val
  : never;

export type FormPath<T extends FieldAny> = {
  [FORM_INTERNAL]: { __field: T; controller: FormController<any> };
  path: Path;
};

export type OnSubmit<T extends FieldAny> = (
  values: RawFields<T>,
  controller: FormController<T>
) => void;

export type GetPathFn<T extends FieldAny> = <P extends FieldsPaths<T>>(
  ...path: P
) => FormPath<FieldFromPath<T, P>>;

export type FieldError = null | { message: string; code: z.ZodIssueCode };

export type FieldArrayItem<T extends FieldArray<any>> = T extends FieldArray<infer Item>
  ? Item
  : never;

export type FormReducerAction =
  | { type: 'ArrayPush'; path: Path; item: FieldAny }
  | { type: 'ArrayRemove'; path: Path; index: number }
  | { type: 'ArrayInsert'; path: Path; index: number; value: FieldArrayItem<any> }
  | { type: 'SetSubmitting'; submitting: boolean }
  | { type: 'OnFieldBlur'; path: Path }
  | { type: 'OnFieldReset'; path: Path }
  | { type: 'SetFieldValue'; path: Path; value: any }
  | { type: 'FormSubmitWithError' }
  | { type: 'FormSubmit' }
  | { type: 'Reset'; fields: ReadonlyPathMap<FieldState<FieldAny>> };
