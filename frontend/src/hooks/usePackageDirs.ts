import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { PackageDir, CreatePackageDir, UpdatePackageDir, PackageDirResolveResponse } from '../types';

export function usePackageDirs() {
  const [dirs, setDirs] = useState<PackageDir[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDirs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listPackageDirs();
      setDirs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch package directories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirs();
  }, [fetchDirs]);

  const createDir = async (data: CreatePackageDir) => {
    try {
      const newDir = await api.createPackageDir(data);
      setDirs((prev) => [newDir, ...prev]);
      return newDir;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create package directory');
    }
  };

  const updateDir = async (id: number, data: UpdatePackageDir) => {
    try {
      const updated = await api.updatePackageDir(id, data);
      setDirs((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update package directory');
    }
  };

  const deleteDir = async (id: number) => {
    try {
      await api.deletePackageDir(id);
      setDirs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete package directory');
    }
  };

  const resolveDir = async (specifier: string): Promise<PackageDirResolveResponse> => {
    try {
      const result = await api.resolvePackageDir(specifier);
      return result;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to resolve package directory');
    }
  };

  return {
    dirs,
    loading,
    error,
    refetch: fetchDirs,
    createDir,
    updateDir,
    deleteDir,
    resolveDir,
  };
}
