type CacheFactory<T> = () => Promise<T>;

interface CacheEntry<T> {
  expiresAt: number;
  promise?: Promise<T>;
  value?: T;
}

const registeredCaches = new Set<{ clear: () => void }>();

export class ClientCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {
    registeredCaches.add(this);
  }

  async get(key: string, factory: CacheFactory<T>) {
    const now = Date.now();
    const existingEntry = this.entries.get(key);

    if (existingEntry?.value !== undefined && existingEntry.expiresAt > now) {
      return existingEntry.value;
    }

    if (existingEntry?.promise) {
      return existingEntry.promise;
    }

    const promise = factory()
      .then((value) => {
        this.entries.set(key, {
          value,
          expiresAt: Date.now() + this.ttlMs,
        });

        return value;
      })
      .catch((error) => {
        this.entries.delete(key);
        throw error;
      });

    this.entries.set(key, {
      promise,
      expiresAt: now + this.ttlMs,
    });

    return promise;
  }

  delete(key: string) {
    this.entries.delete(key);
  }

  clear() {
    this.entries.clear();
  }
}

export function createCacheKey(value: unknown) {
  return JSON.stringify(sortObjectKeys(value));
}

export function clearAllClientCaches() {
  registeredCaches.forEach((cache) => cache.clear());
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
}
