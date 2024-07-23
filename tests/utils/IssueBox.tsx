import type { TFormiIssue } from '@dldc/formi';
import React from 'react';
import type { TFormiIssueZod } from './zodValidator';

interface Props {
  issues: Array<TFormiIssue | TFormiIssueZod> | null;
  renderIssue?: (issue: TFormiIssue | TFormiIssueZod, index: number) => React.ReactNode | null;
}

export function IssueBox({ issues, renderIssue }: Props) {
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
        return (
          <p key={i} className="error">
            {issue.kind}
          </p>
        );
      })}
    </div>
  );
}
