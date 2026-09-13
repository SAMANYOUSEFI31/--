/**
 * Theme Manager
 * Second Brain App v1.0.0
 */
const THEME_KEY = "sb-theme";

class ThemeManager {
  constructor() {
    this._current = "light";
    this._listeners = new Set();
  }

  init() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && ["light","dark"].includes(saved)) {
      this._current = saved;
    } else {
      this._current = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    this._apply();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
      if (!localStorage.getItem(THEME_KEY)) this.set(e.matches ? "dark" : "light", false);
    });
  }

  _apply() {
    document.documentElement.setAttribute("data-theme", this._current);
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(`theme-${this._current}`);
    const metaTheme = document.querySelector("meta[name='theme-color']");
    if (metaTheme) metaTheme.content = this._current === "dark" ? "#0f172a" : "#6366f1";
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) {
      const icon = btn.querySelector("i");
      if (icon) icon.className = this._current === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
    this._listeners.forEach(cb => cb(this._current));
  }

  set(theme, persist = true) {
    if (!["light","dark"].includes(theme)) return;
    this._current = theme;
    if (persist) localStorage.setItem(THEME_KEY, theme);
    this._apply();
  }

  toggle() { this.set(this._current === "light" ? "dark" : "light"); }
  get current() { return this._current; }
  get isDark() { return this._current === "dark"; }
  onChange(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }
}

const theme = new ThemeManager();
export default theme;
