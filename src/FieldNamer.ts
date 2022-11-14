import { FormiField, FormiFieldAny, FormiFieldBuilderAny } from './FormiField';
import { FormiFieldTree } from './FormiFieldTree';
import { Path } from './tools/Path';

const IS_FIELD_NAMER = Symbol('IS_FIELD_NAMER');

export interface FieldNamer {
  readonly [IS_FIELD_NAMER]: true;
  readonly fieldName: (field: FormiFieldAny) => string;
}

/**
 * Set a name to each field builder
 * Any field not in namedFields get a generated name (field1, field2, ...)
 * This is used to rebuild form structure and validation from a FormData object
 */
export const FieldNamer = (() => {
  return create;

  function create(tree: FormiFieldTree, namedFields: Record<string, FormiFieldAny>): FieldNamer {
    const map = new Map<FormiFieldBuilderAny, string>();

    Object.entries(namedFields).forEach(([name, field]) => {
      try {
        // validate field name
        Path.validatePathItem(name);
      } catch (error) {
        throw new Error(`Invalid field name: ${name}, it cannot contain . or [ or ]`);
      }
      register(field, name);
    });

    FormiFieldTree.traverse(tree, (field, _path, next) => {
      next();
      register(field);
    });

    return {
      [IS_FIELD_NAMER]: true,
      fieldName,
    };

    function register(field: FormiFieldAny, name?: string) {
      const builder = FormiField.utils.getBuilder(field);
      const current = map.get(builder);
      if (current) {
        if (name && current !== name) {
          throw new Error(`Field ${name} is already registered as ${current}`);
        }
        return;
      }
      const nameResolved = name ?? findNextAutoName();
      map.set(builder, nameResolved);
    }

    function findByName(name: string): FormiFieldBuilderAny | null {
      for (const [builder, builderName] of map) {
        if (builderName === name) {
          return builder;
        }
      }
      return null;
    }

    function fieldName(field: FormiFieldAny): string {
      const builder = FormiField.utils.getBuilder(field);
      const name = map.get(builder);
      if (!name) {
        throw new Error(`Field ${field} is not registered`);
      }
      return name;
    }

    function findNextAutoName() {
      let i = 0;
      while (true) {
        const name = `field${i}`;
        if (findByName(name) === null) {
          return name;
        }
        i++;
      }
    }
  }
})();
