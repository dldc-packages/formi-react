import { FormiField } from '@dldc/formi';
import { z } from 'zod';
import { useFormi } from '../../src/mod';
import { zodValidator } from '../utils/zodValidator';
import { FileInput } from './FileInput';
import { TextInput } from './TextInput';

const fieldsDef = {
  filename: FormiField.string().validate(
    zodValidator(
      z
        .string()
        .min(1)
        .max(20)
        .transform((v) => v.toLowerCase().replaceAll(' ', '-')),
    ),
  ),
  file: FormiField.nonEmptyfile().validate((file) => {
    return { success: true, value: { file, size: file.size } };
  }),
};

const FORM_NAME = 'server';

export function FileExample() {
  const { fields, Form } = useFormi({
    initialFields: fieldsDef,
    formName: FORM_NAME,
    onSubmit: ({ value }, actions) => {
      actions.preventDefault();
      window.alert('Result logged to the console');
      console.info(value);
    },
  });

  return (
    <Form>
      <h2>File</h2>
      <p>
        This example uses a <code>type="file"</code> input.
      </p>
      <TextInput label="File name" field={fields.filename} type="text" />
      <FileInput label="File" field={fields.file} />
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
