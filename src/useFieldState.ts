import type { FieldStateOf, FormiControllerAny, FormiFieldAny } from '@dldc/formi';
import { FormiErrors } from '@dldc/formi';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { useFormiController } from './useFormiContext';

export function useFieldState<FormField extends FormiFieldAny>(
  field: FormField,
  controller?: FormiControllerAny,
): FieldStateOf<FormField> {
  const ctrl = useFormiController(controller);

  const state = useSyncExternalStoreWithSelector(
    ctrl.subscribe,
    () => ctrl.getState().states,
    () => ctrl.getState().states,
    (s): FieldStateOf<FormField> => {
      const fieldState = s.get(field.key);
      if (!fieldState) {
        throw FormiErrors.MissingFieldState.create(field);
      }
      return fieldState as FieldStateOf<FormField>;
    },
  );

  return state;
}
