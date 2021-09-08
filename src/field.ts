import * as z from 'zod';
import { FieldState, FieldArrayState, FieldObjectState, FieldValueState } from './useField';
import {
  FieldAny,
  FORM_INTERNAL,
  FIELD_TYPE,
  FieldArray,
  FieldObject,
  FieldValue,
  FieldObjectChildren,
} from './internal/types';

export const field = {
  value<ValidValue, Value>(
    schema: z.Schema<ValidValue>,
    initialValue: Value | ValidValue
  ): FieldValue<ValidValue, Value> {
    return {
      [FIELD_TYPE]: 'FieldValue',
      [FORM_INTERNAL]: {} as any,
      initialValue,
      schema,
    };
  },
  object<Children extends Record<string, FieldAny>>(children: Children): FieldObject<Children> {
    return {
      [FIELD_TYPE]: 'FieldObject',
      children,
    };
  },
  array<Children extends FieldAny>(children: Array<Children>): FieldArray<Children> {
    return {
      [FIELD_TYPE]: 'FieldArray',
      [FORM_INTERNAL]: {} as any,
      children,
    };
  },
};

export function isFieldAny(maybe: unknown): maybe is FieldAny {
  return maybe && (maybe as any)[FIELD_TYPE];
}

export function isFieldArray(maybe: FieldAny): maybe is FieldArray<any> {
  return maybe[FIELD_TYPE] === 'FieldArray';
}

export function isFieldObject(maybe: FieldAny): maybe is FieldObject<FieldObjectChildren> {
  return maybe[FIELD_TYPE] === 'FieldObject';
}

export function isFieldValue(maybe: FieldAny): maybe is FieldValue<any, any> {
  return maybe[FIELD_TYPE] === 'FieldValue';
}

export function isFieldArrayState(
  maybe: FieldState<FieldAny>
): maybe is FieldArrayState<FieldArray<any>> {
  return isFieldArray(maybe.field);
}

export function isFieldObjectState(
  maybe: FieldState<FieldAny>
): maybe is FieldObjectState<FieldObject<any>> {
  return isFieldObject(maybe.field);
}

export function isFieldValueState(
  maybe: FieldState<FieldAny>
): maybe is FieldValueState<FieldValue<any, any>> {
  return isFieldValue(maybe.field);
}

export function assertFieldArrayState(
  maybe: FieldState<FieldAny>
): asserts maybe is FieldArrayState<FieldArray<any>> {
  if (!isFieldArrayState(maybe)) {
    throw new Error(`Unexpected`);
  }
}

export function assertFieldObjectState(
  maybe: FieldState<FieldAny>
): asserts maybe is FieldObjectState<FieldObject<any>> {
  if (!isFieldObjectState(maybe)) {
    throw new Error(`Unexpected`);
  }
}

export function assertFieldValueState(
  maybe: FieldState<FieldAny>
): asserts maybe is FieldValueState<FieldValue<any, any>> {
  if (!isFieldValueState(maybe)) {
    throw new Error(`Unexpected`);
  }
}
