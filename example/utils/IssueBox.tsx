import React from 'react';
import { FormiIssue } from '../../src';

interface Props<OtherIssue extends { kind: string }> {
  issues: Array<FormiIssue | OtherIssue> | null;
  renderIssue?: (issue: FormiIssue | OtherIssue, index: number) => React.ReactNode | null;
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
          const zodIssue = issue as Extract<FormiIssue, { kind: 'ZodIssue' }>;
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
