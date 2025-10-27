export class TodoList {
  constructor({ onChange }) {
    this.onChange = onChange;
    this.todos = [];
    this.generateId =
      (typeof crypto !== 'undefined' && crypto.randomUUID && (() => crypto.randomUUID())) ||
      (() => Math.random().toString(36).slice(2, 10));
    this.suspendNotify = false;
    this.element = document.createElement('section');
    this.element.className = 'card';
    this.element.innerHTML = `
      <h2 class="section-title">To-Do List</h2>
      <form class="todo-form">
        <label class="visually-hidden" for="todo-input">Add task</label>
        <div class="grid-2">
          <input id="todo-input" type="text" placeholder="Add a new task" required />
          <button type="submit" class="primary">Add Task</button>
        </div>
      </form>
      <div class="todo-container"></div>
    `;
    this.form = this.element.querySelector('.todo-form');
    this.input = this.element.querySelector('#todo-input');
    this.list = this.element.querySelector('.todo-container');
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = this.input.value.trim();
      if (!value) return;
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : this.generateId();
      this.todos.push({ id, title: value, completed: false });
      this.input.value = '';
      this.render();
    });
  }

  setTodos(todos) {
    this.suspendNotify = true;
    this.todos = Array.isArray(todos) ? todos : [];
    this.render();
    this.suspendNotify = false;
  }

  render() {
    this.list.innerHTML = '';
    if (!this.todos.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No tasks yet. Create your first task!';
      this.list.appendChild(empty);
    } else {
      this.todos.forEach((todo) => {
        const item = document.createElement('div');
        item.className = `todo-item ${todo.completed ? 'completed' : ''}`.trim();
        item.innerHTML = `
          <span class="todo-title">${todo.title}</span>
          <div class="todo-actions">
            <button type="button" data-action="toggle" aria-label="Toggle completion">${
              todo.completed ? 'Undo' : 'Done'
            }</button>
            <button type="button" data-action="delete" aria-label="Delete task">Delete</button>
          </div>
        `;
        item.querySelector('[data-action="toggle"]').addEventListener('click', () => {
          todo.completed = !todo.completed;
          this.notifyChange();
          this.render();
        });
        item.querySelector('[data-action="delete"]').addEventListener('click', () => {
          this.todos = this.todos.filter((entry) => entry.id !== todo.id);
          this.notifyChange();
          this.render();
        });
        this.list.appendChild(item);
      });
    }
    this.notifyChange();
  }

  notifyChange() {
    if (!this.suspendNotify && typeof this.onChange === 'function') {
      this.onChange(this.todos);
    }
  }
}
