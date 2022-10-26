import React from 'react';
import { FormiField_Value, useFormiFieldState } from '../../src';
import { IssueBox } from './IssueBox';
import { Issue } from './ServerExample';

type Props = {
  label: string;
  field: FormiField_Value<string, Issue>;
  type: 'password' | 'text' | 'email';
  defaultValue?: string;
};

export function TextInput({ label, field, type, defaultValue }: Props) {
  const state = useFormiFieldState(field);

  return (
    <div className="input">
      <label htmlFor={field.id}>{label}</label>
      <input id={field.id} type={type} name={field.name} defaultValue={defaultValue} />
      {state.touchedIssues && <IssueBox issue={state.touchedIssues[0]} />}
    </div>
  );
}
