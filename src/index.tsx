import React from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import './styles/bootstrap_replacement.css';
import App from './App';
import {Auth} from './libs/auth/auth';
import {unregister} from './registerServiceWorker';
import {BrowserRouter} from 'react-router-dom';

const load = async () => {
  unregister();
  await Auth.initialize();
  const container = document.getElementById('root');
  const root = createRoot(container!);
  root.render(<BrowserRouter><App/></BrowserRouter>);
};

await load();
