import React from 'react';
import { FormiIssue } from '../../src';

interface Props {
  issues: Array<FormiIssue> | null;
}

export function IssueBox({ issues }: Props) {
  if (!issues || issues.length === 0) {
    return null;
  }
  return (
    <div>
      {issues.map((issue, i) => {
        if (issue.kind === 'ZodIssue') {
          return (
            <p key={i} className="error">
              {issue.issue.message}
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
