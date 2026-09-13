/**
 * Modal System
 * Second Brain App v1.0.0
 */
class ModalManager {
  constructor() {
    this._overlay = null;
    this._container = null;
    this._content = null;
    this._isOpen = false;
    this._onClose = null;
  }

  init() {
    this._overlay = document.getElementById("modal-overlay");
    this._container = document.getElementById("modal-container");
    this._content = document.getElementById("modal-content");
    if (!this._overlay) this._createDOM();
    this._bindEvents();
  }

  _createDOM() {
    this._overlay = document.createElement("div");
    this._overlay.id = "modal-overlay";
    this._overlay.className = "modal-overlay";
    this._container = document.createElement("div");
    this._container.id = "modal-container";
    this._container.className = "modal-container";
    this._content = document.createElement("div");
    this._content.id = "modal-content";
    this._container.appendChild(this._content);
    this._overlay.appendChild(this._container);
    document.body.appendChild(this._overlay);
  }

  _bindEvents() {
    this._overlay.addEventListener("click", e => { if (e.target === this._overlay) this.close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && this._isOpen) this.close(); });
  }

  open(content, options = {}) {
    const { size = "medium", onClose = null } = options;
    this._onClose = onClose;
    this._content.innerHTML = content;
    this._container.className = `modal-container modal-${size}`;
    this._overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    this._isOpen = true;
    setTimeout(() => {
      this._content.querySelectorAll("[data-modal-close], .modal-close-btn").forEach(btn => btn.addEventListener("click", () => this.close()));
      this._content.querySelectorAll("form[data-form]").forEach(form => {
        form.addEventListener("submit", e => { e.preventDefault(); this._handleSubmit(form); });
      });
      const firstInput = this._content.querySelector("input, textarea, select");
      if (firstInput) firstInput.focus();
    }, 50);
    return this;
  }

  close() {
    if (!this._isOpen) return;
    this._overlay.classList.remove("active");
    document.body.style.overflow = "";
    this._isOpen = false;
    this._onClose?.();
    setTimeout(() => { this._content.innerHTML = ""; }, 300);
  }

  _handleSubmit(form) {
    const formType = form.dataset.form;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    form.dispatchEvent(new CustomEvent("modal:submit", { detail: { formType, data, form }, bubbles: true }));
  }

  update(content) { if (this._isOpen) this._content.innerHTML = content; }

  confirm(message, options = {}) {
    return new Promise(resolve => {
      const { title = "تأیید", confirmText = "تأیید", cancelText = "لغو", type = "warning" } = options;
      const colors = { warning:"#f59e0b", danger:"#ef4444", info:"#06b6d4" };
      const icons = { warning:"fas fa-exclamation-triangle", danger:"fas fa-trash", info:"fas fa-info-circle" };
      this.open(`
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="btn btn-ghost btn-icon modal-close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body" style="text-align:center;padding:2rem;">
          <div style="font-size:3rem;color:${colors[type]};margin-bottom:1rem;"><i class="${icons[type]}"></i></div>
          <p style="color:var(--text-secondary);font-size:1rem;line-height:1.6;">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="confirm-cancel">${cancelText}</button>
          <button class="btn ${type === "danger" ? "btn-danger" : "btn-primary"}" id="confirm-ok">${confirmText}</button>
        </div>
      `, { size: "small" });
      setTimeout(() => {
        document.getElementById("confirm-ok")?.addEventListener("click", () => { this.close(); resolve(true); });
        document.getElementById("confirm-cancel")?.addEventListener("click", () => { this.close(); resolve(false); });
      }, 50);
    });
  }

  get isOpen() { return this._isOpen; }
}

const modal = new ModalManager();
export default modal;
