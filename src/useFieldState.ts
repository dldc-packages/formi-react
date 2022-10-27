import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { FormiControllerAny } from './FormiController';
import { FormiFieldAny } from './FormiField';
import { FieldStateOf } from './types';
import { useFormiController } from './useFormiContext';

export function useFieldState<FormField extends FormiFieldAny>(field: FormField, controller?: FormiControllerAny): FieldStateOf<FormField> {
  const ctrl = useFormiController(controller);

  const state = useSyncExternalStoreWithSelector(
    ctrl.subscribeStates,
    () => ctrl.getStates(),
    null,
    (s): FieldStateOf<FormField> => {
      const fieldState = s.get(field.key);
      if (!fieldState) {
        throw new Error('No field state, return default ?');
      }
      return fieldState as FieldStateOf<FormField>;
    }
  );

  return state;
}
