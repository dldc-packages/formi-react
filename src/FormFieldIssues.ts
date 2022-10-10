import { FormField, FormFieldAny } from './FormField';

interface AddIssue<Issue> {
  // add to current field
  (issue: Issue): void;
  // add to a specific field
  <Issue>(field: FormField<any, Issue>, issue: Issue): void;
}

export class FormFieldIssues<Issue> extends Error {
  public readonly addIssue: AddIssue<Issue>;

  constructor(formField: FormField<any, Issue>) {
    super('[FieldIssues]');
    // restore prototype chain
    Object.setPrototypeOf(this, FormFieldIssues.prototype);

    const issuesMap = new Map<FormFieldAny, Array<unknown>>();

    this.addIssue = addIssue;

    function addIssue(arg1: FormFieldAny | Issue, arg2?: Issue) {
      const [issueFormField, issue] =
        arg2 === undefined ? [formField as FormFieldAny, arg1 as Issue] : [arg1 as FormFieldAny, arg2 as Issue];
      let issues = issuesMap.get(issueFormField);
      if (issues === undefined) {
        issues = [];
        issuesMap.set(issueFormField, issues);
      }
      issues.push(issue);
    }
  }
}
