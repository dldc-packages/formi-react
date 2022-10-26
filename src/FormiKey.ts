const FORMI_KEY = Symbol('FORMI_KEY');

export interface FormiKey {
  readonly [FORMI_KEY]: true;
  readonly toString: () => string;
}

export const FormiKey = (() => {
  return create;

  function create(): FormiKey {
    const key: FormiKey = {
      [FORMI_KEY]: true,
      toString: () => `FormiKey()`,
    };
    return key;
  }
})();
