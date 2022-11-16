import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { FormiControllerAny } from './FormiController';
import { FormiErrors } from './FormiError';
import { FormiFieldAny } from './FormiField';
import { FieldStateOf } from './FormiStore';
import { useFormiController } from './useFormiContext';

export function useFieldState<FormField extends FormiFieldAny>(field: FormField, controller?: FormiControllerAny): FieldStateOf<FormField> {
  const ctrl = useFormiController(controller);

  const state = useSyncExternalStoreWithSelector(
    ctrl.subscribe,
    () => ctrl.getState().states,
    () => ctrl.getState().states,
    (s): FieldStateOf<FormField> => {
      const fieldState = s.get(field.key);
      if (!fieldState) {
        throw FormiErrors.create.MissingFieldState(field);
      }
      return fieldState as FieldStateOf<FormField>;
    }
  );

  return state;
}
