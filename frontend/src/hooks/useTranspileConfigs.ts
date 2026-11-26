import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { TsTranspileConfig, CreateTsTranspileConfig, UpdateTsTranspileConfig } from '../types';

export function useTranspileConfigs() {
  const [configs, setConfigs] = useState<TsTranspileConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listTranspileConfigs();
      setConfigs(result);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load transpile configs');
    } finally {
      setLoading(false);
    }
  };

  const createConfig = async (data: CreateTsTranspileConfig) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.createTranspileConfig(data);
      setConfigs(prev => [result, ...prev]);
      return result;
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to create transpile config');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (id: number, data: UpdateTsTranspileConfig) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.updateTranspileConfig(id, data);
      setConfigs(prev => prev.map(c => c.id === id ? result : c));
      return result;
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to update transpile config');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteConfig = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteTranspileConfig(id);
      setConfigs(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to delete transpile config');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  return {
    configs,
    loading,
    error,
    reloadConfigs: loadConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
  };
}
