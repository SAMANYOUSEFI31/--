/**
 * Client-Side Router - Hash-based
 * Second Brain App v1.0.0
 */
class Router {
  constructor() {
    this._routes = new Map();
    this._listeners = new Set();
    this._currentRoute = null;
    this._previousRoute = null;
    this._notFoundHandler = null;
    window.addEventListener("hashchange", () => this._handleChange());
  }

  on(path, handler, meta = {}) {
    this._routes.set(path, { handler, meta, path });
    return this;
  }

  notFound(handler) { this._notFoundHandler = handler; return this; }

  onChange(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  navigate(path, replace = false) {
    if (replace) window.history.replaceState(null, "", `#${path}`);
    else window.location.hash = path;
    this._handleChange();
  }

  getCurrentPath() {
    const hash = window.location.hash;
    return hash ? hash.slice(1) : "/";
  }

  _handleChange() {
    const path = this.getCurrentPath();
    const route = this._matchRoute(path);
    if (!route) { this._notFoundHandler?.(path); return; }
    this._previousRoute = this._currentRoute;
    this._currentRoute = route;
    route.handler(route);
    this._listeners.forEach(cb => cb(route, this._previousRoute));
  }

  _matchRoute(path) {
    if (this._routes.has(path)) return { ...this._routes.get(path), params: {}, query: this._parseQuery() };
    for (const [pattern, routeData] of this._routes) {
      const result = this._matchPattern(pattern, path);
      if (result) return { ...routeData, params: result, query: this._parseQuery() };
    }
    return null;
  }

  _matchPattern(pattern, path) {
    const pp = pattern.split("/"), pathP = path.split("/");
    if (pp.length !== pathP.length) return null;
    const params = {};
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(":")) params[pp[i].slice(1)] = pathP[i];
      else if (pp[i] !== pathP[i]) return null;
    }
    return params;
  }

  _parseQuery() {
    const search = window.location.search;
    return search ? Object.fromEntries(new URLSearchParams(search)) : {};
  }

  start(defaultPath = "/") {
    const path = this.getCurrentPath();
    if (path === "/" || path === "") this.navigate(defaultPath, true);
    else this._handleChange();
  }

  get current() { return this._currentRoute; }
  get previous() { return this._previousRoute; }
}

const router = new Router();
export default router;
