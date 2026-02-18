/**
 * Simple in-memory cache for ABI and transaction data
 * 
 * TODO: Replace with Redis or other persistent cache in production
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 24 * 60 * 60 * 1000) {
    // Default: 24 hours
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Cache instances
export const abiCache = new SimpleCache<any[]>(30 * 24 * 60 * 60 * 1000); // 30 days for ABI
export const txDataCache = new SimpleCache<any>(24 * 60 * 60 * 1000); // 24 hours for tx data
export const sourceCodeCache = new SimpleCache<string>(30 * 24 * 60 * 60 * 1000); // 30 days for source code
