const KEY = 'extrutech.pintura.prototype.v1';

export class LocalPinturaStore {
  constructor(seedFactory) { this.seedFactory = seedFactory; this.listeners = new Set(); }
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    const initial = this.seedFactory();
    this.save(initial);
    return initial;
  }
  save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    this.listeners.forEach(fn => fn(data));
  }
  reset() { localStorage.removeItem(KEY); return this.load(); }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
}
