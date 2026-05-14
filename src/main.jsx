import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './styles/tokens.css';
import './styles/home.css';
import './styles/record.css';
import './styles/stats.css';
import './styles/issue.css';
import './styles/notice.css';
import './styles/certificate.css';
import './styles/auth.css';
import './styles/claim.css';
import './styles/account.css';
import './styles/hybridProfile.css';
import './styles/app.css';

import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
