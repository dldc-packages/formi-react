import { FormiControllerAny } from './FormiController';
import { FormiFieldAny } from './FormiField';

const FORMI_KEY = Symbol('FORMI_KEY');

/**
 * Each field is given a unique key used to track it
 * (we don't user input name since it could change when you shift / unshift an array item for example)
 */
export type FormiKey = {
  readonly [FORMI_KEY]: true;
  // dynamically get the the field (used for debugging only)
  readonly field: FormiFieldAny;
};

export const FormiKey = (() => {
  return create;

  function create(controller: FormiControllerAny): FormiKey {
    const key: FormiKey = {
      [FORMI_KEY]: true,
      get field() {
        return controller.findFieldByKeyOrThrow(key);
      },
    };
    return key;
  }
})();
