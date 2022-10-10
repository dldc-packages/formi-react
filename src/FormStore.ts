import { SubscribeMethod, Subscription } from 'suub';
import { FormControllerAny } from './FormController';
import { Action, createInitialState, reducer } from './state';
import { FieldAny, FormControllerState, NOT_SET } from './types';

export class FormStore {
  public readonly subscribe: SubscribeMethod<FormControllerState>;
  public readonly getState: () => FormControllerState;
  public readonly dispatch: (action: Action) => FormControllerState;
  public readonly hasErrors: () => boolean;
  /**
   * Get the final value of the form
   */
  public readonly getValues: () => any;

  constructor(controller: FormControllerAny, field: FieldAny) {
    let state: FormControllerState = createInitialState(controller, field);
    const subscription = Subscription<FormControllerState>();

    this.subscribe = subscription.subscribe;
    this.getState = getState;
    this.dispatch = dispatch;
    this.hasErrors = hasErrors;
    this.getValues = getValues;

    function hasErrors(): boolean {
      // TODO
      return true;
    }

    function getValues(): any {
      const rootState = state.states.getOrThrow(state.fields.key);
      if (rootState.public.value === NOT_SET) {
        throw new Error('No value');
      }
      return rootState.public.value;
    }

    function dispatch(action: Action): FormControllerState {
      console.log(action);
      let nextState: FormControllerState;
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

    function getState(): FormControllerState {
      return state;
    }
  }
}
