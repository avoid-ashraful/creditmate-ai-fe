import React from 'react';
import ReactDOM from 'react-dom/client';

import './styles/tokens.css';
import './styles/index.css';
import RootApp from './App';
import reportWebVitals from './reportWebVitals';

// Prevent flash of wrong theme on page load: apply stored theme before rendering
(function initializeTheme() {
  const THEME_STORAGE_KEY = 'creditmate-theme';
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }
})();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example, reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
