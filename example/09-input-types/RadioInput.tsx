import type { TFormiField, TFormiIssue } from '@dldc/formi';
import { useId } from 'react';
import { useFieldState } from '../../src/mod';
import { IssueBox } from '../utils/IssueBox';
import type { TFormiIssueZod } from '../utils/zodValidator';

type Props = {
  label: string;
  field: TFormiField<string, TFormiIssue | TFormiIssueZod>;
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
