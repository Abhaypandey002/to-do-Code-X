export class TimerStopwatch {
  constructor() {
    this.mode = 'timer';
    this.interval = null;
    this.remaining = 25 * 60;
    this.elapsed = 0;
    this.element = document.createElement('section');
    this.element.className = 'card';
    this.element.innerHTML = `
      <div class="section-title">
        <span>Timer & Stopwatch</span>
        <div>
          <label for="mode-toggle">Mode</label>
          <select id="mode-toggle">
            <option value="timer">Timer</option>
            <option value="stopwatch">Stopwatch</option>
          </select>
        </div>
      </div>
      <div class="timer-display">25:00</div>
      <div class="timer-controls">
        <button type="button" class="primary" data-action="start">Start</button>
        <button type="button" data-action="stop">Stop</button>
        <button type="button" data-action="reset">Reset</button>
      </div>
    `;
    this.display = this.element.querySelector('.timer-display');
    this.modeSelect = this.element.querySelector('#mode-toggle');
    this.element.querySelector('[data-action="start"]').addEventListener('click', () => this.start());
    this.element.querySelector('[data-action="stop"]').addEventListener('click', () => this.stop());
    this.element.querySelector('[data-action="reset"]').addEventListener('click', () => this.reset());
    this.modeSelect.addEventListener('change', (event) => {
      this.mode = event.target.value;
      this.reset();
    });
    this.updateDisplay();
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      if (this.mode === 'timer') {
        this.remaining = Math.max(0, this.remaining - 1);
        if (this.remaining === 0) {
          this.stop();
        }
      } else {
        this.elapsed += 1;
      }
      this.updateDisplay();
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  reset() {
    this.stop();
    if (this.mode === 'timer') {
      this.remaining = 25 * 60;
    } else {
      this.elapsed = 0;
    }
    this.updateDisplay();
  }

  updateDisplay() {
    let seconds;
    if (this.mode === 'timer') {
      seconds = this.remaining;
    } else {
      seconds = this.elapsed;
    }
    const minutesPart = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secondsPart = String(seconds % 60).padStart(2, '0');
    this.display.textContent = `${minutesPart}:${secondsPart}`;
  }
}
