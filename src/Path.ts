export type Key = string | number;
export type RawPath = ReadonlyArray<Key>;

const NOT_ALLOWED = /\[|\]|\./; // . or [ or ]
const SPLITTER = /(\[\d+\]|\.)/g;

export type PathLike = RawPath | Path;

export class Path {
  static validatePathItem(item: string): string {
    if (NOT_ALLOWED.test(item)) {
      throw new Error(`Path item cannot contain . or [ or ]`);
    }
    return item;
  }

  /**
   * ["a", "b", "c"] => "a.b.c"
   * ["a", 0, "b"] => "a[0].b"
   */
  static serialize(path: PathLike): string {
    const raw = path instanceof Path ? path.raw : path;

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

  static parse(str: string): Path {
    const parts = str.split(SPLITTER).filter((part) => part !== '.' && part !== '');
    return new Path(
      ...parts.map((part) => {
        if (part.startsWith('[')) {
          return parseInt(part.slice(1, -1), 10);
        }
        return part;
      })
    );
  }

  static from(...items: Array<Key>): Path;
  static from(path: PathLike): Path;
  static from(...args: [PathLike] | Array<Key>): Path {
    if (args.length === 1) {
      const arg = args[0];
      if (arg instanceof Path) {
        return arg;
      }
      if (Array.isArray(arg)) {
        return new Path(...arg);
      }
      return Path.parse(arg as any);
    }
    return new Path(...(args as any));
  }

  public readonly raw: RawPath;
  public readonly length: number;
  public readonly serialize: () => string;
  public readonly toString: () => string;
  public readonly append: (...raw: ReadonlyArray<Key>) => Path;
  public readonly splitHead: () => [Key | null, Path];

  constructor(...raw: ReadonlyArray<Key>) {
    this.raw = raw;
    this.length = raw.length;

    let serialized: string | null = null;

    this.serialize = () => {
      if (serialized === null) {
        serialized = Path.serialize(this);
      }
      return serialized;
    };

    this.toString = this.serialize;

    this.append = (...raw) => {
      return new Path(...this.raw, ...raw);
    };

    this.splitHead = () => {
      if (raw.length === 0) {
        return [null, new Path()];
      }
      const [head, ...tail] = raw;
      return [head, new Path(...tail)];
    };
  }

  public [Symbol.iterator](): Iterator<Key> {
    return this.raw[Symbol.iterator]();
  }
}
