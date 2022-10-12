import { FormiControllerAny } from './FormiController';
import { Path } from './Path';
import { ImmutableFormiMap, ImmutableFormiMapDraft } from './FormiMap';
import * as f from './FormiField';
import * as t from './types';
import * as d from './FormiDef';
import { expectNever } from './utils';
import { FormiKey } from './FormiKey';

export type Action =
  | { type: 'FormSubmit'; data: FormData }
  | { type: 'FieldChange'; name: string; data: FormData }
  | { type: 'Validate'; data: FormData }
  | { type: 'Mount'; data: FormData };
// | { type: 'ArrayPush'; path: Path; item: FieldAny }
// | { type: 'ArrayRemove'; path: Path; index: number }
// | { type: 'ArrayInsert'; path: Path; index: number; value: FieldArrayItem<any> }
// | { type: 'SetSubmitting'; submitting: boolean }
// | { type: 'OnFieldBlur'; path: Path }
// | { type: 'OnFieldReset'; path: Path }
// | { type: 'SetFieldValue'; path: Path; value: any }
// | { type: 'FormSubmitWithError' }
// | { type: 'Reset'; fields: ReadonlyPathMap<FieldState<FieldAny>> };

export function createInitialState(controller: FormiControllerAny, field: d.FormiDefAny): t.FormiControllerState {
  return {
    fields: f.FormiField(controller, field, Path.from()),
    states: ImmutableFormiMap.empty(),
  };
}

/**
 * TODO:
 * - Limit addIssue to children only !
 * - How to detect that children state have changed ?
 * - How to handle validation that emit error on another field ?
 */

export function reducer(state: t.FormiControllerState, action: Action): t.FormiControllerState {
  if (action.type === 'Mount') {
    // Validate all fields
    const statesDraft = state.states.draft();
    f.FormiField.traverse(state.fields, (field, next) => {
      next(); // validate children first
      validateField(field, statesDraft, action.data);
    });
    if (statesDraft.changed === false) {
      return state;
    }
    return { ...state, states: statesDraft.commit() };
  }
  if (action.type === 'FieldChange') {
    throw new Error('Not implemented');
  }
  if (action.type === 'Validate') {
    throw new Error('Not implemented');
  }
  if (action.type === 'FormSubmit') {
    throw new Error('Not implemented');
  }

  // if (action.type === 'FieldChange') {
  //   const path = Path.parse(action.name);
  //   const field = state.fields.findByPathOrThrow(path);
  //   return {
  //     ...state,
  //     states: state.states.update(field.key, )
  //   }

  // }

  // if (action.type === 'FormSubmit') {
  //   const fields = applyValues(state.fields, action.values, { isMount: false, isSubmit: true });
  //   return {
  //     ...state,
  //     fields,
  //   };
  // }
  // if (action.type === 'Validate') {
  //   const fields = applyValues(state.fields, action.values, { isMount: action.isMount, isSubmit: false });
  //   if (fields === state.fields) {
  //     return state;
  //   }
  //   return {
  //     ...state,
  //     fields,
  //   };
  // }
  return expectNever(action, (action) => {
    throw new Error(`Unhandled action ${JSON.stringify(action ?? null)}`);
  });
}

// type ApplyOptions = { isMount: boolean; isSubmit: boolean };

// function applyValues(fields: t.FieldsStateMap, values: t.FormValues, options: ApplyOptions) {
//   return fields.updateMany(
//     values.map(([field]) => field[t.FORMI_INTERNAL].key),
//     (state, key) => {
//       if (state && state.kind !== 'FieldValue') {
//         console.warn('Cannot set value for non-value field');
//         return state;
//       }
//       if (state === undefined && options.isMount === false) {
//         throw new Error('Cannot set value for field that was not mounted');
//       }
//       const [field, value] = values.find(([field]) => field[t.FORMI_INTERNAL].key === key)!;
//       return applyValue(state, field[t.FORMI_INTERNAL].fieldDef, value, options);
//     }
//   );
// }

// function applyValue(
//   state: t.FieldValueState<t.FieldDefValueAny> | undefined,
//   fieldDef: t.FieldDefValueAny,
//   value: FormDataEntryValue,
//   options: ApplyOptions
// ): t.FieldValueState<t.FieldDefValueAny> {
//   // TODO: handle isMount => do no mark as touched
//   if (state === undefined) {
//     // mount new field state
//     return {
//       kind: 'FieldValue',
//       fieldDef,
//       public: {
//         formValue: value,
//         initialFormValue: value,
//         isDirty: false,
//         isTouched: false,
//         isSubmitted: options.isSubmit,
//         ...validateValue(fieldDef, value),
//       },
//     };
//   }
//   const nextIsSubmitted = options.isSubmit ? true : state.public.isSubmitted;
//   if (state.public.formValue === value && state.public.isSubmitted === nextIsSubmitted) {
//     // value did not change
//     return state;
//   }
//   return {
//     ...state,
//     public: {
//       ...state.public,
//       ...validateValue(fieldDef, value),
//       formValue: value,
//       isDirty: state.public.initialFormValue !== value,
//       isTouched: true,
//       isSubmitted: nextIsSubmitted,
//     },
//   };
// }

// export function extractZodError(error: z.ZodError): t.FieldError {
//   const firstError = error.errors[0];
//   // if ("unionErrors" in firstError) {
//   //   const err = firstError.unionErrors[0];
//   //   return { message: err.message, code: err. };
//   // }
//   return { message: firstError.message, code: firstError.code };
// }

// type ValidateResult = {
//   value: any | undefined;
//   error: t.FieldError;
// };

// function validateValue(fieldDef: t.FieldDefValueAny, value: FormDataEntryValue): ValidateResult {
//   const parsed = fieldDef.schema.safeParse(value);
//   if (parsed.success) {
//     return { value: parsed.data, error: null };
//   }
//   return { value: undefined, error: extractZodError(parsed.error) };
// }

// const defaultValueFieldState: t.FieldPublicState<t.FieldDefValueAny> = {
//   error: null,
//   isDirty: false,
//   isTouched: false,
//   isSubmitted: false,
//   formValue: null,
//   initialFormValue: null,
//   value: undefined,
// };

// const defaultArrayFieldState: t.FieldPublicState<t.FieldDefArray<any>> = {
//   error: null,
//   length: 0,
// };

// const defaultObjectFieldState: t.FieldPublicState<t.FieldDefObject<any>> = {
//   error: null,
// };

// export function getDefaultFieldPublicState(fieldDef: t.FieldDefAny): t.FieldPublicState<t.FieldDefAny> {
//   if (fieldDef[t.FIELD_TYPE] === 'FieldValue') {
//     return defaultValueFieldState;
//   }
//   if (fieldDef[t.FIELD_TYPE] === 'FieldArray') {
//     return defaultArrayFieldState;
//   }
//   if (fieldDef[t.FIELD_TYPE] === 'FieldObject') {
//     return defaultObjectFieldState;
//   }
//   return expectNever(fieldDef);
// }

// export type MountResult = {
//   tree: FormTree;
//   fields: FieldsStateMap;
// };

// export function mountField<T extends FieldAny>(basePath: Path, field: T): MountResult {
//   const fieldsMap: FieldsStateMap = ReadonlyMap.empty();
//   if (field[t.FIELD_TYPE] === 'FieldArray') {
//     const selfKey = createFieldKey();
//     const state: FieldArrayState<any> = {
//       kind: 'FieldArray',
//       field,
//       length: field.children.length,
//       error: null,
//     };
//     fieldsMap.set(selfKey, state);
//     const children: Array<FormTree> = [];
//     field.children.forEach((child, index) => {
//       const { fields, tree } = mountField([...basePath, index], child);
//       children.push(tree);
//       fieldsMap.setEntries(fields.getAll());
//     });
//     return {
//       tree: { kind: 'array', self: selfKey, children },
//       fields: fieldsMap,
//     };
//   }
//   if (field[FIELD_TYPE] === 'FieldObject') {
//     const selfKey = createFieldKey();
//     const state: FieldObjectState<any> = { kind: 'FieldObject', field, error: null };
//     fieldsMap.set(selfKey, state);
//     const children: Record<string, FormTree> = {};
//     Object.entries(field.children).forEach(([key, child]) => {
//       validatePathItem(key);
//       const { fields, tree } = mountField([...basePath, key], child);
//       children[key] = tree;
//       fieldsMap.setEntries(fields.getAll());
//     });
//     return {
//       tree: { kind: 'object', self: selfKey, children },
//       fields: fieldsMap,
//     };
//   }
//   if (field[FIELD_TYPE] === 'FieldValue') {
//     const selfKey = createFieldKey();
//     // const parsed = field.schema.safeParse(field.initialValue);
//     // const error = parsed.success ? null : extractZodError(parsed.error);
//     const state: FieldValueState<any> = {
//       kind: 'FieldValue',
//       field,
//       value: undefined,
//       formValue: null,
//       isDirty: false,
//       isTouched: false,
//       error: null,
//     };
//     fieldsMap.set(selfKey, state);
//     return { tree: { kind: 'value', self: selfKey }, fields: fieldsMap };
//   }
//   return expectNever(field, () => {
//     throw new Error('Unsupported field type');
//   });
// }

type FieldByKind = {
  Value: f.FormiField_ValueAny;
  Multiple: f.FormiField_MultipleAny;
  Validate: f.FormiField_ValidateAny;
  Array: f.FormiField_ArrayAny;
  Object: f.FormiField_ObjectAny;
};

type FieldStateByKind = {
  Value: t.FieldState_ValueAny;
  Multiple: t.FieldState_MultipleAny;
  Validate: t.FieldState_ValidateAny;
  Array: t.FieldState_ArrayAny;
  Object: t.FieldState_ObjectAny;
};

const FIELD_VALIDATOR: {
  [K in keyof FieldByKind]: (
    states: ImmutableFormiMapDraft<FormiKey, t.FieldStateAny>,
    formiField: FieldByKind[K],
    fieldState: FieldStateByKind[K],
    data: FormData
  ) => void;
} = {
  Value: () => {
    throw new Error('Not implemented');
  },
  Multiple: () => {
    throw new Error('Not implemented');
  },
  Validate: () => {
    throw new Error('Not implemented');
  },
  Array: () => {
    throw new Error('Not implemented');
  },
  Object: () => {
    throw new Error('Not implemented');
  },
};

/**
 * Return new state or null if no change
 */
function validateField(formiField: f.FormiFieldAny, states: ImmutableFormiMapDraft<FormiKey, t.FieldStateAny>, data: FormData): void {
  const fieldState = states.getOrThrow(formiField.key);
  if (fieldState.kind !== formiField.kind) {
    throw new Error('Invalid state (kind mismatch)');
  }
  const validator = FIELD_VALIDATOR[formiField.kind];
  validator(states, formiField as any, fieldState as any, data);
}
