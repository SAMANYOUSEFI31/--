/**
 * Notification System - Toast notifications
 * Second Brain App v1.0.0
 */
class NotificationManager {
  constructor() {
    this._container = null;
    this._active = new Map();
    this._idCounter = 0;
    this._defaultDuration = 4000;
    this._maxVisible = 5;
  }

  init() {
    this._container = document.getElementById("notification-container");
    if (!this._container) {
      this._container = document.createElement("div");
      this._container.id = "notification-container";
      this._container.className = "notification-container";
      document.body.appendChild(this._container);
    }
  }

  show(message, type = "info", options = {}) {
    const id = ++this._idCounter;
    const duration = options.duration ?? this._defaultDuration;
    const el = this._create(id, message, type, options.title || null, options.action || null);
    this._container.appendChild(el);
    this._active.set(id, el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("show")));
    if (duration > 0) el._timer = setTimeout(() => this.dismiss(id), duration);
    if (this._active.size > this._maxVisible) {
      this.dismiss(this._active.keys().next().value);
    }
    return id;
  }

  _create(id, message, type, title, action) {
    const icons = { success:"fas fa-check-circle", error:"fas fa-times-circle", warning:"fas fa-exclamation-triangle", info:"fas fa-info-circle" };
    const el = document.createElement("div");
    el.className = `notification notification-${type}`;
    el.dataset.id = id;
    el.innerHTML = `
      <div class="notification-icon"><i class="${icons[type] || icons.info}"></i></div>
      <div class="notification-body">
        ${title ? `<div class="notification-title">${title}</div>` : ""}
        <div class="notification-message">${message}</div>
        ${action ? `<button class="notification-action">${action.label}</button>` : ""}
      </div>
      <button class="notification-close" aria-label="بستن"><i class="fas fa-times"></i></button>
    `;
    el.querySelector(".notification-close").addEventListener("click", () => this.dismiss(id));
    if (action) el.querySelector(".notification-action")?.addEventListener("click", () => { action.handler(); this.dismiss(id); });
    return el;
  }

  dismiss(id) {
    const el = this._active.get(id);
    if (!el) return;
    clearTimeout(el._timer);
    el.classList.remove("show");
    el.classList.add("hide");
    setTimeout(() => { el.parentNode?.removeChild(el); this._active.delete(id); }, 300);
  }

  dismissAll() { this._active.forEach((_, id) => this.dismiss(id)); }
  success(message, options = {}) { return this.show(message, "success", options); }
  error(message, options = {}) { return this.show(message, "error", { duration: 6000, ...options }); }
  warning(message, options = {}) { return this.show(message, "warning", options); }
  info(message, options = {}) { return this.show(message, "info", options); }
}

const notifications = new NotificationManager();
export default notifications;
