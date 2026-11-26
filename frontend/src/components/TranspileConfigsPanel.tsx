import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X, ChevronDown, Search, Code } from 'lucide-react';
import type { TsTranspileConfig, CreateTsTranspileConfig, UpdateTsTranspileConfig } from '../types';

interface TranspileConfigsPanelProps {
  configs: TsTranspileConfig[];
  loading: boolean;
  onCreate: (pattern: string, enabled?: boolean, config_data?: Record<string, any>) => Promise<void>;
  onUpdate: (id: number, pattern?: string, enabled?: boolean, config_data?: Record<string, any>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

interface FormErrors {
  package_pattern?: string;
  enabled?: string;
}

export function TranspileConfigsPanel({
  configs = [],
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: TranspileConfigsPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPattern, setEditingPattern] = useState('');
  const [editingEnabled, setEditingEnabled] = useState(true);
  const [editingConfigData, setEditingConfigData] = useState('{}');
  const [newPattern, setNewPattern] = useState('');
  const [newEnabled, setNewEnabled] = useState(true);
  const [newConfigData, setNewConfigData] = useState('{}');
  const [errors, setErrors] = useState<FormErrors>({});

  const newPatternValidation = useMemo(() => {
    const valid = newPattern.trim().length > 0;
    return { valid, error: valid ? undefined : 'Package pattern is required' };
  }, [newPattern]);

  const editPatternValidation = useMemo(() => {
    const valid = editingPattern.trim().length > 0;
    return { valid, error: valid ? undefined : 'Package pattern is required' };
  }, [editingPattern]);

  const canCreate = newPatternValidation.valid;
  const canSaveEdit = editPatternValidation.valid;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setErrors({});
    await onCreate(newPattern, newEnabled, JSON.parse(newConfigData || '{}'));
    setShowCreate(false);
    setNewPattern('');
    setNewEnabled(true);
    setNewConfigData('{}');
  };

  const handleEdit = (config: TsTranspileConfig) => {
    setEditingId(config.id);
    setEditingPattern(config.package_pattern);
    setEditingEnabled(config.enabled);
    setEditingConfigData(JSON.stringify(config.config_data || {}));
    setErrors({});
  };

  const handleSaveEdit = async (id: number) => {
    if (!canSaveEdit) return;
    setErrors({});
    await onUpdate(id, editingPattern, editingEnabled, JSON.parse(editingConfigData || '{}'));
    setEditingId(null);
    setEditingPattern('');
    setEditingEnabled(true);
    setEditingConfigData('{}');
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this transpile config?')) {
      await onDelete(id);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">TypeScript Transpile Configs</h2>
        <button
          onClick={e => setShowCreate(true)}
          className="inline-flex items-center px-3 py-1.5 border border-primary-600 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100"
        >
          <Plus className="mr-1 h-4 w-4" /> Create Config
        </button>
      </header>

      {configs.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No transpile configs configured. Add one to enable TypeScript transpilation for node_modules.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full rounded-md">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left align-middle px-6 py-3 text-xs font-medium text-gray-500">Package Pattern</th>
              <th className="text-left align-middle px-6 py-3 text-xs font-medium text-gray-500">Enabled</th>
              <th className="text-left align-middle px-6 py-3 text-xs font-medium text-gray-500">Config Data</th>
              <th className="text-left align-middle px-6 py-3 text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs.map(config => (
              <tr key={config.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="align-middle px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{config.package_pattern}</div>
                  <div className="text-xs text-gray-500">{config.enabled ? 'enabled' : 'disabled'}</div>
                </td>
                <td className="align-middle px-6 py-4 whitespace-nowrap">
                  <span className={config.enabled
                    ? "inline-flex items-center px-2 rounded bg-green-100 text-green-800 text-xs font-medium"
                    : "inline-flex items-center px-2 rounded bg-red-100 text-red-800 text-xs font-medium"
                  }>
                    {config.enabled ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="align-middle px-6 py-4 whitespace-nowrap">
                  <Code className="mr-1 h-4 w-4" /> {JSON.stringify(config.config_data || {}, null, 2).substring(0, 50)}{config.config_data ? '…' : ' (none)'}
                </td>
                <td className="align-middle px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(config)}
                    className="underline text-primary-600 hover:text-primary-500 mr-3"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="underline text-red-600 hover:text-red-500"
                    title="Delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate || editingId && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-base font-medium text-gray-900 mb-4">
            {editingId ? 'Edit Config' : 'Create Config'}
          </h3>
          <form onSubmit={editingId ? handleSaveEdit : handleCreate} className="space-y-4">
            <div>
              <label htmlFor="package-pattern" className="block text-sm font-medium text-gray-700 mb-1">
                Package Pattern <span className="text-red-500">*</span>
              </label>
              <input
                id="package-pattern"
                type="text"
                value={editingId ? editingPattern : newPattern}
                onChange={e => {
                  if (editingId) setEditingPattern(e.target.value);
                  else setNewPattern(e.target.value);
                  if (editingId) {
                    setErrors({});
                  } else {
                    setErrors({ package_pattern: newPatternValidation.error });
                  }
                }}
                required
                className={`rounded border border-gray-300 w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${editingId ? '' : newPatternValidation.valid ? 'bg-white' : 'bg-red-50'}`}
                placeholder="e.g. *.ts, *.js"
              />
              {editingId ? '' : (
                <p className="mt-1 text-xs text-red-500">{newPatternValidation.error}</p>
              )}
            </div>

            <div>
              <label htmlFor="enabled" className="block text-sm font-medium text-gray-700 mb-1">
                Enabled
              </label>
              <div className="flex items-center space-x-2">
                <label
                  className={`inline-flex items-center px-3 py-1.5 rounded border ${newEnabled ? 'border-primary-500 text-primary-600' : 'border-gray-300 text-gray-500'} focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  onClick={() => setNewEnabled(!newEnabled)}
                >
                  <input
                    type="checkbox"
                    checked={newEnabled}
                    onChange={e => setNewEnabled(e.target.checked)}
                    className="rounded border-pointer cursor-pointer"
                  />
                  <span>{newEnabled ? 'Yes' : 'No'}</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="config-data" className="block text-sm font-medium text-gray-700 mb-1">
                Config Data
              </label>
              <textarea
                id="config-data"
                rows={3}
                value={editingId ? editingConfigData : newConfigData}
                onChange={e => {
                  if (editingId) setEditingConfigData(e.target.value);
                  else setNewConfigData(e.target.value);
                }}
                className={`rounded border border-gray-300 w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y ${editingId ? '' : ''}`}
                placeholder='{"compilerOptions": {}}'
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="submit"
                disabled={!canCreate && !!editingId ? !editPatternValidation.valid : !canCreate}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md bg-primary-600 text-white font-medium text-sm hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setEditingPattern('');
                  setEditingEnabled(true);
                  setEditingConfigData('{}');
                  setErrors({});
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-medium text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
