import { useLayoutEffect as reactULE, useState, useEffect, useId, MutableRefObject, useRef, useMemo, useCallback } from 'react';
import { FormiController } from './FormiController';
import { FormiDefAny } from './FormiDef';
import { FormiFieldAny } from './FormiField';
import { FieldStateOf, FormiIssues, OnSubmit } from './types';
import { FieldsBase, FieldsStates, useFieldsState as useFieldsStateBase } from './useFieldsState';
import { useFieldState as useFieldStateBase } from './useFieldState';

export type FormRefObject = MutableRefObject<HTMLFormElement | null>;
export type FormRefCallback = (form: HTMLFormElement | null) => void;

export type UseFormControllerOptions<Def extends FormiDefAny> = {
  fields: Def;
  formName?: string;
  onSubmit?: OnSubmit<Def>;
  validateOnMount?: boolean;
  formRefObject?: FormRefObject;
  issues?: FormiIssues<any>;
};

export type UseFormControllerResult<Def extends FormiDefAny> = {
  readonly controller: FormiController<Def>;
  readonly refObject: FormRefObject;
  readonly ref: FormRefCallback;
  readonly useFieldState: <FormField extends FormiFieldAny>(field: FormField) => FieldStateOf<FormField>;
  readonly useFieldsState: <Fields extends FieldsBase>(fields: Fields) => FieldsStates<Fields>;
};

declare const window: any;

const useLayoutEffect = typeof window !== 'undefined' ? reactULE : useEffect;

/**
 * Initialize a FormController
 */
export function useFormController<Def extends FormiDefAny>({
  fields,
  formName,
  onSubmit,
  validateOnMount,
  formRefObject,
  issues,
}: UseFormControllerOptions<Def>): UseFormControllerResult<Def> {
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
    FormiController<Def>({ formName: formNameResolved, fields, onSubmit, validateOnMount, initialIssues: issues })
  );

  useLayoutEffect(() => {
    if (onSubmit) {
      controller.setOnSubmit(onSubmit);
    }
    if (formRefObjectResolved.current) {
      controller.mount(formRefObjectResolved.current);
    }
  }, [controller, formRefObjectResolved, onSubmit]);

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

  return useMemo((): UseFormControllerResult<Def> => {
    return {
      controller,
      refObject: formRefObjectResolved,
      ref: refCallback,
      useFieldState,
      useFieldsState,
    };
  }, [controller, formRefObjectResolved, refCallback, useFieldState, useFieldsState]);
}
