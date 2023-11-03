import type { TFormiControllerAny } from '@dldc/formi';
import { createContext, createElement, useContext } from 'react';

const FormiContext = createContext<TFormiControllerAny | null>(null);

export interface IFormiContextProviderProps {
  controller: TFormiControllerAny;
  children: React.ReactNode;
}

export function FormiContextProvider({ controller, children }: IFormiContextProviderProps) {
  return createElement(FormiContext.Provider, { value: controller }, children);
}

export function useFormiContext(): TFormiControllerAny {
  const controller = useContext(FormiContext);
  if (!controller) {
    throw new Error(`useFormiContext must be used within a FormiContextProvider`);
  }
  return controller;
}

export function useMaybeFormiContext(): TFormiControllerAny | null {
  return useContext(FormiContext);
}

export function useFormiController(controller?: TFormiControllerAny): TFormiControllerAny {
  const controllerContext = useMaybeFormiContext();
  const ctrl = controller ?? controllerContext;
  if (!ctrl) {
    throw new Error(`useFormiController must be used within a FormiContextProvider`);
  }
  return ctrl;
}
