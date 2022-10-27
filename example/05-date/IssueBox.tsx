import React from 'react';
import { FormiIssue } from '../../src';
import { DateExampleIssue } from './DateExample';
import { DateFieldIssue } from './DateInput';

interface Props {
  issues: Array<FormiIssue | DateFieldIssue | DateExampleIssue> | null;
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
        if (issue.kind === 'TheWorldEndsIn2048') {
          return (
            <p key={i} className="error">
              Sorry but the world ends in 2048 because God stored the year on 11 bits...
            </p>
          );
        }
        if (issue.kind === 'StartDateAfterEndDate') {
          return (
            <p key={i} className="error">
              Start date must be before end date.
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
