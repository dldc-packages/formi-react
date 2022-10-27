import React from 'react';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { FormiController } from './FormiController';
import { FieldStateOf, FormiIssues, OnSubmit } from './types';
import { useFormController, FormRefObject, FormRefCallback } from './useFormiController';
import { FormiFieldAny, FormiFieldOf } from './FormiField';
import { FormiDefAny } from './FormiDef';
import { FormiContextProvider } from './useFormiContext';
import { useFields } from './useFields';
import { FieldsBase, FieldsStates } from './useFieldsState';

export type UseFormiOptions<Def extends FormiDefAny> = {
  fields: Def;
  formName?: string;
  onSubmit?: OnSubmit<Def>;
  validateOnMount?: boolean;
  formRefObject?: MutableRefObject<HTMLFormElement | null>;
  issues?: FormiIssues<any>;
};

type HtmlFormProps = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

export type UseFormiResult<Def extends FormiDefAny> = {
  readonly controller: FormiController<Def>;
  readonly refObject: FormRefObject;
  readonly ref: FormRefCallback;
  readonly fields: FormiFieldOf<Def>;
  readonly useFieldState: <FormField extends FormiFieldAny>(field: FormField) => FieldStateOf<FormField>;
  readonly useFieldsState: <Fields extends FieldsBase>(fields: Fields) => FieldsStates<Fields>;
  // render a <form> with ref
  readonly Form: (props: Omit<HtmlFormProps, 'ref'>) => JSX.Element;
};

/**
 * Create a FormController then subscribe to form state
 */
export function useFormi<Def extends FormiDefAny>(options: UseFormiOptions<Def>): UseFormiResult<Def> {
  const { controller, ref, refObject, useFieldState, useFieldsState } = useFormController(options);

  const Form = useCallback(
    (props: Omit<HtmlFormProps, 'ref'>): JSX.Element => {
      return (
        <FormiContextProvider controller={controller}>
          <form {...props} ref={ref} {...props} />
        </FormiContextProvider>
      );
    },
    [controller, ref]
  );

  const fields = useFields(controller);

  return useMemo((): UseFormiResult<Def> => {
    return { controller, ref, refObject, Form, fields, useFieldState, useFieldsState };
  }, [Form, controller, fields, ref, refObject, useFieldState, useFieldsState]);
}
