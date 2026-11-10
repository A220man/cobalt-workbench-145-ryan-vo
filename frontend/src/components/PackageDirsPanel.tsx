import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X, ChevronDown, AlertCircle, CheckCircle, Search, Package } from 'lucide-react';
import type { PackageDir, PackageDirResolveResponse } from '../types';

interface PackageDirsPanelProps {
  dirs: PackageDir[];
  loading: boolean;
  onCreate: (name: string, path: string, package_json?: Record<string, any>) => Promise<void>;
  onUpdate: (id: number, name?: string, path?: string, package_json?: Record<string, any>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onResolve: (specifier: string) => Promise<PackageDirResolveResponse>;
}

export function PackageDirsPanel({ dirs = [], loading, onCreate, onUpdate, onDelete, onResolve }: PackageDirsPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resolveSpecifier, setResolveSpecifier] = useState('');
  const [resolveResult, setResolveResult] = useState<PackageDirResolveResponse | null>(null);
  const [newDirName, setNewDirName] = useState('');
  const [newDirPath, setNewDirPath] = useState('');
  const [newDirPackageJson, setNewDirPackageJson] = useState('{}');
  const [editName, setEditName] = useState('');
  const [editPath, setEditPath] = useState('');
  const [editPackageJson, setEditPackageJson] = useState('{}');

  const newPackageJsonValidation = useMemo(() => {
    try {
      const parsed = JSON.parse(newDirPackageJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { valid: false, error: 'package.json must be an object', parsed: null };
      }
      return { valid: true, error: null, parsed };
    } catch (e) {
      return { valid: false, error: e instanceof Error ? e.message : 'Invalid JSON', parsed: null };
    }
  }, [newDirPackageJson]);

  const editPackageJsonValidation = useMemo(() => {
    try {
      const parsed = JSON.parse(editPackageJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { valid: false, error: 'package.json must be an object', parsed: null };
      }
      return { valid: true, error: null, parsed };
    } catch (e) {
      return { valid: false, error: e instanceof Error ? e.message : 'Invalid JSON', parsed: null };
    }
  }, [editPackageJson]);

  const canCreate = newDirName.trim() && newDirPath.trim() && newPackageJsonValidation.valid;
  const canSaveEdit = editPackageJsonValidation.valid;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    try {
      await onCreate(
        newDirName,
        newDirPath,
        newPackageJsonValidation.parsed as Record<string, any>
      );
      setShowCreate(false);
      setNewDirName('');
      setNewDirPath('');
      setNewDirPackageJson('{}');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create package directory');
    }
  };

  const handleEdit = (dir: PackageDir) => {
    setEditingId(dir.id);
    setEditName(dir.name);
    setEditPath(dir.path);
    setEditPackageJson(JSON.stringify(dir.package_json || {}, null, 2));
  };

  const handleSaveEdit = async (id: number) => {
    if (!canSaveEdit) return;
    try {
      await onUpdate(
        id,
        editName || undefined,
        editPath || undefined,
        editPackageJsonValidation.parsed as Record<string, any>
      );
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update package directory');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this package directory?')) {
      try {
        await onDelete(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete package directory');
      }
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveSpecifier.trim()) return;
    try {
      const result = await onResolve(resolveSpecifier);
      setResolveResult(result);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resolve package directory');
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
        <h2 className="text-lg font-semibold text-gray-900">Package Directories</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Package Directory
        </button>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Package className="w-4 h-4" /> Resolve Package Directory
        </h3>
        <form onSubmit={handleResolve} className="flex gap-2">
          <input
            type="text"
            value={resolveSpecifier}
            onChange={(e) => setResolveSpecifier(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="lodash, @scope/package, react"
            required
          />
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            <Search className="w-4 h-4 mr-1" /> Resolve
          </button>
        </form>
        {resolveResult && (
          <div className={`mt-3 p-3 rounded text-sm ${resolveResult.resolved ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <strong>Specifier:</strong> {resolveResult.specifier}
            {resolveResult.resolved ? (
              <>
                <span className="ml-3 inline-flex items-center gap-1 px-2 py-1 bg-green-100 rounded text-xs">
                  <CheckCircle className="w-3 h-3" /> Resolved
                </span>
                <div className="mt-2 text-xs font-mono">
                  <strong>Name:</strong> {resolveResult.package_dir?.name} |{' '}
                  <strong>Path:</strong> {resolveResult.package_dir?.path}
                </div>
              </>
            ) : (
              <span className="ml-3 inline-flex items-center gap-1 px-2 py-1 bg-red-100 rounded text-xs">
                <AlertCircle className="w-3 h-3" /> Not Found
              </span>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-4">
          <h3 className="text-sm font-medium text-blue-900">Create Package Directory</h3>
          <div>
            <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              id="create-name"
              type="text"
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="lodash"
              required
            />
          </div>
          <div>
            <label htmlFor="create-path" className="block text-sm font-medium text-gray-700 mb-1">Path</label>
            <input
              id="create-path"
              type="text"
              value={newDirPath}
              onChange={(e) => setNewDirPath(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="/path/to/lodash"
              required
            />
          </div>
          <div>
            <label htmlFor="create-package-json" className="block text-sm font-medium text-gray-700 mb-1">Package JSON (optional)</label>
            <textarea
              id="create-package-json"
              value={newDirPackageJson}
              onChange={(e) => setNewDirPackageJson(e.target.value)}
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono ${!newPackageJsonValidation.valid ? 'border-red-300' : 'border-gray-300'}`}
              rows={4}
              placeholder='{"name": "lodash", "version": "4.17.21", "main": "lodash.js"}'
            />
            {!newPackageJsonValidation.valid && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {newPackageJsonValidation.error}
              </p>
            )}
            {newPackageJsonValidation.valid && newDirPackageJson.trim() && newDirPackageJson.trim() !== '{}' && (
              <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Valid JSON
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={!canCreate} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Create
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {dirs.length === 0 && !showCreate && (
        <div className="text-center py-8">
          <p className="text-gray-500">No package directories configured.</p>
          <p className="text-sm text-gray-400 mt-1">Create one to manage package root directory resolution.</p>
        </div>
      )}

      <div className="space-y-4">
        {dirs.map((dir) => (
          <div
            key={dir.id}
            className={`border rounded-lg ${editingId === dir.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-gray-900">{dir.name}</h3>
                <span className="text-sm text-gray-500 font-mono">Path: {dir.path}</span>
                <span className="text-sm text-gray-500 font-mono">Updated: {new Date(dir.updated_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {editingId === dir.id ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(dir.id)}
                      disabled={!canSaveEdit}
                      className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save"
                      aria-label="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Cancel"
                      aria-label="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(dir)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Edit"
                      aria-label="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dir.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingId === dir.id ? (
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor={`edit-name-${dir.id}`} className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    id={`edit-name-${dir.id}`}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`edit-path-${dir.id}`} className="block text-sm font-medium text-gray-700 mb-1">Path</label>
                  <input
                    id={`edit-path-${dir.id}`}
                    type="text"
                    value={editPath}
                    onChange={(e) => setEditPath(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`edit-package-json-${dir.id}`} className="block text-sm font-medium text-gray-700 mb-1">Package JSON</label>
                  <textarea
                    id={`edit-package-json-${dir.id}`}
                    value={editPackageJson}
                    onChange={(e) => setEditPackageJson(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono ${!editPackageJsonValidation.valid ? 'border-red-300' : 'border-gray-300'}`}
                    rows={5}
                  />
                  {!editPackageJsonValidation.valid && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {editPackageJsonValidation.error}
                    </p>
                  )}
                  {editPackageJsonValidation.valid && editPackageJson.trim() && editPackageJson.trim() !== '{}' && (
                    <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Valid JSON
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4">
                {dir.package_json && Object.keys(dir.package_json).length > 0 && (
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">Package JSON</span>
                      <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" />
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-800 overflow-x-auto max-h-64">
                      {JSON.stringify(dir.package_json, null, 2)}
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
