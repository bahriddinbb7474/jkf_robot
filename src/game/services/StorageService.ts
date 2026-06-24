export interface StorageService {
  load<T>(key: string, fallback: T): T;
  save<T>(key: string, value: T): void;
  remove(key: string): void;
}
