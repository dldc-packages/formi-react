import type { TFormiIssue } from '@dldc/formi';
import React from 'react';
import type { TFormiIssueZod } from './zodValidator';

interface Props<OtherIssue extends { kind: string }> {
  issues: Array<TFormiIssue | TFormiIssueZod | OtherIssue> | null;
  renderIssue?: (issue: TFormiIssue | TFormiIssueZod | OtherIssue, index: number) => React.ReactNode | null;
}

export function IssueBox<OtherIssue extends { kind: string }>({ issues, renderIssue }: Props<OtherIssue>) {
  if (!issues || issues.length === 0) {
    return null;
  }
  return (
    <div>
      {issues.map((issue, i) => {
        const rendered = renderIssue?.(issue, i);
        if (rendered) {
          return rendered;
        }
        if (issue.kind === 'ZodIssue') {
          const zodIssue = issue as TFormiIssueZod;
          return (
            <p key={i} className="error">
              {zodIssue.issue.message}
            </p>
          );
        }
        return (
          <p key={i} className="error">
            {issue.kind}
          </p>
        );
      })}
    </div>
  );
}
