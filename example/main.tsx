import React from 'react';
import ReactDOM from 'react-dom/client';
import './new.css';
import './index.css';
import { SimpleExample } from './01-simple/SimpleExample';
import { ComponentsExample } from './02-components/ComponentsExample';
import { ServerExample } from './03-server/ServerExample';
import { FileExample } from './04-file/FileExample';

const STRICT_MODE = false;

const StrictMode = STRICT_MODE ? React.StrictMode : React.Fragment;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <SimpleExample />
      <ComponentsExample />
      <ServerExample />
      <FileExample />
    </div>
  </StrictMode>
);
