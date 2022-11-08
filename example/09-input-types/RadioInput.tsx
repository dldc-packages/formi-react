import React, { useId } from 'react';
import { FormiField, FormiIssue, useFieldState } from '../../src';
import { IssueBox } from './IssueBox';

type Props = {
  label: string;
  field: FormiField<string, FormiIssue>;
  options: Array<{ value: string; label: string }>;
};

export function RadioInput({ label, field, options }: Props) {
  const state = useFieldState(field);
  const id = useId();

  return (
    <div className="input">
      <label>{label}</label>
      {options.map((option) => {
        const optionId = `${id}-${option.value}`;
        return (
          <div key={optionId}>
            <input type="radio" id={optionId} name={state.name} value={option.value} />
            <label htmlFor={id}>{option.label}</label>
          </div>
        );
      })}
      <IssueBox issues={state.touchedIssues} />
    </div>
  );
}
