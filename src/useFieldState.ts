import type { TFieldStateOf, TFormiControllerAny, TFormiFieldAny } from '@dldc/formi';
import { createMissingFieldState } from '@dldc/formi';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector.js';
import { useFormiController } from './useFormiContext';

export function useFieldState<FormField extends TFormiFieldAny>(
  field: FormField,
  controller?: TFormiControllerAny,
): TFieldStateOf<FormField> {
  const ctrl = useFormiController(controller);

  const state = useSyncExternalStoreWithSelector(
    ctrl.subscribe,
    () => ctrl.getState().states,
    () => ctrl.getState().states,
    (s): TFieldStateOf<FormField> => {
      const fieldState = s.get(field.key);
      if (!fieldState) {
        throw createMissingFieldState(field);
      }
      return fieldState as TFieldStateOf<FormField>;
    },
  );

  return state;
}
