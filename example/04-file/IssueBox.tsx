import React from 'react';
import { FormiIssue } from '../../src';

interface Props {
  issue: FormiIssue;
}

export function IssueBox({ issue }: Props) {
  if (issue.kind === 'ZodIssue') {
    return <p className="error">{issue.issue.message}</p>;
  }
  return <p className="error">{issue.kind}</p>;
}
