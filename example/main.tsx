import React from 'react';
import ReactDOM from 'react-dom/client';
import { SimpleExample } from './01-simple/SimpleExample';
import './index.css';
import './new.css';

const STRICT_MODE = false;

const StrictMode = STRICT_MODE ? React.StrictMode : React.Fragment;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <h1>React Formi Examples</h1>
      <SimpleExample />
      {/* <ComponentsExample />
      <ServerExample />
      <FileExample />
      <DateExample />
      <RepeatExample />
      <SingleInputExample />
      <InputTypesExample /> */}
    </div>
  </StrictMode>
);
