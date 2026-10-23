import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, ChevronDown } from 'lucide-react';
import type { ImportMap } from '../types';

interface ImportMapsPanelProps {
  maps: ImportMap[];
  loading: boolean;
  onCreate: (name: string, imports: Record<string, string>, scopes?: Record<string, Record<string, string>>) => Promise<void>;
  onUpdate: (id: number, imports: Record<string, string>, scopes?: Record<string, Record<string, string>>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function ImportMapsPanel({ maps, loading, onCreate, onUpdate, onDelete }: ImportMapsPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newMapName, setNewMapName] = useState('');
  const [newMapImports, setNewMapImports] = useState('{}');
  const [newMapScopes, setNewMapScopes] = useState('{}');
  const [editImports, setEditImports] = useState('{}');
  const [editScopes, setEditScopes] = useState('{}');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreate(
        newMapName,
        JSON.parse(newMapImports),
        newMapScopes.trim() ? JSON.parse(newMapScopes) : undefined
      );
      setShowCreate(false);
      setNewMapName('');
      setNewMapImports('{}');
      setNewMapScopes('{}');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create import map');
    }
  };

  const handleEdit = (map: ImportMap) => {
    setEditingId(map.id);
    setEditImports(JSON.stringify(map.imports, null, 2));
    setEditScopes(JSON.stringify(map.scopes || {}, null, 2));
  };

  const handleSaveEdit = async (id: number) => {
    try {
      await onUpdate(
        id,
        JSON.parse(editImports),
        editScopes.trim() ? JSON.parse(editScopes) : undefined
      );
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update import map');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this import map?')) {
      try {
        await onDelete(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete import map');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Import Maps</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Import Map
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-4">
          <h3 className="text-sm font-medium text-blue-900">Create Import Map</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="my-import-map"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imports (JSON)</label>
            <textarea
              value={newMapImports}
              onChange={(e) => setNewMapImports(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              rows={4}
              placeholder='{"lodash": "node_modules/lodash/lodash.js"}'
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scopes (JSON, optional)</label>
            <textarea
              value={newMapScopes}
              onChange={(e) => setNewMapScopes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              rows={3}
              placeholder='{"node_modules/lodash": {"fp": "node_modules/lodash/fp.js"}}'
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              Create
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {maps.length === 0 && !showCreate && (
        <div className="text-center py-8">
          <p className="text-gray-500">No import maps configured.</p>
          <p className="text-sm text-gray-400 mt-1">Create one to manage bare import specifier resolution.</p>
        </div>
      )}

      <div className="space-y-4">
        {maps.map((map) => (
          <div
            key={map.id}
            className={`border rounded-lg ${editingId === map.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-gray-900">{map.name}</h3>
                <span className="text-sm text-gray-500 font-mono">Updated: {new Date(map.updated_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {editingId === map.id ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(map.id)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(map)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(map.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingId === map.id ? (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imports</label>
                  <textarea
                    value={editImports}
                    onChange={(e) => setEditImports(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    rows={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scopes</label>
                  <textarea
                    value={editScopes}
                    onChange={(e) => setEditScopes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-gray-700">View Imports ({Object.keys(map.imports).length})</span>
                    <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" />
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-800 overflow-x-auto max-h-64">
                    {JSON.stringify(map.imports, null, 2)}
                  </pre>
                </details>
                {map.scopes && Object.keys(map.scopes).length > 0 && (
                  <details className="group mt-2">
                    <summary className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">View Scopes ({Object.keys(map.scopes).length})</span>
                      <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" />
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-800 overflow-x-auto max-h-64">
                      {JSON.stringify(map.scopes, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}