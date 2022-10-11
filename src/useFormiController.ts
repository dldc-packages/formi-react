import { useLayoutEffect as reactULE, useState, useEffect, useId, MutableRefObject, useRef, useMemo, useCallback } from 'react';
import { FormiController } from './FormiController';
import { FormiDefAny } from './FormiDef';
import { OnSubmit } from './types';

export type FormRefObject = MutableRefObject<HTMLFormElement | undefined>;
export type FormRefCallback = (form: HTMLFormElement | undefined) => void;

export type UseFormControllerOptions<Def extends FormiDefAny> = {
  fields: Def;
  formName?: string;
  onSubmit?: OnSubmit<Def>;
  formRefObject?: FormRefObject;
};

export type UseFormControllerResult<Def extends FormiDefAny> = {
  controller: FormiController<Def>;
  refObject: FormRefObject;
  ref: FormRefCallback;
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
  formRefObject,
}: UseFormControllerOptions<Def>): UseFormControllerResult<Def> {
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

  const [controller] = useState(() => FormiController({ formName: formNameResolved, initialFields: fields, onSubmit }));

  useLayoutEffect(() => {
    if (onSubmit) {
      controller.setOnSubmit(onSubmit);
    }
    if (formRefObjectResolved.current) {
      controller.register(formRefObjectResolved.current);
    }
  }, [controller, formRefObjectResolved, onSubmit]);

  return useMemo((): UseFormControllerResult<Def> => {
    return {
      controller,
      refObject: formRefObjectResolved,
      ref: refCallback,
    };
  }, [controller, formRefObjectResolved, refCallback]);
}
