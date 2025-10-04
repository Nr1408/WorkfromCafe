// Simple event bus for in-app broadcast (no external dep)
const listeners = {};
export function on(event, cb) {
  listeners[event] = listeners[event] || new Set();
  listeners[event].add(cb);
  return () => off(event, cb);
}
export function off(event, cb) {
  if (listeners[event]) listeners[event].delete(cb);
}
export function emit(event, payload) {
  if (listeners[event]) {
    [...listeners[event]].forEach(fn => {
      try { fn(payload); } catch (_) {}
    });
  }
}
