import React from 'react';
import { z } from 'zod';
import { useFormiForm, field } from '../../src';
import { FileInput } from './FileInput';
import { TextInput } from './TextInput';

const fieldsDef = field.object({
  filename: field.zodString(
    z
      .string()
      .min(1)
      .max(20)
      .transform((v) => v.toLowerCase().replace(' ', '-'))
  ),
  file: field.nonEmptyfile((file) => {
    return { success: true, value: file.size };
  }),
});

const FORM_NAME = 'server';

export function FileExample() {
  const { fields, Form } = useFormiForm({
    fields: fieldsDef,
    formName: FORM_NAME,
    onSubmit: ({ value }, actions) => {
      actions.preventDefault();
      console.log(value);
    },
  });

  return (
    <Form>
      <h2>File</h2>
      <p>
        This example uses a <code>type="file"</code> input.
      </p>
      <TextInput label="File name" field={fields.get('filename')} type="text" />
      <FileInput label="File" field={fields.get('file')} />
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}