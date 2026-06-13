export default class KeyedMutex {
  private readonly queues = new Map<string, Promise<void>>();

  async runExclusive<T>(key: string, callback: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(key) ?? Promise.resolve();

    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    const next = previous.then(() => current, () => current);
    this.queues.set(key, next);

    await previous.catch(() => undefined);

    try {
      return await callback();
    } finally {
      release();
      if (this.queues.get(key) === next) {
        this.queues.delete(key);
      }
    }
  }
}
