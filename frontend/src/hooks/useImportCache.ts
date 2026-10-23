import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { ImportCacheEntry, ImportCacheStats } from '../types';

export function useImportCache(params?: { specifier?: string; status?: string }) {
  const [entries, setEntries] = useState<ImportCacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listCacheEntries(params);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache entries');
    } finally {
      setLoading(false);
    }
  }, [params?.specifier, params?.status]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const invalidateEntry = async (id: number) => {
    try {
      await api.invalidateCacheEntry(id);
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'invalidated' as const } : e)));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to invalidate entry');
    }
  };

  const invalidateBySpecifier = async (specifier: string) => {
    try {
      await api.invalidateBySpecifier(specifier);
      await fetchEntries();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to invalidate by specifier');
    }
  };

  const invalidateAll = async () => {
    try {
      await api.invalidateAll();
      await fetchEntries();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to invalidate all');
    }
  };

  return {
    entries,
    loading,
    error,
    refetch: fetchEntries,
    invalidateEntry,
    invalidateBySpecifier,
    invalidateAll,
  };
}

export function useImportCacheStats() {
  const [stats, setStats] = useState<ImportCacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCacheStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}