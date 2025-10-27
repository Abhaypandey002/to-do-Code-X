export class UserForm {
  constructor({ onSubmit }) {
    this.onSubmit = onSubmit;
    this.element = document.createElement('section');
    this.element.className = 'card';
    this.element.innerHTML = `
      <h2 class="section-title">Tell us about you</h2>
      <form class="user-form form-grid">
        <label>Name<input type="text" name="name" required /></label>
        <label>Phone number<input type="tel" name="phone" required pattern="[0-9+\-\s]{6,}" /></label>
        <label>College / School<input type="text" name="school" required /></label>
        <label>Goal<textarea name="goal" rows="3" required></textarea></label>
        <button type="submit" class="primary">Save profile</button>
      </form>
      <p class="form-status" aria-live="polite"></p>
    `;
    this.form = this.element.querySelector('.user-form');
    this.status = this.element.querySelector('.form-status');
    this.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(this.form).entries());
      if (typeof this.onSubmit === 'function') {
        await this.onSubmit(data, this.status);
      }
    });
  }

  fill(profile) {
    if (!profile) return;
    this.form.name.value = profile.name || '';
    this.form.phone.value = profile.phone || '';
    this.form.school.value = profile.school || '';
    this.form.goal.value = profile.goal || '';
  }
}
