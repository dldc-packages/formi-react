import { nanoid } from './utils';

const FORMI_KEY = Symbol('FORMI_KEY');

export interface FormiKey {
  readonly [FORMI_KEY]: true;
  readonly toString: () => string;
  readonly id: string;
}

export const FormiKey = (() => {
  return create;

  function create(): FormiKey {
    const id = nanoid(14);
    const print = `FormiKey(${id})`;
    const key: FormiKey = {
      [FORMI_KEY]: true,
      toString: () => print,
      id,
    };
    return key;
  }
})();
