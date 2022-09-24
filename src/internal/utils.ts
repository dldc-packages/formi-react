import * as z from 'zod';
import {
  FieldAny,
  FieldsPaths,
  RawFields,
  FieldError,
  Path,
  FieldKey,
  FORM_INTERNAL,
} from './types';
import {
  isFieldArray,
  isFieldAny,
  isFieldObject,
  isFieldValue,
  isFieldValueState,
  isFieldArrayState,
  isFieldObjectState,
} from '../field';
import { FieldArrayState, FieldObjectState, FieldState, FieldValueState } from '../useField';
import { FieldsMap, FormStructure } from './FormController';
import { ReadonlyMap } from './ReadonlyMap';

export function extractZodError(error: z.ZodError): FieldError {
  const firstError = error.errors[0];
  // if ("unionErrors" in firstError) {
  //   const err = firstError.unionErrors[0];
  //   return { message: err.message, code: err. };
  // }
  return { message: firstError.message, code: firstError.code };
}

export type MountResult = {
  structure: FormStructure;
  fields: FieldsMap;
};

export function mountField<T extends FieldAny>(basePath: Path, field: T): MountResult {
  const fieldsMap: FieldsMap = ReadonlyMap.empty();
  if (isFieldArray(field)) {
    const selfKey = createFieldKey();
    const state: FieldArrayState<any> = {
      field,
      length: field.children.length,
      error: null,
    };
    fieldsMap.set(selfKey, state);
    const children: Array<FormStructure> = [];
    field.children.forEach((child, index) => {
      const { fields, structure } = mountField([...basePath, index], child);
      children.push(structure);
      fieldsMap.setEntries(fields.getAll());
    });
    return {
      structure: { kind: 'array', self: selfKey, children },
      fields: fieldsMap,
    };
  }
  if (isFieldObject(field)) {
    const selfKey = createFieldKey();
    const state: FieldObjectState<any> = {
      field,
      error: null,
    };
    fieldsMap.set(selfKey, state);
    const children: Record<string, FormStructure> = {};
    Object.entries(field.children).forEach(([key, child]) => {
      const { fields, structure } = mountField([...basePath, key], child);
      children[key] = structure;
      fieldsMap.setEntries(fields.getAll());
    });
    return {
      structure: { kind: 'object', self: selfKey, children },
      fields: fieldsMap,
    };
  }
  if (isFieldValue(field)) {
    const selfKey = createFieldKey();
    const parsed = field.schema.safeParse(field.initialValue);
    const error = parsed.success ? null : extractZodError(parsed.error);
    const state: FieldValueState<any> = {
      field,
      value: field.initialValue,
      isDirty: false,
      isTouched: false,
      error,
    };
    fieldsMap.set(selfKey, state);
    return {
      structure: selfKey,
      fields: fieldsMap,
    };
  }
  throw new Error('Unsupported field type');
}

export function createFieldKey(): FieldKey {
  return { [FORM_INTERNAL]: true };
}

export function fieldsToEntries<T extends FieldAny>(
  basePath: Path,
  fields: T
): Array<[path: FieldsPaths<T>, state: FieldState<FieldAny>]> {
  const items: Array<[path: FieldsPaths<T>, state: FieldState<FieldAny>]> = [];
  const queue: Array<{ path: FieldsPaths<T>; field: FieldAny }> = [
    { path: basePath as any, field: fields },
  ];
  while (queue.length > 0) {
    const { field, path } = queue.shift()!;
    if (isFieldArray(field)) {
      const state: FieldArrayState<any> = {
        field,
        length: field.children.length,
        error: null,
      };
      items.push([path, state]);
      field.children.forEach((subField, index) => {
        if (!isFieldAny(subField)) {
          throw new Error(`Children of an array must all be wrapper`);
        }
        queue.push({ path: [...path, index] as any, field: subField });
      });
      continue;
    }
    if (isFieldObject(field)) {
      const state: FieldObjectState<any> = {
        field,
        error: null,
      };
      items.push([path, state]);
      Object.entries(field.children).forEach(([key, subField]) => {
        queue.push({ path: [...path, key] as any, field: subField });
      });
      continue;
    }
    if (isFieldValue(field)) {
      const parsed = field.schema.safeParse(field.initialValue);
      const error = parsed.success ? null : extractZodError(parsed.error);
      const state: FieldValueState<any> = {
        field,
        value: field.initialValue,
        isDirty: false,
        isTouched: false,
        error,
      };
      items.push([path, state]);
      continue;
    }
    throw new Error(`Invalid field !`);
  }
  return items;
}

export function sortEntries(
  entries: Array<[path: Path, state: FieldState<FieldAny>]>
): Array<[path: Path, state: FieldState<FieldAny>]> {
  return [...entries].sort(([l], [r]) => {
    if (l.length !== r.length) {
      // shortest length first
      return l.length - r.length;
    }
    for (let i = 0; i < l.length; i++) {
      const lkey = l[i];
      const rkey = r[i];
      if (lkey === rkey) {
        continue;
      }
      if (typeof lkey === 'string' && typeof rkey === 'string') {
        return lkey.localeCompare(rkey);
      }
      if (typeof lkey === 'number' && typeof rkey === 'number') {
        return lkey - rkey;
      }
      // different type ? compare as string
      return lkey.toString().localeCompare(rkey.toString());
    }
    // same path, should not happen
    return 0;
  });
}

export function buildRawFromEntries<T extends FieldAny>(
  entries: Array<[path: Path, state: FieldState<FieldAny>]>
): RawFields<T> {
  const sorted = sortEntries(entries);
  let root: { value: any } | null = null;
  for (const [path, state] of sorted) {
    if (path.length === 0) {
      if (root !== null) {
        throw new Error('Root already set');
      }
      // set root
      if (isFieldValueState(state)) {
        root = { value: state.value };
        continue;
      }
      if (isFieldArrayState(state)) {
        root = { value: [] };
        continue;
      }
      if (isFieldObjectState(state)) {
        root = { value: {} };
        continue;
      }
      throw new Error(`Invalid state`);
    }
    if (root === null) {
      throw new Error('Root not set');
    }
    const key = path[path.length - 1];
    let current = root.value;
    path.slice(0, -1).forEach((k) => {
      current = current[k];
    });
    if (isFieldValueState(state)) {
      current[key] = state.value;
      continue;
    }
    if (isFieldArrayState(state)) {
      current[key] = [];
      continue;
    }
    if (isFieldObjectState(state)) {
      current[key] = {};
      continue;
    }
    throw new Error(`Invalid state`);
  }
  if (root === null) {
    throw new Error('Root not set');
  }
  return root.value;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function expectNever(_val: never): never {
  throw new Error('Unexpected Never');
}
