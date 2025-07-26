import { useState, useEffect, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface UseApiCacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  key?: string; // Custom cache key
}

export function useApiCache<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiCacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, key } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  const cacheKey = key || JSON.stringify(dependencies);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cached = cacheRef.current.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
          setData(cached.data);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const freshData = await fetchFn();
        
        // Cache the result
        cacheRef.current.set(cacheKey, {
          data: freshData,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl
        });

        setData(freshData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  const invalidateCache = () => {
    cacheRef.current.delete(cacheKey);
  };

  const refresh = async () => {
    invalidateCache();
    setLoading(true);
    try {
      const freshData = await fetchFn();
      cacheRef.current.set(cacheKey, {
        data: freshData,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      });
      setData(freshData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, invalidateCache, refresh };
} 