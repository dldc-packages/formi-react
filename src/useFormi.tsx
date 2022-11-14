import React, { MutableRefObject, useCallback, useEffect, useId, useLayoutEffect as reactULE, useMemo, useRef, useState } from 'react';
import { FormiController, FormiControllerOptions } from './FormiController';
import { FormiFieldAny } from './FormiField';
import { FormiFieldTree } from './FormiFieldTree';
import { FormiIssues } from './FormiIssue';
import { FieldStateOf } from './FormiStore';
import { useFields } from './useFields';
import { FieldsStates, useFieldsState as useFieldsStateBase } from './useFieldsState';
import { useFieldState as useFieldStateBase } from './useFieldState';
import { FormiContextProvider } from './useFormiContext';

export type FormRefObject = MutableRefObject<HTMLFormElement | null>;
export type FormRefCallback = (form: HTMLFormElement | null) => void;

declare const window: any;

const useLayoutEffect = typeof window !== 'undefined' ? reactULE : useEffect;

export type UseFormiOptions<Tree extends FormiFieldTree> = Omit<
  FormiControllerOptions<Tree>,
  'formName' | 'initialIssues' | 'initialFields'
> & {
  formName?: string;
  formRefObject?: MutableRefObject<HTMLFormElement | null>;
  issues?: FormiIssues<any>;
  fields: Tree;
};

type HtmlFormProps = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

export type UseFormiResult<Tree extends FormiFieldTree> = {
  readonly controller: FormiController<Tree>;
  readonly refObject: FormRefObject;
  readonly ref: FormRefCallback;
  readonly fields: Tree;
  readonly setFields: (update: Tree | ((prev: Tree) => Tree)) => void;
  readonly useFieldState: <FormField extends FormiFieldAny>(field: FormField) => FieldStateOf<FormField>;
  readonly useFieldsState: <Tree extends FormiFieldTree>(fields: Tree) => FieldsStates<Tree>;
  // render a <form> with ref
  readonly Form: (props: Omit<HtmlFormProps, 'ref'>) => JSX.Element;
};

/**
 * Create a FormController then subscribe to form state
 */
export function useFormi<Tree extends FormiFieldTree>({
  formName,
  fields,
  issues,
  onSubmit,
  validateOnMount,
  formRefObject,
}: UseFormiOptions<Tree>): UseFormiResult<Tree> {
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
    FormiController<Tree>({ formName: formNameResolved, initialFields: fields, initialIssues: issues, onSubmit, validateOnMount })
  );

  const connectedFields = useFields<Tree>(controller);

  useLayoutEffect(() => {
    if (formRefObjectResolved.current) {
      controller.mount(formRefObjectResolved.current);
    }
  }, [controller, formRefObjectResolved, connectedFields]);

  useLayoutEffect(() => {
    if (onSubmit) {
      controller.setOnSubmit(onSubmit);
    }
  }, [controller, onSubmit]);

  useLayoutEffect(() => {
    controller.setFields(fields);
  }, [controller, fields]);

  useLayoutEffect(() => {
    if (issues) {
      controller.setIssues(issues);
    }
  }, [controller, issues]);

  const useFieldState = useCallback(
    function useFieldState<FormField extends FormiFieldAny>(field: FormField): FieldStateOf<FormField> {
      return useFieldStateBase<FormField>(field, controller);
    },
    [controller]
  );

  const useFieldsState = useCallback(
    function useFieldsState<Tree extends FormiFieldTree>(fields: Tree): FieldsStates<Tree> {
      return useFieldsStateBase<Tree>(fields, controller);
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

  return useMemo((): UseFormiResult<Tree> => {
    return {
      controller,
      ref: refCallback,
      refObject: formRefObjectResolved,
      Form,
      fields: connectedFields,
      useFieldState,
      useFieldsState,
      setFields: controller.setFields,
    };
  }, [Form, controller, connectedFields, formRefObjectResolved, refCallback, useFieldState, useFieldsState]);
}
