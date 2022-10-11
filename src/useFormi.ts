import { createElement, MutableRefObject, useCallback, useMemo } from 'react';
import { FormiController } from './FormiController';
import { OnSubmit } from './types';
import { useFormController, FormRefObject, FormRefCallback } from './useFormiController';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { FormiFieldOf } from './FormiField';
import { FormiDefAny } from './FormiDef';

export type UseFormiOptions<Def extends FormiDefAny> = {
  fields: Def;
  formName?: string;
  onSubmit?: OnSubmit<Def>;
  formRefObject?: MutableRefObject<HTMLFormElement | undefined>;
};

type HtmlFormProps = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

export type UseFormiResult<Def extends FormiDefAny> = {
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
export function useFormi<Def extends FormiDefAny>(options: UseFormiOptions<Def>): UseFormiResult<Def> {
  const { controller, ref, refObject } = useFormController(options);

  const Form = useCallback(
    (props: Omit<HtmlFormProps, 'ref'>): JSX.Element => {
      return createElement('form', { ...props, ref: refObject });
    },
    [refObject]
  );

  const fields = useFields(controller);

  return useMemo((): UseFormiResult<Def> => ({ controller, ref, refObject, Form, fields }), [Form, controller, fields, ref, refObject]);
}

export function useFields<Def extends FormiDefAny>(controller: FormiController<Def>): FormiFieldOf<Def> {
  const fields = useSyncExternalStoreWithSelector(
    controller.subscribe,
    () => controller.getState(),
    null,
    (s) => s.fields
  );

  return fields as any;
}
