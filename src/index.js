import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Icon from './assets/icon.png';
import './App.css';
// Lenis disabled for native-speed scrolling

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// (Optional) Re-enable Lenis here if needed

// Set favicon to assets/icon.png
(function setFavicon() {
  try {
    const head = document.head || document.getElementsByTagName('head')[0];
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      head.appendChild(link);
    }
    link.href = Icon;
  } catch (_) {}
})();

