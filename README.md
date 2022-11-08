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
- 🧩 **Dynamic fields**: With React Formi you can dynamically change the shape of your form.

## Motivations

This library is heavily inspired by [`react-zorm`](https://github.com/esamattis/react-zorm). It uses the same principle of using the `FormData` API at its core, to allow for easy validation on the backend. In other words, you can validate your form on the backend with the same code you use to validate the form on the frontend. Where this library differs from `react-zorm` is that it does not use zod to defined the shape of your form and has some additional features like dynamic fields.

## Gist

```tsx
import React from 'react';
import { z } from 'zod';
import { FormiField, useFormi } from '../../src';
import { TextInput } from './TextInput';

/**
 * 1. Define the form fields
 */
const simpleFields = {
  username: FormiField.string(),
  email: FormiField.string(),
  password: FormiField.string(),
};

export function ComponentsExample() {
  /**
   * 2. Use the useFormi hook to create a form instance
   */
  const { fields, Form } = useFormi({
    formName: 'components',
    initialFields: simpleFields,
  });

  return (
    <Form>
      <h2>Components</h2>
      <p>
        In this example we use a custom <code>TextInput</code> component. We use <code>useFormiFieldState</code> to get the state of a field
        and display validation errors.
      </p>
      <TextInput label="Username" field={fields.username} type="text" defaultValue="my-username" />
      <TextInput label="Email" field={fields.email} type="email" />
      <TextInput label="Password" field={fields.password} type="password" />
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
```

## Installation

```bash
npm install react-formi
# or
yarn add react-formi
```

## How it works

React Formi let the browser handle the state of each inputs (they are uncontrolled). But that does not mean that React Formi has no state. React Formi is in charge of two things:

- The state of the shape of the form (the structure, or schema of the form) and the names of the inputs.
- The state of the validation and transformation of the form (field issues, submitted, etc).

To do so, React Formi only needs a ref to the `form` element, then it listens the `change`, `reset` and `submit` events to update its state.

**Note**: The `change` event of the `form` element is only triggered when the user `blurs` an input (click outside / press tab) with a different value. This means that with React Formi you don't get _validation as you type_ (you can if you really want). This behavior is the same as the default one in the browser and garantees that writing in an input is always fast.

# API

## `FormiField`

> `FormiField` allows you to define the shape of your form, think of it as a `zod` schema but for forms.

_TODO_

## `FormiFieldTree`

_TODO_

## `useFormi`

> `useFormi` is the main hook of React Formi.

This hooks take an object as argument:

- `initialFields: FormiFieldTree`: the form definition (see `FormiFieldTree`).
- `formName?: string`: the name of the form, if you omit this argument a random id is used.
- `onSubmit?: OnSubmit`: this function is called when the form is submitted (see below for more details).
- `validateOnMount?: boolean`: if `true` the form will be validated on mount, otherwise it will only be validated on submit / change (default: `true`).
- `formRefObject?: MutableRefObject<HTMLFormElement | null>`: a ref object that will be set to the form element. If don't provide one, a ref will be created by React Formi.
- `issues?: FormiIssues`: external issues, like issues comming from the server.

### `OnSubmit`

The `onSubmit` function is called when the form is submitted and all validation succeeded. It receives two arguments:

- The data of the form as a object with `value` and `formData`.
- An object of actions
  - `preventDefault`
  - `preventDefault`
  - `reset`

### `useFormi` return value

The `useFormi` hook returns an object with the following properties:

- `controller: FormiController`: the `FormiController` instance.
- `refObject`: Same as `ref` but as a ref object, use one or the other.
- `ref`: A ref function that must be set to the form element (you can also use `refObject`)
- `fields: FormiFieldTree`: the form fields (see below for more details).
- `setFields`: A function that allows you to change the form fields.
- `useFieldState`: Same as global `useFieldState` but scoped to the controller.
- `useFieldsState`: Same as global `useFieldsState` but scoped to the controller.
- `Form`: A component that will render the form element with the ref set and also expose the controller as a context (see `useFormiContext`).

### `formRefObject`, `ref`, `refObject` and `Form`

In order to work, React Formi needs to be able to access the form element. There are 4 ways to do this:

- ✨ Use the `Form` component returned by `useFormi` as your form element. ✨
- Create a ref object set to the `form` element and pass it to `useFormi` with the `formRefObject` argument.
- Use the `ref` function returned by `useFormi` and set it to the `form` element.
- Use the `refObject` returned by `useFormi` and set it to the `form` element.

## `FormiFieldState`, `useFieldState` and `useFieldsState`

> `useFieldState` and `useFieldsState` are hooks that allow you to access the state (`FormiFieldState`) of a field.

### `FormiFieldState`

The `FormiFieldState` type contains the following properties:

```ts
{
  key: FormiKey;
  path: Path;
  name: string; // path as string
  keys: ReadonlySet<FormiKey>;

  initialRawValue: Input | undefined;
  rawValue: Input | undefined;
  value: Value | undefined;
  issues: null | Array<Issue>;
  touchedIssues: null | Array<Issue>;
  hasExternalIssues: boolean; // Issues from initial issues or SetIssues
  isMounted: boolean;
  isTouched: boolean;
  isDirty: boolean;
  isSubmitted: boolean;
}
```

### `useFieldState`

`useFieldState` takes a `FormiField` as argument and return the state of the field.

```ts
const emailState = useFieldState(fields.email);
```

For the code above to work, the `useFieldState` hook must be called inside a `FormiContextProvider` (or inside the `Form` component returned by `useFormi`).

You can also pass the `FormiController` instance as argument:

```ts
function Component() {
  const { fields, controller } = useFormi({ fields: { email: FormiField.string() } });
  const emailState = useFieldState(fields.email, controller);
}
```

If you need to use `useFieldState` in the component that call `useFormi`, you can use the `useFieldState` returned by `useFormi` instead of the global `useFieldState`, this way you don't need to pass the `FormiController` instance as argument.

```ts
function Component() {
  const { fields, useFieldState } = useFormi({ fields: { email: FormiField.value() } });
  const emailState = useFieldState(fields.email);
}
```

### `useFieldsState`

The `useFieldsState` hook is similar to `useFieldState` but it takes `FormiFieldTree` as argument and return the same struture with the corresponding states.

```ts
const { fields, useFieldsState } = useFormi({
  fields: {
    email: FormiField.value(),
    password: FormiField.value(),
  },
});

const states = useFieldsState({
  some: { nested: fields.email },
  arr: [fields.password],
});

// states.some.nested === useFieldState(fields.email)
// states.arr[0] === useFieldState(fields.password)
```

<!-- ### State of a field

The state of a field is an object with the following properties:

- `key: FormiKey` The key of the field (same as `field.key`)
- `initialRawValue: any | undefined`: The initial raw value of the field.
- `rawValue: any | undefined`: The raw value of the field.
- `value: Value | undefined`: The value of the field of tha validation succeed (might be transformed).
- `issues: null | Array<Issue>`: The issues of the field if the validation failed.
- `touchedIssues: null | Array<Issue>`: ✨ Same as `issues` but is only set when `isTouched` is true.
- `hasExternalIssues: boolean`: True if the field has external issues (passed to the `issues` option of `useFormi`).
- `isMounted: boolean`: The field is mounted if the input is present in the `FormData`
- `isTouched: boolean`: True if the field has been touched (changed by the user).
- `isDirty: boolean`: True if the field is different from the initial value.
- `isSubmitted: boolean`: True if the field has been submitted.

**Note**: In most cases, all you need is the `touchedIssues` property ! -->

## Handling issues

### Returning issues from the `validate` function

In the `validate` function, if you return `success: false` you can return:

- One issue with `issue` field
- An array of issues with `issues` field
- No issues

An issue can be anything (they are not touched by React Formi) but it is recommended to use an object with a `kind` property to be able to identify the issue.

```ts
const fields = {
  email: FormiField.string().validate((value) => {
    if (!isValidEmail(value)) {
      return { success: false, issue: { kind: 'InvalidEmail' } };
    }
    return { success: true, value };
  }),
};
```

### State `issues` and `touchedIssues`

When you read the state of a field with `useFieldState` or `useFieldsState`, the `issues` and `touchedIssues` properties are set if the validation failed. Then contains the same content but `touchedIssues` is only set when `isTouched` is true.

### Passing external issues to `useFormi`

You can pass external issues to `useFormi` with the `issues` option. This is useful if you want to display issues that come from the server for example.

This option expect an array obj object with a `path` and `issues` properties.

**Note**: The `path` must include the name of the form as it's first element !

```ts
const externalIssues = [
  { path: ['user', 'email'], issues: [{ kind: 'InvalidEmail' }] },
  { path: ['user', 'password'], issues: [{ kind: 'InvalidPassword' }] },
];

useFormi({
  formName: 'user',
  initialFields: {
    email: FormiField.string(),
    password: FormiField.string(),
  },
  issues: externalIssues,
});
```

**Note**: As soon as the user change the value of a field, the external issues are removed.

## Validating on the server

You can validate a form on the server with `FormiController.validate`. For this to work correctly you **need** to pass a defined `formName` to `useFormi`.

This function takes two arguments:

- `options`: the same options as `useFormi`
- `data`: the `FormData` to validate

_TODO: Return type of validate_
