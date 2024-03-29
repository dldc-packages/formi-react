import type { IFormiField, TFormiIssue } from '@dldc/formi';
import { useId } from 'react';
import { useFieldState } from '../../src/mod';
import { IssueBox } from '../utils/IssueBox';

type Props = {
  label: string;
  field: IFormiField<string, TFormiIssue>;
  options: Array<{ value: string; label: string }>;
  allowEmpty?: boolean;
};

export function SelectInput({ label, field, options, allowEmpty = true }: Props) {
  const state = useFieldState(field);
  const id = useId();

  return (
    <div className="input">
      <label>{label}</label>
      <select name={state.name} id={id}>
        {allowEmpty && <option value="">--</option>}
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <option key={optionId} value={option.value} id={id}>
              {option.label}
            </option>
          );
        })}
      </select>
      <IssueBox issues={state.touchedIssues} />
    </div>
  );
}
