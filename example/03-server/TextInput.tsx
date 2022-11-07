import React, { useId } from 'react';
import { FormiField, FormiIssue, useFieldState } from '../../src';
import { IssueBox } from './IssueBox';
import { UsernameIssue } from './ServerExample';

type Props = {
  label: string;
  field: FormiField<string, FormiIssue | UsernameIssue>;
  type: 'password' | 'text' | 'email';
  defaultValue?: string;
};

export function TextInput({ label, field, type, defaultValue }: Props) {
  const state = useFieldState(field);
  const id = useId();

  return (
    <div className="input">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} name={state.name} defaultValue={defaultValue} />
      {state.touchedIssues && <IssueBox issue={state.touchedIssues[0]} />}
    </div>
  );
}
