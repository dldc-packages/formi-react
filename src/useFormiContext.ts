import { FormiControllerAny, FormiErrors } from '@dldc/formi';
import { createContext, createElement, useContext } from 'react';

const FormiContext = createContext<FormiControllerAny | null>(null);

export interface FormiContextProviderProps {
  controller: FormiControllerAny;
  children: React.ReactNode;
}

export function FormiContextProvider({ controller, children }: FormiContextProviderProps) {
  return createElement(FormiContext.Provider, { value: controller }, children);
}

export function useFormiContext(): FormiControllerAny {
  const controller = useContext(FormiContext);
  if (!controller) {
    throw FormiErrors.MissingFormiContext.create();
  }
  return controller;
}

export function useMaybeFormiContext(): FormiControllerAny | null {
  return useContext(FormiContext);
}

export function useFormiController(controller?: FormiControllerAny): FormiControllerAny {
  const controllerContext = useMaybeFormiContext();
  const ctrl = controller ?? controllerContext;
  if (!ctrl) {
    throw FormiErrors.MissingFormiController.create();
  }
  return ctrl;
}
