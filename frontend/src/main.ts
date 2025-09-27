import './app.css';
import './dev-init.ts'; // Keep dev tools initialization
import { mount } from 'svelte';
import App from './lib/App.svelte';

const app = mount(App, {
  target: document.getElementById('app'),
});

export default app;
