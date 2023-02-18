# 📄 React Formi

> A type-safe form librairy for React

## Features

- 🍰 **Easy to use**: React Formi provides a simple API to create forms, and a simple way to use them in your components.
- 🔒 **Type safe**: React Formi is built with TypeScript and provides type safety for your forms, including typing field validation issues !
- ✨ **FormData based**: React Formi manipulates the native FormData API, this mean that you can validate your form on the backend with the same code as on the frontend.
- 🪶 **Very few dependencies**: React Formi only has a few dependencies (2 at the time of writing).
- 🔐 **Server validation**: With React Formi you can validate your form on the server using the same schema as on the frontend as well as a way to display the validation issues.
- 🚀 **Fast**: React Formi is built with performance in mind so your components only render when they need to.
- 🛡 **Zod validation**: React Formi offers convinient tools to validate your form with [Zod](https://github.com/colinhacks/zod) but you can use any validation library you want (and zod is not a dependency of React Formi).
- 🛠 **Transformations**: React Formi offers a way to transform your form data, this allow your form to output data in the shape you want.
- 🧩 **Dynamic fields**: With React Formi you can dynamically change the shape of your form and it's not limited to arrays !

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

To do so, React Formi only needs a ref to the `form` element, then it listens to the `change`, `reset` and `submit` events to update its state.

**Note**: The `change` event of the `form` element is only triggered when the user `blurs` an input (click outside / press tab) with a different value. This means that with React Formi you don't get _validation as you type_ (you can if you really want). This behavior is the same as the default one in the browser and garantees that writing in an input is always fast.

Internally React Formi uses two data structures to keep track of the state of the form:

- A tree of `fields` for the shape of the form, each field has a `key` that identifies it
- A `Map` to keep the validation state of each field (identified by its `key`)

# Examples

You can find many examples in the `examples` folder. You can run them with:

```bash
yarn example:run
```

# API

_TODO_
