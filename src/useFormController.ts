import { useLayoutEffect as reactULE, useState, useEffect, useId, MutableRefObject, useRef, useMemo, useCallback } from 'react';
import { FormController } from './FormController';
import { FieldAny, OnSubmit } from './types';

export type FormRefObject = MutableRefObject<HTMLFormElement | undefined>;
export type FormRefCallback = (form: HTMLFormElement | undefined) => void;

export type UseFormControllerOptions<Field extends FieldAny> = {
  fields: Field;
  formName?: string;
  onSubmit?: OnSubmit<Field>;
  formRefObject?: FormRefObject;
};

export type UseFormControllerResult<Field extends FieldAny> = {
  controller: FormController<Field>;
  refObject: FormRefObject;
  ref: FormRefCallback;
};

declare const window: any;

const useLayoutEffect = typeof window !== 'undefined' ? reactULE : useEffect;

/**
 * Initialize a FormController
 */
export function useFormController<Field extends FieldAny>({
  fields,
  formName,
  onSubmit,
  formRefObject,
}: UseFormControllerOptions<Field>): UseFormControllerResult<Field> {
  const formId = useId();
  const formNameResolved = formName ?? formId;
  const defaultFormRefObject = useRef<HTMLFormElement | undefined>();

  const formRefObjectResolved = formRefObject ?? defaultFormRefObject;

  const refCallback = useCallback(
    (form: HTMLFormElement | undefined) => {
      if (form === formRefObjectResolved.current) {
        return;
      }
      formRefObjectResolved.current = form;
    },
    [formRefObjectResolved]
  );

  const [controller] = useState(() => new FormController({ formName: formNameResolved, initialFields: fields, onSubmit }));

  useLayoutEffect(() => {
    if (onSubmit) {
      controller.setOnSubmit(onSubmit);
    }
    if (formRefObjectResolved.current) {
      controller.register(formRefObjectResolved.current);
    }
  }, [controller, formRefObjectResolved, onSubmit]);

  return useMemo((): UseFormControllerResult<Field> => {
    return {
      controller,
      refObject: formRefObjectResolved,
      ref: refCallback,
    };
  }, [controller, formRefObjectResolved, refCallback]);
}
