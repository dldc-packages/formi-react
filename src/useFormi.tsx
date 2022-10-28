import React, { useLayoutEffect as reactULE, useEffect, useId, useRef, useState } from 'react';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { FormiController } from './FormiController';
import { FieldStateOf, FormiIssues, OnSubmit } from './types';
import { FormiFieldAny, FormiFieldOf } from './FormiField';
import { FormiDefAny } from './FormiDef';
import { FormiContextProvider } from './useFormiContext';
import { useFields } from './useFields';
import { FieldsBase, FieldsStates, useFieldsState as useFieldsStateBase } from './useFieldsState';
import { useFieldState as useFieldStateBase } from './useFieldState';

export type FormRefObject = MutableRefObject<HTMLFormElement | null>;
export type FormRefCallback = (form: HTMLFormElement | null) => void;

declare const window: any;

const useLayoutEffect = typeof window !== 'undefined' ? reactULE : useEffect;

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
export function useFormi<Def extends FormiDefAny>({
  fields: fieldsDef,
  formName,
  onSubmit,
  validateOnMount,
  formRefObject,
  issues,
}: UseFormiOptions<Def>): UseFormiResult<Def> {
  const formId = useId();
  const formNameResolved = formName ?? formId;
  const defaultFormRefObject = useRef<HTMLFormElement | null>(null);

  const formRefObjectResolved = formRefObject ?? defaultFormRefObject;

  const refCallback = useCallback(
    (form: HTMLFormElement | null) => {
      if (form === formRefObjectResolved.current) {
        return;
      }
      formRefObjectResolved.current = form;
    },
    [formRefObjectResolved]
  );

  const [controller] = useState(() =>
    FormiController<Def>({ formName: formNameResolved, fields: fieldsDef, onSubmit, validateOnMount, initialIssues: issues })
  );

  const fields = useFields(controller);

  useLayoutEffect(() => {
    if (formRefObjectResolved.current) {
      controller.mount(formRefObjectResolved.current);
    }
  }, [controller, formRefObjectResolved, fields]);

  useLayoutEffect(() => {
    if (onSubmit) {
      controller.setOnSubmit(onSubmit);
    }
  }, [controller, onSubmit]);

  useLayoutEffect(() => {
    if (issues) {
      controller.setIssues(issues);
    }
  }, [controller, issues]);

  const useFieldState = useCallback(
    function useFieldState<FormField extends FormiFieldAny>(field: FormField): FieldStateOf<FormField> {
      return useFieldStateBase(field, controller);
    },
    [controller]
  );

  const useFieldsState = useCallback(
    function useFieldsState<Fields extends FieldsBase>(fields: Fields): FieldsStates<Fields> {
      return useFieldsStateBase(fields, controller);
    },
    [controller]
  );

  const Form = useCallback(
    (props: Omit<HtmlFormProps, 'ref'>): JSX.Element => {
      return (
        <FormiContextProvider controller={controller}>
          <form {...props} ref={refCallback} {...props} />
        </FormiContextProvider>
      );
    },
    [controller, refCallback]
  );

  return useMemo((): UseFormiResult<Def> => {
    return { controller, ref: refCallback, refObject: formRefObjectResolved, Form, fields, useFieldState, useFieldsState };
  }, [Form, controller, fields, formRefObjectResolved, refCallback, useFieldState, useFieldsState]);
}
