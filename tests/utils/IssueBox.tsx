import React from 'react';
import type { TFormiIssue } from '../../src/mod';

interface Props {
  issues: Array<TFormiIssue> | null;
  renderIssue?: (issue: TFormiIssue, index: number) => React.ReactNode | null;
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
        if (issue.kind === 'ZodIssue') {
          const zodIssue = issue;
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
