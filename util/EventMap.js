class EventMap {
  constructor(limit = 200) {
    this.map = new Map();
    this.sizeLimit = limit;
  }

  setEventData(key, events) {
    const id = key.toString();
    if (this.map.get(id)) throw new Error(`key ${key} already exist`);
    this.map.set(id, events);
    while (this.map.size > this.sizeLimit) {
      this.map.delete(this.map.keys().next().value);
    }
  }

  getEventData(key) {
    return this.map.get(key);
  }
}

module.exports = EventMap;
