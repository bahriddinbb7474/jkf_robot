import type { StorageService } from './StorageService';

export class LocalStorageService implements StorageService {
  load<T>(key: string, fallback: T): T {
    const rawValue = localStorage.getItem(key);

    if (rawValue === null) {
      return fallback;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return fallback;
    }
  }

  save<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}
