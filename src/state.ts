import { FormControllerAny } from './FormController';
import { Path } from './Path';
import { ImmutableFormiMap, ImmutableFormiMapDraft } from './FormiMap';
import * as f from './FormField';
import * as t from './types';
import { expectNever } from './utils';

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

export function createInitialState(controller: FormControllerAny, field: t.FieldAny): t.FormControllerState {
  return {
    fields: f.FormField.create(controller, field, Path.from()),
    states: ReadonlyMap.empty(),
  };
}

/**
 * TODO:
 * - Limit addIssue to children only !
 * - How to detect that children state have changed ?
 * - How to handle validation that emit error on another field ?
 */

export function reducer(state: t.FormControllerState, action: Action): t.FormControllerState {
  if (action.type === 'Mount') {
    // Validate all fields
    const statesDraft = state.states.draft();
    state.fields[t.FORMI_INTERNAL].traverse<boolean>((field, next) => {
      const childrenChanged = next(); // validate children first
      if (childrenChanged.length > 0 && childrenChanged.every((c) => c === false)) {
        // if has children but none changed, skip
        return false;
      }
      const prevState = statesDraft.getOrThrow(field.key);
      const nextState = validateField(field, prevState, action.data);
      if (nextState !== prevState) {
        statesDraft.set(field.key, nextState);
        return true;
      }
      return false;
    });
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

/**
 * Return new state or null if no change
 */
function validateField(
  formField: f.FormFieldOfAny,
  states: ImmutableFormiMapDraft<t.FieldKey, t.FieldStateAny>,
  state: t.FieldStateAny,
  data: FormData
): t.FieldStateAny {
  if (formField instanceof f.FormField_Value) {
    if (state.kind !== 'Value') {
      throw new Error('Invalid state');
    }
    return validateField_Value(formField, state, data);
  }
  if (formField instanceof f.FormField_Multiple) {
    if (state.kind !== 'Multiple') {
      throw new Error('Invalid state');
    }
    return validateField_Multiple(formField, state, data);
  }
}

function validateField_Value(formField: f.FormField_ValueAny, state: t.FieldState_ValueAny, data: FormData): t.FieldState_ValueAny {}

function validateField_Multiple(
  formField: f.FormField_MultipleAny,
  state: t.FieldState_MultipleAny,
  data: FormData
): t.FieldState_MultipleAny {}
