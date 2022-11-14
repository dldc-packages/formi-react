import { Path, PathLike } from './Path';

const IS_FIELD_PATH = Symbol('IS_FIELD_PATH');

export interface FieldPath {
  readonly [IS_FIELD_PATH]: true;
  readonly formName: string;
  readonly path: Path;
  readonly fieldName: string;
  readonly fullPath: Path;
  readonly serialize: () => string;
  readonly toString: () => string;
}

export const FieldPath = (() => {
  return Object.assign(create, {
    create,
    isFieldPath,
    parse,
    equal,
  });

  function isFieldPath(value: any): value is FieldPath {
    return value && value[IS_FIELD_PATH] === true;
  }

  function equal(a: FieldPath | PathLike, b: FieldPath | PathLike): boolean {
    const aRes = isFieldPath(a) ? a.fullPath : Path.from(a);
    const bRes = isFieldPath(b) ? b.fullPath : Path.from(b);
    return Path.equal(aRes, bRes);
  }

  function create(formName: string, path: Path, fieldName: string): FieldPath {
    const fullPath = Path(formName, ...path.raw, fieldName);

    return {
      [IS_FIELD_PATH]: true,
      formName,
      path,
      fieldName,
      fullPath,
      serialize: fullPath.serialize,
      toString: fullPath.serialize,
    };
  }

  function parse(name: string): FieldPath {
    const fullPath = Path.parse(name);
    const [formName, rest] = fullPath.splitHeadOrThrow();
    const [path, fieldName] = rest.splitTailOrThrow();
    if (typeof formName === 'number') {
      throw new Error(`Unexpected number in form name: ${name}`);
    }
    if (typeof fieldName === 'number') {
      throw new Error(`Unexpected number in field name: ${name}`);
    }
    return create(formName, path, fieldName);
  }
})();
