import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MotorProvider } from './context/MotorContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotorProvider>
      <App />
    </MotorProvider>
  </React.StrictMode>,
);
