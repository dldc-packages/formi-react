import { SubscribeMethod, Subscription } from 'suub';
import { FormiDefAny } from './FormiDef';
import { FormiField, FormiFieldAny } from './FormiField';
import { Path } from './tools/Path';

type FormiFieldsAction = never;

interface FormiFieldsStore {
  readonly subscribe: SubscribeMethod<FormiFieldAny>;
  readonly getState: () => FormiFieldAny;
  readonly dispatch: (action: FormiFieldsAction) => FormiFieldAny;
}

export const FormiFieldsStore = (() => {
  return create;

  function create(formName: string, def: FormiDefAny): FormiFieldsStore {
    let state = FormiField.createFrom(formName, def, Path.from());
    const subscription = Subscription<FormiFieldAny>();

    return {
      subscribe: subscription.subscribe,
      getState,
      dispatch,
    };

    function dispatch(action: FormiFieldsAction): FormiFieldAny {
      let nextState: FormiFieldAny;
      try {
        nextState = reducer(state, action);
      } catch (error) {
        console.error(error);
        return state;
      }
      if (nextState !== state) {
        state = nextState;
        subscription.emit(state);
      }
      return state;
    }

    function getState(): FormiFieldAny {
      return state;
    }
  }

  function reducer(state: FormiFieldAny, action: FormiFieldsAction): FormiFieldAny {
    console.log(action);
    return state;
  }
})();
