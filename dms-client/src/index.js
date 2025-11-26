// my-dms-client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Import Bootstrap CSS globally (Must be present!)
import 'bootstrap/dist/css/bootstrap.min.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);