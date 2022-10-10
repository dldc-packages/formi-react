# 📄 React Formi [![Build Status](https://travis-ci.org/etienne-dldc/react-formi.svg?branch=master)](https://travis-ci.org/etienne-dldc/react-formi) [![](https://badgen.net/bundlephobia/minzip/react-formi)](https://bundlephobia.com/result?p=react-formi) [![codecov](https://codecov.io/gh/etienne-dldc/react-formi/branch/master/graph/badge.svg)](https://codecov.io/gh/etienne-dldc/react-formi)

> A type-safe react form hook using zod for validation

This package use the experimental [`use-sync-external-store`](https://www.npmjs.com/package/use-sync-external-store) package.

## Installation

```bash
npm install react-formi
# or
yarn add react-formi
```

## Internal structure

State of each input (value, error, touched...) is store in a map where the key is a `FieldKey` (an empty object).

We don't use the `name` of the input as key because it can change (when you unshift an array for example).
