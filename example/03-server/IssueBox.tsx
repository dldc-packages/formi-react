import React from 'react';
import { Issue } from './ServerExample';

interface Props {
  issue: Issue;
}

export function IssueBox({ issue }: Props) {
  if (issue.kind === 'ZodIssue') {
    return <p className="error">{issue.issue.message}</p>;
  }
  if (issue.kind === 'UsernameAlreadyUsed') {
    return <p className="error">Username is already used</p>;
  }
  return <p className="error">{issue.kind}</p>;
}
