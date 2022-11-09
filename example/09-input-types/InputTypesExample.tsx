import React from 'react';
import { z } from 'zod';
import { FormiField, useFormi } from '../../src';
import { Input } from './Input';
import { RadioInput } from './RadioInput';
import { SelectInput } from './SelectInput';

const FORM_NAME = 'input-types';

const initialFields = {
  text: FormiField.string().use(),
  number: FormiField.number().use(),
  checkbox: FormiField.checkbox().use(),
  radio: FormiField.string()
    .zodValidate(z.enum(['a', 'b', 'c']))
    .use(),
  select: FormiField.string()
    .zodValidate(z.enum(['a', 'b', 'c', '']))
    .validate((value) => {
      if (value === '') {
        return { success: false, issue: { kind: 'MissingField' } };
      }
      return { success: true, value };
    })
    .use(),
};

export function InputTypesExample() {
  const { fields, Form } = useFormi({
    initialFields,
    formName: FORM_NAME,
    onSubmit: ({ value }, actions) => {
      actions.preventDefault();
      console.log(value);
      alert(JSON.stringify(value, null, 4));
    },
  });

  const { checkbox, number, text } = fields;

  return (
    <Form>
      <h2>Input Types</h2>
      <p>This example uses different type of inputs.</p>
      <Input field={text} type="text" label="Text" />
      <Input field={number} type="number" label="Number" />
      <Input field={checkbox} type="checkbox" label="Checkbox" defaultValue="active" />
      <RadioInput
        field={fields.radio}
        label="Radio"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
          { value: 'c', label: 'C' },
        ]}
      />
      <SelectInput
        field={fields.select}
        label="Select"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
          { value: 'c', label: 'C' },
        ]}
      />
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
