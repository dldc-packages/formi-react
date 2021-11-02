import { useLayoutEffect, useState, useEffect } from 'react';
import { FormController } from './internal/FormController';
import { FieldAny, OnSubmit } from './internal/types';

export type UseFormControllerOptions<T extends FieldAny> = {
  initialFields: T;
  onSubmit?: OnSubmit<T>;
};

declare const window: any;

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useFormController<T extends FieldAny>({
  initialFields,
  onSubmit,
}: UseFormControllerOptions<T>): FormController<T> {
  const [controller] = useState(() => new FormController({ initialFields, onSubmit }));

  useIsomorphicLayoutEffect(() => {
    if (onSubmit) {
      controller.setOnSubmit(onSubmit);
    }
  }, [controller, onSubmit]);

  return controller;
}
