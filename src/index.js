import 'bootstrap/dist/css/bootstrap.min.css';

// import $ from 'jquery';
// import Popper from 'popper.js';
import 'jquery/src/jquery';

import 'bootstrap/dist/js/bootstrap.min';

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
  , document.getElementById('root'));
registerServiceWorker();
<<<<<<< HEAD

=======
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9
