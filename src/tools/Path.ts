export type Key = string | number;
export type RawPath = ReadonlyArray<Key>;

const IS_PATH = Symbol('IS_PATH');

export type PathLike = RawPath | Path;

export interface Path {
  readonly [IS_PATH]: true;
  readonly raw: RawPath;
  readonly length: number;
  readonly serialize: () => string;
  readonly toString: () => string;
  readonly append: (...raw: ReadonlyArray<Key>) => Path;
  readonly prepend: (...raw: ReadonlyArray<Key>) => Path;
  readonly shift: () => Path;
  readonly splitHead: () => [Key | null, Path];
  readonly splitHeadOrThrow: () => [Key, Path];
  [Symbol.iterator](): Iterator<Key>;
}

export const Path = (() => {
  const NOT_ALLOWED = /\[|\]|\./; // . or [ or ]
  const SPLITTER = /(\[\d+\]|\.)/g;

  return Object.assign(create, {
    create: create,
    isPath,
    validatePathItem,
    serialize,
    parse,
    from: pathFrom,
    equal,
  });

  function create(...raw: ReadonlyArray<Key>): Path {
    let serialized: string | null = null;

    const self: Path = {
      [IS_PATH]: true,
      raw,
      length: raw.length,
      serialize,
      toString: serialize,
      append,
      prepend,
      shift,
      splitHead,
      splitHeadOrThrow,
      [Symbol.iterator](): Iterator<Key> {
        return this.raw[Symbol.iterator]();
      },
    };
    return self;

    function serialize(): string {
      if (serialized === null) {
        serialized = Path.serialize(self);
      }
      return serialized;
    }

    function shift(): Path {
      return Path(...self.raw.slice(1));
    }

    function append(...raw: ReadonlyArray<Key>): Path {
      return Path(...self.raw, ...raw);
    }

    function prepend(...raw: ReadonlyArray<Key>): Path {
      return Path(...raw, ...self.raw);
    }

    function splitHead(): [Key | null, Path] {
      if (raw.length === 0) {
        return [null, Path()];
      }
      const [head, ...tail] = raw;
      return [head, Path(...tail)];
    }

    function splitHeadOrThrow(): [Key, Path] {
      const [head, tail] = splitHead();
      if (head === null) {
        throw new Error(`Cannot split head of empty path`);
      }
      return [head, tail];
    }
  }

  function equal(a: PathLike, b: PathLike): boolean {
    const aRaw = isPath(a) ? a.raw : a;
    const bRaw = isPath(b) ? b.raw : b;
    return aRaw.length === bRaw.length && aRaw.every((key, i) => key === bRaw[i]);
  }

  function isPath(path: any): path is Path {
    return path && path[IS_PATH] === true;
  }

  function validatePathItem(item: string): string {
    if (NOT_ALLOWED.test(item)) {
      throw new Error(`Path item cannot contain . or [ or ]`);
    }
    return item;
  }

  /**
   * ["a", "b", "c"] => "a.b.c"
   * ["a", 0, "b"] => "a[0].b"
   */
  function serialize(path: PathLike): string {
    const raw = Path.isPath(path) ? path.raw : path;

    let result = '';
    raw.forEach((item, index) => {
      if (typeof item === 'number') {
        result += `[${item}]`;
        return;
      }
      if (index === 0) {
        result += item;
        return;
      }
      result += `.${item}`;
    });
    return result;
  }

  function parse(str: string): Path {
    const parts = str.split(SPLITTER).filter((part) => part !== '.' && part !== '');
    return Path(
      ...parts.map((part) => {
        if (part.startsWith('[')) {
          return parseInt(part.slice(1, -1), 10);
        }
        return part;
      })
    );
  }

  function pathFrom(...items: Array<Key>): Path;
  function pathFrom(path: PathLike): Path;
  function pathFrom(...args: [PathLike] | Array<Key>): Path {
    if (args.length === 1) {
      const arg = args[0];
      if (Path.isPath(arg)) {
        return arg;
      }
      if (Array.isArray(arg)) {
        return Path(...arg);
      }
      return Path.parse(arg as any);
    }
    return Path(...(args as any));
  }
})();
