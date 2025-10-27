import { App } from './App.js';

window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    new App(root);
  }
});
