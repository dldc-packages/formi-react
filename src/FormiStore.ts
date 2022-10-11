import { SubscribeMethod, Subscription } from 'suub';
import { FormiControllerAny } from './FormiController';
import { FormiDefAny } from './FormiDef';
import { Action, createInitialState, reducer } from './state';
import { FormiControllerState } from './types';

export interface FormiStore {
  readonly subscribe: SubscribeMethod<FormiControllerState>;
  readonly getState: () => FormiControllerState;
  readonly dispatch: (action: Action) => FormiControllerState;
  readonly hasErrors: () => boolean;
  // Get the final value of the form
  readonly getValues: () => any;
}

export const FormiStore = (() => {
  return create;

  function create(controller: FormiControllerAny, def: FormiDefAny): FormiStore {
    let state: FormiControllerState = createInitialState(controller, def);
    const subscription = Subscription<FormiControllerState>();

    const self: FormiStore = {
      subscribe: subscription.subscribe,
      getState,
      dispatch,
      hasErrors,
      getValues,
    };
    return self;

    function hasErrors(): boolean {
      // TODO
      return true;
    }

    function getValues(): any {
      const rootState = state.states.getOrThrow(state.fields.key);
      if (rootState.public.value === undefined) {
        throw new Error('No value');
      }
      return rootState.public.value;
    }

    function dispatch(action: Action): FormiControllerState {
      console.log(action);
      let nextState: FormiControllerState;
      try {
        nextState = reducer(state, action);
      } catch (error) {
        console.error(error);
        return state;
      }
      if (nextState !== state) {
        // console.group('Fields state');
        // nextState.fields.forEach((val) => {
        //   console.log(val);
        // });
        // console.groupEnd();
        state = nextState;
        subscription.emit(state);
      }
      return state;
    }

    function getState(): FormiControllerState {
      return state;
    }
  }
})();
