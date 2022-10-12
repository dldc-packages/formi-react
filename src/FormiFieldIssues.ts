import { FormiField, FormiFieldAny } from './FormiField';

interface AddIssue<Issue> {
  // add to current field
  (issue: Issue): void;
  // add to a specific field
  <Issue>(field: FormiField<any, Issue>, issue: Issue): void;
}

export class FormiFieldIssues<Issue> extends Error {
  public readonly addIssue: AddIssue<Issue>;

  constructor(formiField: FormiField<any, Issue>) {
    super('[FieldIssues]');
    // restore prototype chain
    Object.setPrototypeOf(this, FormiFieldIssues.prototype);

    const issuesMap = new Map<FormiFieldAny, Array<unknown>>();

    this.addIssue = addIssue;

    function addIssue(arg1: FormiField<any, Issue> | Issue, arg2?: Issue) {
      const [issueFormiField, issue] =
        arg2 === undefined ? [formiField as FormiFieldAny, arg1 as Issue] : [arg1 as FormiFieldAny, arg2 as Issue];
      let issues = issuesMap.get(issueFormiField);
      if (issues === undefined) {
        issues = [];
        issuesMap.set(issueFormiField, issues);
      }
      issues.push(issue);
    }
  }
}
