import fastDeepEqual from 'fast-deep-equal';
import { Subscription } from 'suub';
import { PathsCache } from './PathsCache';
import { ReadonlyPathMap } from './ReadonlyPathMap';
import {
  assertFieldArrayState,
  assertFieldValueState,
  isFieldArrayState,
  isFieldValueState,
} from '../field';
import {
  FieldAny,
  FormReducerAction,
  GetPathFn,
  FORM_INTERNAL,
  OnSubmit,
  FormPath,
  FieldsPaths,
  Entry,
  RawFields,
  FieldValue,
} from './types';
import {
  buildRawFromEntries,
  expectNever,
  extractZodError,
  fieldsToEntries,
  sortEntries,
} from './utils';
import { unstable_batchedUpdates } from 'react-dom';
import { useSyncExternalStoreExtra } from 'use-sync-external-store/extra';
import { FieldState, FieldValueState } from '../useField';
import { FormState } from '../useForm';
import React from 'react';

type StoreSubscribe = (onStoreChange: () => void) => () => void;

export type FormStateSelector<Result> = (state: FormControllerState) => Result;

export type Comparer<T> = (a: T, b: T) => boolean;

export type FormControllerState = {
  fields: ReadonlyPathMap<FieldState<FieldAny>>;
  form: FormState;
};

export type FormControllerDispatch = (action: FormReducerAction) => void;

function createInitialState<T extends FieldAny>(
  initialFields: T,
  pathsCache: PathsCache
): FormControllerState {
  return {
    fields: ReadonlyPathMap.fromEntries(fieldsToEntries([], initialFields), pathsCache),
    form: {
      isSubmitting: false,
      submitCount: 0,
    },
  };
}

function formControllerReducer(
  state: FormControllerState,
  action: FormReducerAction
): FormControllerState {
  if (action.type === 'SetFieldValue') {
    return {
      ...state,
      fields: state.fields.updateOrThrow(action.path, (state) => {
        if (!isFieldValueState(state)) {
          throw new Error('Invalid action');
        }
        const parsed = state.field.schema.safeParse(action.value);
        const error = parsed.success ? null : extractZodError(parsed.error);
        return {
          ...state,
          value: action.value,
          isDirty: fastDeepEqual(state.field.initialValue, action.value),
          error,
        };
      }),
    };
  }
  if (action.type === 'OnFieldBlur') {
    return {
      ...state,
      fields: state.fields.updateOrThrow(action.path, (state) => {
        if (!isFieldValueState(state)) {
          throw new Error('Invalid action');
        }
        if (state.isTouched) {
          return state;
        }
        return {
          ...state,
          isTouched: true,
        };
      }),
    };
  }
  if (action.type === 'FormSubmitWithError') {
    return {
      ...state,
      fields: state.fields.updateAll((state) => {
        if (!isFieldValueState(state)) {
          return state;
        }
        return {
          ...state,
          isTouched: true,
        };
      }),
    };
  }
  if (action.type === 'FormSubmit') {
    return {
      ...state,
      form: {
        ...state.form,
        isSubmitting: true,
        submitCount: state.form.submitCount + 1,
      },
    };
  }
  if (action.type === 'ArrayPush') {
    const arrayState = state.fields.getOrThrow(action.path);
    assertFieldArrayState(arrayState);
    const nextIndex = arrayState.length;
    const itemsToAdd = fieldsToEntries([...action.path, nextIndex], action.item);
    return {
      ...state,
      fields: state.fields
        .updateOrThrow(action.path, (state) => {
          if (!isFieldArrayState(state)) {
            return state;
          }
          return {
            ...state,
            length: state.length + 1,
          };
        })
        .setEntries(itemsToAdd),
    };
  }
  if (action.type === 'ArrayRemove') {
    const arrayState = state.fields.getOrThrow(action.path);
    assertFieldArrayState(arrayState);
    if (action.index >= arrayState.length) {
      // index does not exist, ignore
      return state;
    }
    const children = sortEntries(state.fields.getChildren(action.path));
    // remove item
    children.splice(action.index, 1);
    // update paths
    const updated = children.map(([, state], index): Entry => {
      return [[...action.path, index], state];
    });
    return {
      ...state,
      fields: state.fields
        // delete last one
        .delete([...action.path, arrayState.length - 1])
        // apply updated
        .setEntries(updated)
        // update length
        .updateOrThrow(action.path, (state) => {
          if (!isFieldArrayState(state)) {
            return state;
          }
          return { ...state, length: state.length - 1 };
        }),
    };
  }
  if (action.type === 'Reset') {
    return {
      fields: action.fields,
      form: {
        isSubmitting: false,
        submitCount: 0,
      },
    };
  }
  if (action.type === 'SetSubmitting') {
    if (state.form.isSubmitting === action.submitting) {
      return state;
    }
    return {
      ...state,
      form: {
        ...state.form,
        isSubmitting: action.submitting,
      },
    };
  }
  if (action.type === 'OnFieldReset') {
    return {
      ...state,
      fields: state.fields.updateOrThrow(
        action.path,
        (state): FieldValueState<FieldValue<any, any>> => {
          assertFieldValueState(state);
          const parsed = state.field.schema.safeParse(state.field.initialValue);
          const error = parsed.success ? null : extractZodError(parsed.error);
          return {
            ...state,
            error,
            value: state.field.initialValue,
            isTouched: false,
            isDirty: false,
          };
        }
      ),
    };
  }
  return expectNever(action);
}

export type FormControllerOptions<T extends FieldAny> = {
  initialFields: T;
  onSubmit?: OnSubmit<T>;
};

export class FormController<T extends FieldAny> {
  private readonly pathsCache = new PathsCache();
  private readonly subscription = Subscription<FormControllerState>();
  private readonly formPathCache = new Map<FieldsPaths<T>, FormPath<any>>();
  private onSubmit: OnSubmit<T>;
  private initialFields: T;
  private state: FormControllerState;

  constructor({ initialFields, onSubmit }: FormControllerOptions<T>) {
    this.state = createInitialState(initialFields, this.pathsCache);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.onSubmit = onSubmit ?? (() => {});
    this.initialFields = initialFields;
  }

  public readonly getPath: GetPathFn<T> = (...path) => {
    const p = this.pathsCache.get(path);
    let cached = this.formPathCache.get(p);
    if (!cached) {
      cached = {
        [FORM_INTERNAL]: { __field: {} as any, controller: this },
        path: this.pathsCache.get(path),
      };
      this.formPathCache.set(p, cached);
    }
    return cached;
  };

  public readonly getState = (): FormControllerState => {
    return this.state;
  };

  public readonly dispatch: FormControllerDispatch = (action: FormReducerAction): void => {
    this.state = formControllerReducer(this.state, action);
    unstable_batchedUpdates(() => {
      this.subscription.emit(this.state);
    });
  };

  public readonly setSubmitting = (submitting: boolean): void => {
    this.dispatch({ type: 'SetSubmitting', submitting });
  };

  public readonly reset = (): void => {
    const newFields = ReadonlyPathMap.fromEntries(
      fieldsToEntries([], this.initialFields),
      this.pathsCache
    );
    this.dispatch({ type: 'Reset', fields: newFields });
  };

  public readonly getValues = (): RawFields<T> => {
    const entries = this.state.fields.getAll();
    const values = buildRawFromEntries<T>(entries);
    return values;
  };

  public readonly submit = (event?: React.FormEvent<HTMLFormElement>): void => {
    if (event) {
      event.preventDefault();
    }
    const all = this.state.fields.getAll();
    const hasError = all.some(([, state]) => state.error !== null);
    if (hasError) {
      this.dispatch({ type: 'FormSubmitWithError' });
      return;
    }
    const values = buildRawFromEntries<T>(all);
    this.dispatch({ type: 'FormSubmit' });
    this.onSubmit(values, this);
  };

  public readonly subscribe = this.subscription.subscribe;

  public readonly setOnSubmit = (onSubmit: OnSubmit<T>): void => {
    this.onSubmit = onSubmit;
  };

  public readonly setInitialFields = (initialFields: T): void => {
    this.initialFields = initialFields;
  };

  public readonly useState: UseState = createUseState(this.getState, (cb: () => void) => {
    return this.subscribe(cb);
  });
}

export type UseState = <Result>(
  selector: FormStateSelector<Result>,
  comparer?: Comparer<Result>
) => Result;

function createUseState(getState: () => FormControllerState, subscribe: StoreSubscribe): UseState {
  return function useState<Result>(
    selector: FormStateSelector<Result>,
    comparer: Comparer<Result> = Object.is
  ): Result {
    return useSyncExternalStoreExtra(subscribe, getState, null, selector, comparer);
  };
}
