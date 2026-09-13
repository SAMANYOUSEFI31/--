/**
 * Reactive State Store
 * Second Brain App v1.0.0
 */
class Store {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._subscribers = new Map();
  }

  get(key) {
    if (key === undefined) return { ...this._state };
    return this._state[key];
  }

  set(key, value) {
    const prev = this._state[key];
    if (prev === value) return;
    this._state[key] = value;
    this._notify(key, value, prev);
  }

  merge(updates) {
    Object.entries(updates).forEach(([key, value]) => this.set(key, value));
  }

  subscribe(keys, callback) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const unsubs = keyList.map(key => {
      if (!this._subscribers.has(key)) this._subscribers.set(key, new Set());
      this._subscribers.get(key).add(callback);
      return () => this._subscribers.get(key).delete(callback);
    });
    return () => unsubs.forEach(fn => fn());
  }

  _notify(key, newValue, oldValue) {
    [key, "*"].forEach(k => {
      if (this._subscribers.has(k)) {
        this._subscribers.get(k).forEach(cb => cb(newValue, oldValue, key));
      }
    });
  }
}

const appState = new Store({
  currentPage: "dashboard",
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  theme: "light",
  isLoading: true,
  searchQuery: "",
  searchResults: [],
  modalOpen: false,
  modalType: null,
  modalData: null,
  notes: [], tasks: [], projects: [], goals: [],
  stats: { totalNotes: 0, pendingTasks: 0, activeProjects: 0, goalsProgress: 0 }
});

export default appState;
