/**
 * Utility Functions
 * Second Brain App v1.0.0
 */

export function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return "همین الان";
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} روز پیش`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} ماه پیش`;
  return `${Math.floor(diff / 31536000)} سال پیش`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  try { return new Date(dateStr).toLocaleDateString("fa-IR"); } catch { return dateStr; }
}

export function toISODate(dateStr) {
  if (!dateStr) return "";
  try { return new Date(dateStr).toISOString().split("T")[0]; } catch { return ""; }
}

export function truncate(text, maxLen = 50) {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trimEnd() + "...";
}

export function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); };
}

export function throttle(fn, limit = 250) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) { fn.apply(this, args); inThrottle = true; setTimeout(() => { inThrottle = false; }, limit); }
  };
}

export function parseTags(tagsStr = "") {
  return tagsStr.split(",").map(t => t.trim()).filter(Boolean);
}

export function formatTags(tags = []) { return tags.join(", "); }

export function downloadFile(content, filename, mimeType = "application/json") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function isNative() {
  return typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform();
}

export function isPWA() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function getPlatform() {
  if (isNative()) return "android";
  if (isPWA()) return "pwa";
  return "web";
}

export function randomColor() {
  const colors = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f59e0b","#10b981","#06b6d4","#3b82f6"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
