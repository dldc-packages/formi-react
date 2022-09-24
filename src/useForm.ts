import { FormController } from './internal/FormController';
import { FieldAny } from './internal/types';
import { UseFormControllerOptions, useFormController } from './useFormController';

export type FormState = {
  isSubmitting: boolean;
  submitCount: number;
};

export type UserFormResult<T extends FieldAny> = [
  controller: FormController<T>,
  formState: FormState
];

export type UseFormOptions<T extends FieldAny> = UseFormControllerOptions<T>;

/**
 * Create a FormController then subscribe to form state
 */
export function useForm<T extends FieldAny>(options: UseFormOptions<T>): UserFormResult<T> {
  const controller = useFormController(options);

  const state = controller.useState((s) => s.form);

  return [controller, state];
}
