import { FormiDefAny } from './FormiDef';
import { FormiFieldAny } from './FormiField';
import { FieldAllIssueOf, FieldIssueOf, FormiIssues, FormiIssuesItem } from './types';

export interface FormiIssuesBuilder<Issue> {
  readonly add: <F extends FormiFieldAny>(field: F, issue: FieldIssueOf<F>) => void;
  readonly getIssues: () => FormiIssues<Issue>;
  readonly hasIssues: () => boolean;
}

export const FormiIssuesBuilder = (() => {
  return Object.assign(create, {});

  function create<Def extends FormiDefAny>(def: Def): FormiIssuesBuilder<FieldAllIssueOf<Def>> {
    const map = new Map<FormiFieldAny, Array<any>>();

    return {
      add,
      getIssues,
      hasIssues,
    };

    function getIssues(): FormiIssues<FieldAllIssueOf<Def>> {
      return issuesFromMap(map);
    }

    function hasIssues(): boolean {
      return map.size > 0;
    }

    function add<F extends FormiFieldAny>(field: F, issue: FieldIssueOf<F>) {
      console.log('TODO: make sure field is in def', field, def);

      const issues = map.get(field) ?? [];
      issues.push(issue);
      if (map.has(field) === false) {
        map.set(field, issues);
      }
    }
  }

  function issuesFromMap<Issue>(map: Map<FormiFieldAny, Array<Issue>>): FormiIssues<Issue> {
    const issues = Array.from(map.entries())
      .map(([field, issues]): FormiIssuesItem<Issue> | null => {
        if (issues.length === 0) {
          return null;
        }
        return {
          path: field.path.raw,
          issues,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
    return issues;
  }
})();
