import { SubscribeMethod, Subscription } from 'suub';
import { FormiDefAny } from './FormiDef';
import { FormiField, FormiFieldAny, FormiField_Repeat } from './FormiField';
import { Path } from './tools/Path';
import { expectNever } from './utils';

export type RepeatAction = { kind: 'Remove'; index: number } | { kind: 'Push' } | { kind: 'Unshift' };

export type FieldsAction = { kind: 'RepeatAction'; path: Path; action: RepeatAction } | { kind: 'Noop' };

export type FieldsStoreDispatch = (action: FieldsAction) => FormiFieldAny;

interface FieldsStore {
  readonly subscribe: SubscribeMethod<FormiFieldAny>;
  readonly getState: () => FormiFieldAny;
  readonly dispatch: FieldsStoreDispatch;
}

export const FieldsStore = (() => {
  return create;

  function create(formName: string, def: FormiDefAny): FieldsStore {
    let state = FormiField.createFromDef(formName, def, Path.from(), dispatch);
    const subscription = Subscription<FormiFieldAny>();

    return {
      subscribe: subscription.subscribe,
      getState,
      dispatch,
    };

    function dispatch(action: FieldsAction): FormiFieldAny {
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

  function reducer(state: FormiFieldAny, action: FieldsAction): FormiFieldAny {
    if (action.kind === 'RepeatAction') {
      return FormiField.updateIn(state, action.path, (field) => {
        if (field.kind !== 'Repeat') {
          throw new Error('Expected Repeat');
        }
        const repeatAction = action.action;
        if (repeatAction.kind === 'Push') {
          const newChild = FormiField.createFromDef(
            state.formName,
            field.def.children,
            action.path.append(field.children.length),
            FormiField.getDispatch(field)
          );
          const nextChildren = [...field.children, newChild];
          return FormiField_Repeat.clone(field, field.path, nextChildren);
        }
        if (repeatAction.kind === 'Unshift') {
          const newChild = FormiField.createFromDef(
            state.formName,
            field.def.children,
            action.path.append(0),
            FormiField.getDispatch(field)
          );
          const nextChildren = [newChild, ...field.children].map((child, index) => FormiField.setPath(child, field.path.append(index)));
          return FormiField_Repeat.clone(field, field.path, nextChildren);
        }
        if (repeatAction.kind === 'Remove') {
          const nextChildren = [...field.children];
          nextChildren.splice(repeatAction.index, 1);
          const updatedChildren = nextChildren.map((child, index) => FormiField.setPath(child, field.path.append(index)));
          return FormiField_Repeat.clone(field, field.path, updatedChildren);
        }
        return expectNever(repeatAction, (action) => {
          throw new Error(`Unhandled action ${JSON.stringify(action ?? null)}`);
        });
      });
    }
    if (action.kind === 'Noop') {
      return state;
    }
    return expectNever(action, (action) => {
      throw new Error(`Unhandled action ${JSON.stringify(action ?? null)}`);
    });
  }
})();
