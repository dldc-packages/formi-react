import { createElement, MutableRefObject, useCallback, useMemo } from 'react';
import { FormController } from './FormController';
import { FieldAny, OnSubmit } from './types';
import { useFormController, FormRefObject, FormRefCallback } from './useFormController';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { FormFieldOf } from './FormField';

export type UseFormOptions<Field extends FieldAny> = {
  fields: Field;
  formName?: string;
  onSubmit?: OnSubmit<Field>;
  formRefObject?: MutableRefObject<HTMLFormElement | undefined>;
};

type HtmlFormProps = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

export type UseFormResult<Field extends FieldAny> = {
  controller: FormController<Field>;
  refObject: FormRefObject;
  ref: FormRefCallback;
  fields: FormFieldOf<Field>;
  // render a <form> with ref
  Form: (props: Omit<HtmlFormProps, 'ref'>) => JSX.Element;
};

/**
 * Create a FormController then subscribe to form state
 */
export function useForm<Field extends FieldAny>(options: UseFormOptions<Field>): UseFormResult<Field> {
  const { controller, ref, refObject } = useFormController(options);

  const Form = useCallback(
    (props: Omit<HtmlFormProps, 'ref'>): JSX.Element => {
      return createElement('form', { ...props, ref: refObject });
    },
    [refObject]
  );

  const fields = useFields(controller);

  return useMemo((): UseFormResult<Field> => ({ controller, ref, refObject, Form, fields }), [Form, controller, fields, ref, refObject]);
}

export function useFields<Field extends FieldAny>(controller: FormController<Field>): FormFieldOf<Field> {
  const fields = useSyncExternalStoreWithSelector(
    controller.subscribe,
    () => controller.getState(),
    null,
    (s) => s.fields
  );

  return fields as any;
}
