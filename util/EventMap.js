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
      const dropKey = this.map.keys().next().value;
      console.log(`EventMap: dropping ${dropKey}`);
      this.map.delete(dropKey);
    }
  }

  getEventData(key) {
    return this.map.get(key.toString());
  }
}

module.exports = EventMap;
