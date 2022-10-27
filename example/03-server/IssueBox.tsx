import React from 'react';
import { FormiIssue } from '../../src';
import { UsernameIssue } from './ServerExample';

interface Props {
  issue: UsernameIssue | FormiIssue;
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
