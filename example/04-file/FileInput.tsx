import React from 'react';
import { FormiField_Value, FormiIssue, useFormiFieldState } from '../../src';
import { IssueBox } from './IssueBox';

type Props = {
  label: string;
  field: FormiField_Value<File, FormiIssue>;
};

export function FileInput({ label, field }: Props) {
  const state = useFormiFieldState(field);

  return (
    <div className="input">
      <label htmlFor={field.id}>{label}</label>
      <input id={field.id} type="file" name={field.name} />
      {state.touchedIssues && <IssueBox issue={state.touchedIssues[0]} />}
    </div>
  );
}
