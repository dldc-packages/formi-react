# 📄 React Formi

> A type-safe form librairy for React

## Features

- 🍰 **Easy to use**: React Formi provides a simple API to create forms, and a simple way to use them in your components.
- 🔒 **Type safe**: React Formi is built with TypeScript and provides type safety for your forms, including typing field validation issues !
- ✨ **FormData based**: React Formi manipulates the native FormData API, this mean that you can validate your form on the backend with the same code as on the frontend.
- 🪶 **Very few dependencies**: React Formi only has a few dependencies (2 at the time of writing).
- 🚀 **Fast**: React Formi is built with performance in mind so your components only render when they need to.
- 🛡 **Zod validation**: React Formi offers convinient tools to validate your form with [Zod](https://github.com/colinhacks/zod) but you can use any validation library you want (and zod is not a dependency of React Formi).
- 🛠 **Transformations**: React Formi offers a way to transform your form data, this allow your form to output data in the shape you want.

## Motivations

This library is heavily inspired by [`react-zorm`](https://github.com/esamattis/react-zorm). It uses the same principle of using the `FormData` API at its core, to allow for easy validation on the backend. In other words, you can validate your form on the backend with the same code as on the frontend. Where this library differs from `react-zorm` is that it is does not use zod to defined the shape of your form and has a different API.

## Gist

```tsx
import React from 'react';
import { z } from 'zod';
import { FormiDef, useFormi } from '../../src';
import { TextInput } from './TextInput';

/**
 * 1. Define the form schema
 */
const simpleFields = FormiDef.object({
  username: FormiDef.zodString(z.string().min(1).max(20)),
  email: FormiDef.zodString(z.string().email()),
  password: FormiDef.zodString(z.string().min(8)),
});

export function ComponentsExample() {
  /**
   * 2. Use the useFormi hook to create a form instance
   */
  const { fields, Form } = useFormi({
    fields: simpleFields,
    formName: 'my-formi-form',
    onSubmit: ({ value }, actions) => {
      // [Optional] Do something with the form value
      alert(JSON.stringify(value, null, 4));
      // [Optional] Don't submit the form to the server
      actions.preventDefault();
      // [Optional] Reset the form
      actions.reset();
    },
  });

  return (
    <Form>
      <TextInput label="Username" field={fields.children.username} type="text" defaultValue="my-username" />
      <TextInput label="Email" field={fields.children.email} type="email" />
      <TextInput label="Password" field={fields.children.password} type="password" />
      <button type="submit">Submit</button>
    </Form>
  );
}
```

# API

## `FormiDef`

> `FormiDef` allows you to define the shape of your form, think of it as a `zod` schema but for forms.

```ts
const formDef = FormiDef.object({
  username: FormiDef.value(),
  email: FormiDef.value()
  file: FormiDef.file(),
});
```

There are 4 primitive `FromiDef`:

### `FormiDef.value`

Read a value on the `FormData` with [`formData.get()`](https://developer.mozilla.org/en-US/docs/Web/API/FormData/get).

**Note**: React Formi supports `File` since it uses `FormData` under the hood !

### `FormiDef.values`

Read a list of values on the `FormData` with [`formData.getAll()`](https://developer.mozilla.org/en-US/docs/Web/API/FormData/getAll).

### `FormiDef.object`

Create a group of fields organized in an object.

### `FormiDef.repeat`

Create a field that can be repeated multiple times.

### `[formiDef].validate`

Every `FormiDef` has a `validate` method that allows you to validate and transform the field value. This method takes a function as argument. This function receive the value and must return an object:

- `{ success: true, value: T }` if the value is valid
- `{ success: false, issue?: Issue, issues?: Array<Issue> }` if the value is invalid

```ts
const formDef = FormiDef.object({
  email: FormiDef.value().validate((value) => {
    if (!isEmail(value)) {
      return { success: false, issue: { kind: 'InvalidEmail' } };
    }
    return { success: true, value };
  }),
});
```

### `FormiDef` utils

React Formi provides a few `FormiDef` with already defined validation:

- `FormiDef.string`: validate that the field is a string (not a `File`)
- `FormiDef.number`: validate string then parse it as a number.
- `FormiDef.checkbox`: validate that the field is not a `File`, return `true` if the field is checked and `false` otherwise (unchecked or not present).
- `FormiDef.file`: validate that the field is a `File`. Note that by default a `file` input will return an empty `File` so the field will not register as missing.
- `FormiDef.nonEmptyfile` same as `FormiDef.file` but will return an error if the file is empty.
- `FormiDef.zodString` validate a string then `parse` with the provided `zod` schema. This is useful if you want to use `zod` to validate your string further.
- `FormiDef.zodNumber` validate a number then `parse` with the provided `zod` schema. This is useful if you want to use `zod` to validate your number further.

## `useFormi`

> `useFormi` is the main hook of React Formi.

This hooks take an object as argument:

- `fields: FormiDef`: the form definition (see `FormiDef`).
- `formName?: string`: the name of the form, if you omit this argument a random id is used.
- `onSubmit?: OnSubmit`: this function is called when the form is submitted (see below for more details).
- `validateOnMount?: boolean`: if `true` the form will be validated on mount, otherwise it will only be validated on submit / change (default: `true`).
- `formRefObject?: MutableRefObject<HTMLFormElement | null>`: a ref object that will be set to the form element. If don't provide one, a ref will be created by React Formi.
- `issues?: FormiIssues`: external issues, like issues comming from the server.

### `OnSubmit`

The `onSubmit` function is called when the form is submitted and all validation succeeded. It takes two arguments:

- The data of the form as a object with `data` and `formData`.
- An object of actions
  - `preventDefault`
  - `preventDefault`
  - `reset`

### `useFormi` return value

The `useFormi` hook returns an object with the following properties:

- `controller: FormiController`: the `FormiController` instance.
- `fields: FormiField`: the form fields (see below for more details).
- `ref`: A ref function that must be set to the form element (you can also use `refObject`)
- `refObject`: Same as `ref` but as a ref object, use one or the other.
- `useFieldState`: Same as global `useFieldState` but scoped to the controller.
- `useFieldsState`: Same as global `useFieldsState` but scoped to the controller.
- `Form`: A component that will render the form element with the ref set and also expose the controller as a context (see `useFormiContext`).

### `formRefObject`, `ref`, `refObject` and `Form`

In order to work, React Formi needs to be able to access the form element. There are 4 ways to do this:

- ✨ Use the `Form` component returned by `useFormi` as your form element. ✨
- Create a ref object set to the `form` element and pass it to `useFormi` with the `formRefObject` argument.
- Use the `ref` function returned by `useFormi` and set it to the `form` element.
- Use the `refObject` returned by `useFormi` and set it to the `form` element.

## `FormiField`

When you call `useFormi` you get a `fields` object. This object is a `FormiField` and it represent a field of your form.

A basic `FormiField` has the following properties:

- `kind: string`: The kind of the field (`Value`, `Values`, `Object`, `Repeat`).
- `key: FormiKey`: a special object that identify the field. It is used to access the field state with `useFieldState` and `useFieldsState`.
- `id: string`: an unique id for the field
- `path: Path`: the path of the field, for example `['new-user-form', 'user', 'email']` as an instance of `Path`. You probably won't need this property.
- `def: FormiDef`: the definition that created the field.

**Note**: Both `id` and `path` include the name of the form (`formName`)

In addition to the basic properties, a `FormiField` can have other properties depending on the type of the field:

- `FormiField_Value` (from `FieldDef.value`)
  - `name: string`: the name of the field, this id is generated by React Formi from the path of the field, for example `new-user-form.user.email`.
- `FormiField_Values` (from `FieldDef.values`)
  - `name: string`: the name of the field
- `FormiField_Object` (from `FieldDef.object`)
  - `children: Record<string, FormiField>`: the children fields of the object.
  - `get: (key: string) => FormiField`: a function that return the child field with the given key.
- `FormiField_Repeat` (from `FieldDef.repeat`)
  - `children: Array<FormiField>`: the children fields.
  - `get: (index: number) => FormiField`: a function that return the child field with the given index.
  - `actions`: A set of actions to manipulate the repeat field.
    - `push: () => void`: add a new item to the repeat field.
    - `remove: (index: number) => void`: remove the item at the given index.
    - `unshift: () => void`: add a new item at the beginning of the repeat field.

## `useFieldState` and `useFieldsState`

> `useFieldState` and `useFieldsState` are hooks that allow you to access the state of a field.

### `useFieldState`

`useFieldState` takes a `FormiField` as argument and return the state of the field.

```ts
const emailState = useFieldState(fields.children.email);
const rootObjectState = useFieldState(fields);
```

For teh code above to work, the `useFieldState` hook must be called inside a `FormiContextProvider` (or inside the `Form` component returned by `useFormi`).

You can also pass the `FormiController` instance as argument:

```ts
function Component() {
  const { fields, controller } = useFormi({ fields: FormiDef.object({ email: FormiDef.value() }) });
  const emailState = useFieldState(fields.children.email, controller);
}
```

If you need to use `useFieldState` in the component that call `useFormi`, you can use the `useFieldState` returned by `useFormi` instead of the global `useFieldState`, this way you don't need to pass the `FormiController` instance as argument.

```ts
function Component() {
  const { fields, useFieldState } = useFormi({ fields: FormiDef.object({ email: FormiDef.value() }) });
  const emailState = useFieldState(fields.children.email);
}
```

### `useFieldsState`

The `useFieldsState` hook is similar to `useFieldState` but it takes an nested array or object of `FormiField` as argument and return teh same struture with teh corresponding states.

```ts
const { fields, useFieldsState } = useFormi({
  fields: FormiDef.object({
    email: FormiDef.value(),
    password: FormiDef.value(),
  }),
});

const states = useFieldsState({
  some: { nested: fields.children.email },
  arr: [fields.children.password],
});

// states.some.nested === useFieldState(fields.children.email)
// states.arr[0] === useFieldState(fields.children.password)
```

## Installation

```bash
npm install react-formi
# or
yarn add react-formi
```
