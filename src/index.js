import 'bootstrap/dist/css/bootstrap.min.css';

// import $ from 'jquery';
// import Popper from 'popper.js';
import 'jquery/src/jquery';

import 'bootstrap/dist/js/bootstrap.min';

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { unregister } from './registerServiceWorker';
import { BrowserRouter } from 'react-router-dom';

unregister();

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<BrowserRouter><App /></BrowserRouter>);
