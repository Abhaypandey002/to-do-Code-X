import { formatISODate, getMonthMatrix } from '../utils/date.js';

export class Calendar {
  constructor({ onChange }) {
    this.onChange = onChange;
    this.events = [];
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.element = document.createElement('section');
    this.element.className = 'card';
    this.element.innerHTML = `
      <div class="section-title">
        <span>Calendar</span>
        <div class="calendar-nav">
          <button type="button" data-direction="prev" aria-label="Previous month">◀</button>
          <strong class="calendar-month"></strong>
          <button type="button" data-direction="next" aria-label="Next month">▶</button>
        </div>
      </div>
      <div class="calendar-grid calendar-weekdays"></div>
      <div class="calendar-grid calendar-days"></div>
      <form class="event-form">
        <h3>Plan an event</h3>
        <p class="selected-date"></p>
        <label>Title<input type="text" name="title" required /></label>
        <label>Description<textarea name="description" rows="2" required></textarea></label>
        <button type="submit" class="primary">Save Event</button>
      </form>
      <div class="event-list" aria-live="polite"></div>
    `;

    this.monthLabel = this.element.querySelector('.calendar-month');
    this.weekdayGrid = this.element.querySelector('.calendar-weekdays');
    this.daysGrid = this.element.querySelector('.calendar-days');
    this.selectedDateLabel = this.element.querySelector('.selected-date');
    this.eventForm = this.element.querySelector('.event-form');
    this.eventList = this.element.querySelector('.event-list');

    this.renderWeekdays();
    this.render();

    this.element.querySelectorAll('.calendar-nav button').forEach((button) => {
      button.addEventListener('click', () => {
        const direction = button.dataset.direction;
        this.changeMonth(direction === 'next' ? 1 : -1);
      });
    });

    this.eventForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(this.eventForm);
      const title = formData.get('title').trim();
      const description = formData.get('description').trim();
      if (!title || !description) return;
      const dateKey = formatISODate(this.selectedDate);
      this.events = this.events.filter((entry) => !(entry.date === dateKey && entry.title === title));
      this.events.push({ date: dateKey, title, description });
      this.eventForm.reset();
      this.renderEventList();
      this.renderDays();
      if (typeof this.onChange === 'function') {
        this.onChange(this.events);
      }
    });
  }

  setEvents(events) {
    this.events = Array.isArray(events) ? events : [];
    this.renderDays();
    this.renderEventList();
  }

  changeMonth(step) {
    this.currentDate.setMonth(this.currentDate.getMonth() + step);
    this.render();
  }

  selectDate(date) {
    this.selectedDate = date;
    this.selectedDateLabel.textContent = date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this.renderDays();
    this.renderEventList();
  }

  render() {
    this.monthLabel.textContent = this.currentDate.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    this.renderDays();
    this.selectDate(this.selectedDate);
  }

  renderWeekdays() {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    this.weekdayGrid.innerHTML = '';
    weekdays.forEach((day) => {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';
      cell.textContent = day;
      this.weekdayGrid.appendChild(cell);
    });
  }

  renderDays() {
    const matrix = getMonthMatrix(this.currentDate);
    const dateKey = formatISODate(this.selectedDate);
    const eventDates = new Set(this.events.map((event) => event.date));
    this.daysGrid.innerHTML = '';
    matrix.forEach(({ date, currentMonth }) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'calendar-cell';
      if (!currentMonth) {
        cell.style.opacity = '0.35';
      }
      const cellDateKey = formatISODate(date);
      if (eventDates.has(cellDateKey)) {
        cell.classList.add('has-event');
      }
      if (cellDateKey === dateKey) {
        cell.classList.add('selected');
      }
      cell.textContent = date.getDate();
      cell.addEventListener('click', () => {
        this.selectedDate = date;
        this.selectDate(date);
      });
      this.daysGrid.appendChild(cell);
    });
  }

  renderEventList() {
    const dateKey = formatISODate(this.selectedDate);
    const events = this.events.filter((event) => event.date === dateKey);
    this.eventList.innerHTML = '';
    if (!events.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No events for this day yet.';
      this.eventList.appendChild(empty);
      return;
    }
    events.forEach((event) => {
      const item = document.createElement('article');
      item.className = 'event-item';
      item.innerHTML = `<strong>${event.title}</strong><p>${event.description}</p>`;
      this.eventList.appendChild(item);
    });
  }
}
