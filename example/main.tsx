import React from 'react';
import ReactDOM from 'react-dom/client';
import './mvp.css';
import './index.css';
import { SimpleExample } from './01-simple/SimpleExample';
import { ComponentsExample } from './02-components/ComponentsExample';
import { ServerExample } from './03-server/ServerExample';

const STRICT_MODE = false;

const StrictMode = STRICT_MODE ? React.StrictMode : React.Fragment;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <SimpleExample />
      <ComponentsExample />
      <ServerExample />
    </div>
  </StrictMode>
);

// type CustomIssue = FormiIssue | { kind: 'PasswordDontMatch' } | { kind: 'InvalidNumber' };

// const field = withIssue<CustomIssue>();

// const friendField = field.object({
//   custom: field.value<number>((val) => {
//     if (typeof val !== 'string') {
//       return { success: false, issue: { kind: 'UnexpectedFile' } };
//     }
//     const num = parseInt(val, 10);
//     if (Number.isNaN(num)) {
//       return { success: false, issue: { kind: 'InvalidNumber' } };
//     }
//     return { success: true, value: num };
//   }),
//   name: field.zodString(z.string().min(3)),
//   age: field.zodNumber(z.number()),
// });

// const fields = field.object({
//   company: field.zodString(z.string().min(3)),
//   name: field.zodString(z.string().min(3)),
//   // file: def.z.value(z.instanceof(File).refine((f) => f.size > 0, 'File is required')),
//   age: field.zodNumber(z.number().int().min(18).max(99)), // def.z.value(z.chain(strAsInt, z.number().int().min(18).max(99))),
//   infos: field.object({
//     address: field.zodString(z.string().min(3)),
//     city: field.zodString(z.string().min(3)),
//   }),
//   friends: field.array([friendField, friendField, friendField]),
// });

// function App() {
//   const form = useForm({ fields: fields });

//   form.fields.get('age');

//   const nameField = form.fields.get('name');

//   const friendsField = form.fields.get('friends');

//   const firstFriendName = form.fields.get('friends').get(0).get('name');

//   const friendsState = useField(friendsField);
//   console.log(friendsState.value);

//   const name = useField(nameField);
//   const nameState = useField(firstFriendName);

//   console.log({ name, nameState });

//   return <div>TODO</div>
// }

// console.log(App);

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
