import type {
  IFormiController,
  TFieldStateOf,
  TFormiFieldAny,
  TFormiFieldTree,
  TFormiIssues,
  TOnSubmit,
} from '@dldc/formi';
import { createFormiController } from '@dldc/formi';
import type { MutableRefObject } from 'react';
import React, { useLayoutEffect as reactULE, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useFieldState as useFieldStateBase } from './useFieldState';
import { useFields } from './useFields';
import type { TFieldsStates } from './useFieldsState';
import { useFieldsState as useFieldsStateBase } from './useFieldsState';
import { FormiContextProvider } from './useFormiContext';

export type TFormRefObject = MutableRefObject<HTMLFormElement | null>;
export type TFormRefCallback = (form: HTMLFormElement | null) => void;

declare const window: any;

const useLayoutEffect = typeof window !== 'undefined' ? reactULE : useEffect;

export interface IUseFormiOptions<Tree extends TFormiFieldTree> {
  initialFields: Tree;
  formName?: string;
  onSubmit?: TOnSubmit<Tree>;
  onReset?: () => void;
  validateOnMount?: boolean;
  formRefObject?: MutableRefObject<HTMLFormElement | null>;
  issues?: TFormiIssues<any>;
}

type THtmlFormProps = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

export interface IUseFormiResult<Tree extends TFormiFieldTree> {
  readonly controller: IFormiController<Tree>;
  readonly refObject: TFormRefObject;
  readonly ref: TFormRefCallback;
  readonly fields: Tree;
  readonly setFields: (update: Tree | ((prev: Tree) => Tree)) => void;
  readonly useFieldState: <FormField extends TFormiFieldAny>(field: FormField) => TFieldStateOf<FormField>;
  readonly useFieldsState: <Tree extends TFormiFieldTree>(fields: Tree) => TFieldsStates<Tree>;
  // render a <form> with ref
  readonly Form: (props: Omit<THtmlFormProps, 'ref'>) => JSX.Element;
}

/**
 * Create a FormController then subscribe to form state
 */
export function useFormi<Tree extends TFormiFieldTree>({
  formName,
  initialFields,
  issues,
  onSubmit,
  onReset,
  validateOnMount,
  formRefObject,
}: IUseFormiOptions<Tree>): IUseFormiResult<Tree> {
  const formId = useId();
  const formNameResolved = formName ?? formId;
  const defaultFormRefObject = useRef<HTMLFormElement | null>(null);

  const formRefObjectResolved = formRefObject ?? defaultFormRefObject;

  const [controller] = useState(() =>
    createFormiController<Tree>({
      formName: formNameResolved,
      initialFields,
      initialIssues: issues,
      onSubmit,
      onReset,
      validateOnMount,
    }),
  );

  const refCallback = useCallback(
    (form: HTMLFormElement | null) => {
      if (form === formRefObjectResolved.current) {
        return;
      }
      formRefObjectResolved.current = form;
      if (form === null) {
        controller.unmount();
      } else {
        controller.mount(form);
      }
    },
    [controller, formRefObjectResolved],
  );

  const fields = useFields<Tree>(controller);

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
    function useFieldState<FormField extends TFormiFieldAny>(field: FormField): TFieldStateOf<FormField> {
      return useFieldStateBase<FormField>(field, controller);
    },
    [controller],
  );

  const useFieldsState = useCallback(
    function useFieldsState<Tree extends TFormiFieldTree>(fields: Tree): TFieldsStates<Tree> {
      return useFieldsStateBase<Tree>(fields, controller);
    },
    [controller],
  );

  const Form = useCallback(
    (props: Omit<THtmlFormProps, 'ref'>): JSX.Element => {
      return (
        <FormiContextProvider controller={controller}>
          <form {...props} ref={refCallback} {...props} />
        </FormiContextProvider>
      );
    },
    [controller, refCallback],
  );

  return useMemo((): IUseFormiResult<Tree> => {
    return {
      controller,
      ref: refCallback,
      refObject: formRefObjectResolved,
      Form,
      fields,
      useFieldState,
      useFieldsState,
      setFields: controller.setFields,
    };
  }, [Form, controller, fields, formRefObjectResolved, refCallback, useFieldState, useFieldsState]);
}
