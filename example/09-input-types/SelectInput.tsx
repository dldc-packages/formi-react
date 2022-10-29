import React from 'react';
import { FormiField_Value, useFieldState, FormiIssue } from '../../src';
import { IssueBox } from './IssueBox';

type Props = {
  label: string;
  field: FormiField_Value<string, FormiIssue>;
  options: Array<{ value: string; label: string }>;
  allowEmpty?: boolean;
};

export function SelectInput({ label, field, options, allowEmpty = true }: Props) {
  const state = useFieldState(field);

  return (
    <div className="input">
      <label>{label}</label>
      <select name={field.name} id={field.id}>
        {allowEmpty && <option value="">--</option>}
        {options.map((option) => {
          const id = `${field.id}-${option.value}`;
          return (
            <option key={id} value={option.value} id={id}>
              {option.label}
            </option>
          );
        })}
      </select>
      <IssueBox issues={state.touchedIssues} />
    </div>
  );
}
