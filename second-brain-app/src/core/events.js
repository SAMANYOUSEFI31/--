/**
 * Event Bus
 * Second Brain App v1.0.0
 */
class EventBus {
  constructor() { this._handlers = new Map(); }

  on(event, handler) {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event).add(handler);
    return () => this.off(event, handler);
  }

  once(event, handler) {
    const wrapper = (...args) => { handler(...args); this.off(event, wrapper); };
    return this.on(event, wrapper);
  }

  off(event, handler) {
    if (this._handlers.has(event)) this._handlers.get(event).delete(handler);
  }

  emit(event, data) {
    if (this._handlers.has(event)) {
      this._handlers.get(event).forEach(handler => {
        try { handler(data); } catch (err) { console.error(`[EventBus] Error in "${event}":`, err); }
      });
    }
  }

  clear(event) {
    if (event) this._handlers.delete(event);
    else this._handlers.clear();
  }
}

const bus = new EventBus();

export const EVENTS = {
  PAGE_CHANGE: "page:change", SIDEBAR_TOGGLE: "sidebar:toggle",
  MODAL_OPEN: "modal:open", MODAL_CLOSE: "modal:close",
  NOTE_CREATED: "note:created", NOTE_UPDATED: "note:updated", NOTE_DELETED: "note:deleted",
  TASK_CREATED: "task:created", TASK_UPDATED: "task:updated", TASK_DELETED: "task:deleted", TASK_TOGGLED: "task:toggled",
  PROJECT_CREATED: "project:created", PROJECT_UPDATED: "project:updated", PROJECT_DELETED: "project:deleted",
  GOAL_CREATED: "goal:created", GOAL_UPDATED: "goal:updated", GOAL_DELETED: "goal:deleted",
  THEME_CHANGED: "theme:changed", SEARCH_QUERY: "search:query",
  NOTIFICATION_SHOW: "notification:show", DATA_REFRESHED: "data:refreshed",
  DATA_EXPORTED: "data:exported", DATA_IMPORTED: "data:imported"
};

export default bus;
