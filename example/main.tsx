// import React, { memo } from 'react';
// import ReactDOM from 'react-dom/client';
import { z } from 'zod';
import { def, useField, useForm, zx } from '../src';
import './index.css';
import './mvp.css';

const strAsInt = zx
  .string()
  .transform((v) => (v === '' ? null : parseInt(v, 10)))
  .refine((val) => Number.isNaN(val) === false, 'Invalid number');

const friendField = def.object({
  name: def.zx.withIssue<number>().value(zx.string().min(3)),
  age: def.withIssue<{ issue: z.ZodIssue; num: number }>().value((value, { issues }) => {
    const res = zx.parse(zx.chain(strAsInt, zx.number().nullable()), value);
    if (res.success === false) {
      res.issues.forEach((issue) => {
        issues.addIssue({ issue, num: 1 });
      });
      throw issues;
    }
    if (res === null) {
      return null;
    }
    return 42;
  }),
});

const fields = def.object({
  company: def.zx.value(zx.string().min(3)),
  name: def.zx.value(zx.string().min(3)),
  file: def.zx.value(z.instanceof(File).refine((f) => f.size > 0, 'File is required')),
  age: def.zx.value(zx.chain(strAsInt, zx.number().int().min(18).max(99))),
  infos: def.object({
    address: def.zx.value(zx.string().min(3)),
    city: def.zx.value(zx.string().min(3)),
  }),
  friends: def.withIssue<string>().validate(def.array([friendField, friendField, friendField]), (items, { field, issues }) => {
    if (items.length === 0) {
      issues.addIssue('At least one friend is required');
      throw issues;
    }
    if (items[0].name === 'John') {
      issues.addIssue(field.children.get(0).get('name'), 42);
      throw issues;
    }
    return items.length;
  }),
});

/*

*/

function App() {
  const form = useForm({ fields: fields });

  form.fields.get('age');

  const nameField = form.fields.get('name');

  const friendsField = form.fields.get('friends');

  const firstFriendName = form.fields.get('friends').children.get(0).get('name');

  const friendsState = useField(friendsField);
  console.log(friendsState.value);

  const name = useField(nameField);
  const nameState = useField(firstFriendName);

  console.log({ name, nameState });
}

console.log(App);

// formField.get('friends').get(12).get('name').name;

// const { age, company, file, friends } = formField.children;

// const friends2 = formField.get('friends');

// console.log({ age, company, file, friends });

// const result = {} as FieldValueOf<typeof fields>;

// result.friends;

// console.log(friends2);

// type T = FieldDefPaths<typeof fields>;

// function App(): JSX.Element | null {
//   const form = useForm({
//     initialFields: fields,
//     formName: 'create-user',
//   });

//   return (
//     <form.Form style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
//       <TextField field={form.field('infos', 'address')} label="Company" defaultValue="He" placeholder="Inc" />
//       <TextField field={form.field('name')} label="Name" placeholder="Paul" />
//       <input name={form.field('age').name} placeholder="Age" />
//       <FileField field={form.field('file')} label="File" />
//       <button type="submit">Submit</button>
//     </form.Form>
//   );
// }

// type TextFieldProps = {
//   field: ValueFormField<string>;
//   label: string;
//   placeholder: string;
//   defaultValue?: string;
// };

// const TextField = memo(function TextField({ field, label, placeholder, defaultValue }: TextFieldProps) {
//   const [state] = useField(field);

//   const error = Boolean(state.isSubmitted || (state.isTouched && state.isDirty)) && state.error;

//   return (
//     <div>
//       <label htmlFor={field.id}>{label}</label>
//       <input name={field.name} id={field.id} placeholder={placeholder} defaultValue={defaultValue} />
//       {error && <p>{error.message}</p>}
//     </div>
//   );
// });

// type FileFieldProps = {
//   field: ValueFormField<File>;
//   label: string;
// };

// const FileField = memo(function FileField({ field, label }: FileFieldProps) {
//   const [state] = useField(field);

//   console.log(state);

//   const error = Boolean(state.isSubmitted || (state.isTouched && state.isDirty)) && state.error;

//   return (
//     <div>
//       <label htmlFor={field.id}>{label}</label>
//       <input name={field.name} id={field.id} type="file" />
//       {error && <p>{error.message}</p>}
//     </div>
//   );
// });

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
