import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { ImportMap, CreateImportMap, UpdateImportMap } from '../types';

export function useImportMaps() {
  const [maps, setMaps] = useState<ImportMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listImportMaps();
      setMaps(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch import maps');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  const createMap = async (data: CreateImportMap) => {
    try {
      const newMap = await api.createImportMap(data);
      setMaps((prev) => [newMap, ...prev]);
      return newMap;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create import map');
    }
  };

  const updateMap = async (id: number, data: UpdateImportMap) => {
    try {
      const updated = await api.updateImportMap(id, data);
      setMaps((prev) => prev.map((m) => (m.id === id ? updated : m)));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update import map');
    }
  };

  const deleteMap = async (id: number) => {
    try {
      await api.deleteImportMap(id);
      setMaps((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete import map');
    }
  };

  return {
    maps,
    loading,
    error,
    refetch: fetchMaps,
    createMap,
    updateMap,
    deleteMap,
  };
}