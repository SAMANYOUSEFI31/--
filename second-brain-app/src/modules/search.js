/**
 * Search Module
 * Second Brain App v1.0.0
 */
import storage from "../core/storage.js";
import appState from "../core/state.js";

class SearchManager {
  constructor() {
    this._debounceTimer = null;
    this._debounceDelay = 300;
    this._minLength = 2;
    this._listeners = new Set();
  }

  init() {
    const input = document.getElementById("global-search-input");
    if (!input) return;
    input.addEventListener("input", e => {
      const query = e.target.value.trim();
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => this.search(query), this._debounceDelay);
      input.closest(".search-wrapper")?.classList.toggle("has-value", query.length > 0);
    });
    input.addEventListener("keydown", e => { if (e.key === "Escape") { this.clear(); input.blur(); } });
    document.querySelector(".search-clear")?.addEventListener("click", () => this.clear());
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); input.focus(); input.select(); }
    });
  }

  search(query) {
    appState.set("searchQuery", query);
    if (!query || query.length < this._minLength) { appState.set("searchResults", []); this._notify([]); return []; }
    const results = storage.search(query);
    appState.set("searchResults", results);
    this._notify(results, query);
    return results;
  }

  highlight(text, query) {
    if (!query || !text) return text || "";
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return String(text).replace(new RegExp(`(${escaped})`, "gi"), "<mark class=\"search-highlight\">$1</mark>");
  }

  clear() {
    const input = document.getElementById("global-search-input");
    if (input) { input.value = ""; input.closest(".search-wrapper")?.classList.remove("has-value"); }
    appState.set("searchQuery", ""); appState.set("searchResults", []);
    this._notify([]);
  }

  onResults(callback) { this._listeners.add(callback); return () => this._listeners.delete(callback); }
  _notify(results, query = "") { this._listeners.forEach(cb => cb(results, query)); }
}

const search = new SearchManager();
export default search;
