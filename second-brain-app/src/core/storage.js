/**
 * Storage Module - Data persistence
 * Second Brain App v1.0.0
 */
const STORAGE_KEY = "second-brain-v1";
const SCHEMA_VERSION = 1;

function getDefaultData() {
  return {
    _version: SCHEMA_VERSION,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    notes: [], tasks: [], projects: [], goals: [],
    habits: [], events: [], knowledge: [],
    settings: { theme: "light", language: "fa", notifications: true, sidebarCollapsed: false },
    user: { name: "", avatar: null, preferences: {} }
  };
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

class StorageManager {
  constructor() {
    this._data = null;
    this._listeners = new Map();
    this._init();
  }

  _init() {
    this._data = this._load();
    this._migrate();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultData();
      return { ...getDefaultData(), ...JSON.parse(raw) };
    } catch (err) {
      console.error("[Storage] Load error:", err);
      return getDefaultData();
    }
  }

  _save() {
    try {
      this._data._updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
      return true;
    } catch (err) {
      console.error("[Storage] Save error:", err);
      return false;
    }
  }

  _migrate() {
    if ((this._data._version || 0) < SCHEMA_VERSION) {
      this._data._version = SCHEMA_VERSION;
      this._save();
    }
  }

  _emit(collection, action, item) {
    [collection, "*"].forEach(key => {
      if (this._listeners.has(key)) {
        this._listeners.get(key).forEach(cb => cb({ action, item, collection }));
      }
    });
  }

  on(collection, callback) {
    if (!this._listeners.has(collection)) this._listeners.set(collection, new Set());
    this._listeners.get(collection).add(callback);
    return () => this._listeners.get(collection).delete(callback);
  }

  getAll() { return this._data; }
  getCollection(name) { return this._data[name] || []; }
  getSettings() { return this._data.settings || {}; }

  updateSettings(updates) {
    this._data.settings = { ...this._data.settings, ...updates };
    this._save();
    this._emit("settings", "update", this._data.settings);
    return this._data.settings;
  }

  getUser() { return this._data.user || {}; }
  updateUser(updates) {
    this._data.user = { ...this._data.user, ...updates };
    this._save();
    return this._data.user;
  }

  add(collection, data) {
    if (!Array.isArray(this._data[collection])) this._data[collection] = [];
    const item = { id: generateId(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._data[collection].unshift(item);
    this._save();
    this._emit(collection, "add", item);
    return item;
  }

  update(collection, id, updates) {
    if (!Array.isArray(this._data[collection])) return null;
    const index = this._data[collection].findIndex(item => item.id === id);
    if (index === -1) return null;
    const updated = { ...this._data[collection][index], ...updates, id, createdAt: this._data[collection][index].createdAt, updatedAt: new Date().toISOString() };
    this._data[collection][index] = updated;
    this._save();
    this._emit(collection, "update", updated);
    return updated;
  }

  delete(collection, id) {
    if (!Array.isArray(this._data[collection])) return false;
    const index = this._data[collection].findIndex(item => item.id === id);
    if (index === -1) return false;
    const [deleted] = this._data[collection].splice(index, 1);
    this._save();
    this._emit(collection, "delete", deleted);
    return true;
  }

  findById(collection, id) {
    if (!Array.isArray(this._data[collection])) return null;
    return this._data[collection].find(item => item.id === id) || null;
  }

  search(query) {
    if (!query || query.trim().length < 2) return [];
    const term = query.toLowerCase().trim();
    const results = [];
    const searchable = {
      notes: ["title", "content", "tags"],
      tasks: ["title", "description"],
      projects: ["name", "description"],
      goals: ["title", "description"],
      knowledge: ["title", "content", "tags"]
    };
    Object.entries(searchable).forEach(([collection, fields]) => {
      this.getCollection(collection).forEach(item => {
        const matched = fields.some(field => {
          const val = item[field];
          if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(term));
          return val && String(val).toLowerCase().includes(term);
        });
        if (matched) results.push({ ...item, _collection: collection });
      });
    });
    return results;
  }

  export() { return JSON.stringify(this._data, null, 2); }

  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this._data = { ...getDefaultData(), ...imported };
      this._save();
      this._emit("*", "import", null);
      return true;
    } catch (err) {
      console.error("[Storage] Import error:", err);
      return false;
    }
  }

  reset() {
    this._data = getDefaultData();
    this._save();
    this._emit("*", "reset", null);
  }

  getStats() {
    const raw = localStorage.getItem(STORAGE_KEY) || "";
    return {
      notes: (this._data.notes || []).length,
      tasks: (this._data.tasks || []).length,
      projects: (this._data.projects || []).length,
      goals: (this._data.goals || []).length,
      sizeKB: Math.round(raw.length / 1024 * 10) / 10
    };
  }
}

const storage = new StorageManager();
export default storage;
export { generateId };
