import { TodoList } from './components/TodoList.js';
import { TimerStopwatch } from './components/TimerStopwatch.js';
import { Calendar } from './components/Calendar.js';
import { UserForm } from './components/UserForm.js';

export class App {
  constructor(root) {
    this.root = root;
    this.token = null;
    this.profileFile = null;
    this.theme = localStorage.getItem('theme') || 'light';

    this.renderShell();
    this.bindThemeToggle();
    this.applyTheme();
    this.showAuth();
  }

  renderShell() {
    this.root.innerHTML = `
      <header>
        <div class="brand" aria-label="Code X Productivity Hub">
          <span class="brand-mark" aria-hidden="true">✶</span>
          <h1>Code X Productivity Hub</h1>
        </div>
        <div class="header-actions">
          <label for="theme-toggle">Theme</label>
          <select id="theme-toggle">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <button type="button" id="logout-btn" style="display:none">Logout</button>
        </div>
      </header>
      <main id="app-main"></main>
      <footer>Stay organised and focused ✨</footer>
    `;
    this.themeToggle = this.root.querySelector('#theme-toggle');
    this.logoutButton = this.root.querySelector('#logout-btn');
    this.main = this.root.querySelector('#app-main');
  }

  bindThemeToggle() {
    this.themeToggle.value = this.theme;
    this.themeToggle.addEventListener('change', (event) => {
      this.theme = event.target.value;
      this.applyTheme();
    });
  }

  applyTheme() {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(this.theme);
    localStorage.setItem('theme', this.theme);
  }

  showAuth() {
    this.logoutButton.style.display = 'none';
    this.logoutButton.removeEventListener('click', this.handleLogout);

    this.main.innerHTML = `
      <section class="card auth-container">
        <h2>Welcome back</h2>
        <form id="login-form" class="form-grid">
          <label>Username<input name="username" required /></label>
          <label>Password<input name="password" type="password" required /></label>
          <button class="primary" type="submit">Login</button>
        </form>
        <hr />
        <form id="register-form" class="form-grid">
          <h3>Create an account</h3>
          <label>Username<input name="username" required /></label>
          <label>Password<input name="password" type="password" required minlength="4" /></label>
          <button type="submit">Register</button>
        </form>
        <p id="auth-status" aria-live="polite"></p>
      </section>
    `;

    const loginForm = this.main.querySelector('#login-form');
    const registerForm = this.main.querySelector('#register-form');
    const status = this.main.querySelector('#auth-status');

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(loginForm).entries());
      status.textContent = 'Signing in…';
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const message = await response.json();
          throw new Error(message.message || 'Unable to login');
        }
        const payload = await response.json();
        this.token = payload.token;
        this.profileFile = payload.profileFile;
        this.initializeWorkspace(payload.bundle || {});
        status.textContent = '';
      } catch (error) {
        status.textContent = error.message;
      }
    });

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(registerForm).entries());
      status.textContent = 'Creating account…';
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const message = await response.json();
          throw new Error(message.message || 'Unable to register');
        }
        status.textContent = 'Account created! Please login.';
        registerForm.reset();
      } catch (error) {
        status.textContent = error.message;
      }
    });
  }

  async initializeWorkspace(bundle) {
    this.logoutButton.style.display = 'inline-flex';
    this.handleLogout = () => this.logout();
    this.logoutButton.addEventListener('click', this.handleLogout);

    this.main.innerHTML = '';
    const dashboard = document.createElement('div');
    dashboard.className = 'grid-2';

    this.todoList = new TodoList({
      onChange: (todos) => this.persistTodos(todos),
    });
    this.todoList.setTodos(bundle.todos || []);

    this.timer = new TimerStopwatch();

    this.calendar = new Calendar({
      onChange: (events) => this.persistEvents(events),
    });
    this.calendar.setEvents(bundle.events || []);

    this.userForm = new UserForm({
      onSubmit: (data, statusEl) => this.persistProfile(data, statusEl),
    });
    this.userForm.fill(bundle.profile || null);

    const leftColumn = document.createElement('div');
    const rightColumn = document.createElement('div');

    leftColumn.appendChild(this.userForm.element);
    leftColumn.appendChild(this.todoList.element);

    rightColumn.appendChild(this.timer.element);
    rightColumn.appendChild(this.calendar.element);

    dashboard.appendChild(leftColumn);
    dashboard.appendChild(rightColumn);
    this.main.appendChild(dashboard);
  }

  async authorizedFetch(path, options = {}) {
    const headers = Object.assign({}, options.headers, {
      Authorization: `Bearer ${this.token}`,
    });
    return fetch(path, { ...options, headers });
  }

  async persistProfile(data, statusEl) {
    statusEl.textContent = 'Saving profile…';
    try {
      const response = await this.authorizedFetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.message || 'Unable to save profile');
      }
      const payload = await response.json();
      this.profileFile = payload.profileFile;
      statusEl.textContent = 'Profile saved!';
    } catch (error) {
      statusEl.textContent = error.message;
    }
  }

  async persistTodos(todos) {
    if (!this.token) return;
    try {
      await this.authorizedFetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todos }),
      });
    } catch (error) {
      console.error('Unable to save todos', error);
    }
  }

  async persistEvents(events) {
    if (!this.token) return;
    try {
      await this.authorizedFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.error('Unable to save events', error);
    }
  }

  async logout() {
    if (this.token) {
      try {
        await this.authorizedFetch('/api/logout', { method: 'POST' });
      } catch (error) {
        console.error('Error while logging out', error);
      }
    }
    this.token = null;
    this.profileFile = null;
    this.showAuth();
  }
}
