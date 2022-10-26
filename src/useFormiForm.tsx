import React from 'react';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { FormiController } from './FormiController';
import { FormiIssues, OnSubmit } from './types';
import { useFormController, FormRefObject, FormRefCallback } from './useFormiController';
import { FormiFieldOf } from './FormiField';
import { FormiDefAny } from './FormiDef';
import { FormiContextProvider } from './useFormiContext';
import { useFormiControllerFields } from './useFormiControllerFields';

export type UseFormiFormOptions<Def extends FormiDefAny> = {
  fields: Def;
  formName?: string;
  onSubmit?: OnSubmit<Def>;
  validateOnMount?: boolean;
  formRefObject?: MutableRefObject<HTMLFormElement | null>;
  issues?: FormiIssues<any>;
};

type HtmlFormProps = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

export type UseFormiFormResult<Def extends FormiDefAny> = {
  controller: FormiController<Def>;
  refObject: FormRefObject;
  ref: FormRefCallback;
  fields: FormiFieldOf<Def>;
  // render a <form> with ref
  Form: (props: Omit<HtmlFormProps, 'ref'>) => JSX.Element;
};

/**
 * Create a FormController then subscribe to form state
 */
export function useFormiForm<Def extends FormiDefAny>(options: UseFormiFormOptions<Def>): UseFormiFormResult<Def> {
  const { controller, ref, refObject } = useFormController(options);

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

  const fields = useFormiControllerFields(controller);

  return useMemo((): UseFormiFormResult<Def> => ({ controller, ref, refObject, Form, fields }), [Form, controller, fields, ref, refObject]);
}
