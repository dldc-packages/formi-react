import React from 'react';
import { FormiField_Value, FormiIssue, useFieldState } from '../../src';
import { IssueBox } from './IssueBox';
import { UsernameIssue } from './ServerExample';

type Props = {
  label: string;
  field: FormiField_Value<string, FormiIssue | UsernameIssue>;
  type: 'password' | 'text' | 'email';
  defaultValue?: string;
};

export function TextInput({ label, field, type, defaultValue }: Props) {
  const state = useFieldState(field);

  return (
    <div className="input">
      <label htmlFor={field.id}>{label}</label>
      <input id={field.id} type={type} name={field.name} defaultValue={defaultValue} />
      {state.touchedIssues && <IssueBox issue={state.touchedIssues[0]} />}
    </div>
  );
}
