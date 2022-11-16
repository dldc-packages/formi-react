import { ErreursMap } from 'erreur';
import type { FormiFieldAny } from './FormiField';
import type { FormiFieldTree } from './FormiFieldTree';
import type { FormiKey } from './FormiKey';
import type { Path } from './tools/Path';

export type FormiInternalError = typeof FormiInternalErrors.infered;

export const FormiInternalErrors = new ErreursMap({
  Internal_UnhandledAction: (action: any) => ({ message: `Unhandled action "${action?.type}"`, action }),
  Internal_DuplicateKey: (key: FormiKey, current: Path, conflict: Path) => ({
    message: `Duplicate key "${key}" (${current.serialize()} and ${conflict.serialize()})`,
    key,
    current,
    conflict,
  }),
  Internal_UnexpectedNever: (received: any) => ({ message: `Unexpected Never (received ${received})`, received }),
});

export type FormiError = typeof FormiErrors.infered;

export const FormiErrors = new ErreursMap({
  ...FormiInternalErrors.errors,
  MissingFormRef: (formName: string) => ({ message: `Missing form ref on form "${formName}"`, formName }),
  ReusedField: (tree: FormiFieldTree, field: FormiFieldAny, paths: Array<Path>) => ({
    message: `Field "${field.key.toString()}" is used multiple times (${paths.map((p) => p.toString()).join(', ')})`,
    field,
    tree,
    paths,
  }),
  FieldNotFound: (tree: FormiFieldTree, field: FormiFieldAny) => ({
    message: `Field "${field.key.toString()}" not found in tree.`,
    tree,
    field,
  }),
  ValidateSuccessWithoutValue: (field: FormiFieldAny, input: any) => ({
    message: `Expected a value to be returned from the validation function (got undefined).`,
    field,
    input,
  }),
  GetValueUnmountedForm: (formName: string) => ({ message: `Cannot get value of unmounted form "${formName}"`, formName }),
  GetValueUnresolved: (formName: string) => ({ message: `Cannot get value of unresolved form "${formName}"`, formName }),
  MissingFieldState: (field: FormiFieldAny) => ({ message: `Missing field state for field "${field.key}"`, field }),
  MissingFormiContext: () => ({ message: `No FormiContext found` }),
  MissingFormiController: () => ({ message: `No FormiController found` }),
});
