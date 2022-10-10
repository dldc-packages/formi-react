import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { FormFieldOfAny } from './FormField';
import * as t from './types';

export function useField<FormField extends FormFieldOfAny>(field: FormField): t.PublicFieldStateOf<FormField> {
  const controller = field.controller;

  const state = useSyncExternalStoreWithSelector(
    controller.subscribe,
    () => controller.getState(),
    null,
    (s): t.PublicFieldStateOf<FormField> => {
      const fieldState = s.states.get(field.key);
      if (!fieldState) {
        throw new Error('No field state, return default ?');
      }
      return fieldState.public;
    }
  );

  return state;
}
