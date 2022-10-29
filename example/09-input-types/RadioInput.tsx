import React from 'react';
import { FormiField_Value, useFieldState, FormiIssue } from '../../src';
import { IssueBox } from './IssueBox';

type Props = {
  label: string;
  field: FormiField_Value<string, FormiIssue>;
  options: Array<{ value: string; label: string }>;
};

export function RadioInput({ label, field, options }: Props) {
  const state = useFieldState(field);

  return (
    <div className="input">
      <label>{label}</label>
      {options.map((option) => {
        const id = `${field.id}-${option.value}`;
        return (
          <div key={id}>
            <input type="radio" id={id} name={field.name} value={option.value} />
            <label htmlFor={id}>{option.label}</label>
          </div>
        );
      })}
      <IssueBox issues={state.touchedIssues} />
    </div>
  );
}
