import { LayoutDashboard, Database, Trash2, AlertTriangle } from 'lucide-react';
import { useImportCache, useImportCacheStats } from '../hooks/useImportCache';
import { useImportMaps } from '../hooks/useImportMaps';
import { CacheEntryTable } from './CacheEntryTable';
import { ImportMapsPanel } from './ImportMapsPanel';
import { StatCard } from './StatCard';

export function Dashboard() {
  const { entries, loading: entriesLoading, error: entriesError, refetch: refetchEntries, invalidateEntry, invalidateAll } =
    useImportCache();
  const { stats, error: statsError, refetch: refetchStats } = useImportCacheStats();
  const { maps, loading: mapsLoading, refetch: refetchMaps, createMap, updateMap, deleteMap } = useImportMaps();

  const handleInvalidateAll = async () => {
    if (confirm('Invalidate ALL cache entries? This cannot be undone.')) {
      await invalidateAll();
      refetchEntries();
      refetchStats();
    }
  };

  const handleCreateMap = async (name: string, imports: Record<string, string>, scopes?: Record<string, Record<string, string>>) => {
    await createMap({ name, imports, scopes });
    refetchMaps();
  };

  const handleUpdateMap = async (id: number, imports: Record<string, string>, scopes?: Record<string, Record<string, string>>) => {
    await updateMap(id, { imports, scopes });
    refetchMaps();
  };

  const handleDeleteMap = async (id: number) => {
    await deleteMap(id);
    refetchMaps();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cobalt Workbench</h1>
              <p className="text-sm text-gray-500 mt-1">Node.js ESM Developer Tooling | Ryan Vo | AI & Machine Learning</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { refetchEntries(); refetchStats(); refetchMaps(); }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh All
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(entriesError || statsError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            Error: {entriesError || statsError}
            <button onClick={() => { refetchEntries(); refetchStats(); }} className="ml-4 underline">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Entries"
            value={stats?.total || 0}
            icon={Database}
            color="bg-blue-500"
            description="All cache entries"
          />
          <StatCard
            title="Resolved"
            value={stats?.resolved || 0}
            icon={LayoutDashboard}
            color="bg-green-500"
            description="Successfully resolved"
          />
          <StatCard
            title="Failed"
            value={stats?.failed || 0}
            icon={AlertTriangle}
            color="bg-red-500"
            description="Resolution failed"
          />
          <StatCard
            title="Invalidated"
            value={stats?.invalidated || 0}
            icon={Trash2}
            color="bg-gray-500"
            description="Manually invalidated"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Import Cache Entries</h2>
                <button
                  onClick={handleInvalidateAll}
                  disabled={entries.length === 0}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Invalidate All
                </button>
              </div>
              <div className="p-4">
                <CacheEntryTable
                  entries={entries}
                  loading={entriesLoading}
                  onInvalidate={invalidateEntry}
                />
              </div>
            </div>
          </div>

          <div>
            <ImportMapsPanel
              maps={maps}
              loading={mapsLoading}
              onCreate={handleCreateMap}
              onUpdate={handleUpdateMap}
              onDelete={handleDeleteMap}
            />
          </div>
        </div>
      </main>
    </div>
  );
}