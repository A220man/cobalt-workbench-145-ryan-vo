import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { api } from '../api/client';
import type { ImportCacheEntry, ImportCacheStats, ImportMap } from '../types';

vi.mock('../api/client');

const mockCacheEntries: ImportCacheEntry[] = [
  {
    id: 1,
    specifier: 'lodash',
    cache_key: 'lodash@4.17.21',
    resolved_url: 'file:///node_modules/lodash/lodash.js',
    status: 'resolved',
    error_message: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    access_count: 5,
  },
  {
    id: 2,
    specifier: 'react',
    cache_key: 'react@18.2.0',
    resolved_url: 'file:///node_modules/react/index.js',
    status: 'failed',
    error_message: 'Module not found',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    access_count: 0,
  },
];

const mockStats: ImportCacheStats = { total: 2, resolved: 1, failed: 1, invalidated: 0 };

const mockImportMaps: ImportMap[] = [
  {
    id: 1,
    name: 'test-map',
    imports: { lodash: 'node_modules/lodash/lodash.js' },
    scopes: { 'node_modules/lodash': { fp: 'node_modules/lodash/fp.js' } },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

function renderDashboard() {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listCacheEntries).mockResolvedValue(mockCacheEntries);
    vi.mocked(api.getCacheStats).mockResolvedValue(mockStats);
    vi.mocked(api.listImportMaps).mockResolvedValue(mockImportMaps);
    vi.mocked(api.createImportMap).mockResolvedValue({
      id: 2,
      name: 'new-map',
      imports: { vue: 'node_modules/vue/dist/vue.js' },
      scopes: {},
      created_at: '',
      updated_at: '',
    });
  });

  it('renders dashboard title', () => {
    renderDashboard();
    expect(screen.getByText('Cobalt Workbench')).toBeInTheDocument();
  });

  it('displays cache stats cards', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Total Entries')).toBeInTheDocument();
      expect(screen.getByText('Resolved')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Invalidated')).toBeInTheDocument();
    });
  });

  it('shows cache entries in table', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('lodash')).toBeInTheDocument();
      expect(screen.getByText('react')).toBeInTheDocument();
    });
  });

  it('displays import maps panel', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Import Maps')).toBeInTheDocument();
      expect(screen.getByText('test-map')).toBeInTheDocument();
    });
  });

  it('can create new import map', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('New Import Map')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Import Map'));
    
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('my-import-map');
      fireEvent.change(nameInput, { target: { value: 'new-map' } });
    });

    const importsTextarea = screen.getByPlaceholderText('{"lodash": "node_modules/lodash/lodash.js"}');
    fireEvent.change(importsTextarea, { target: { value: '{"vue": "node_modules/vue/dist/vue.js"}' } });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(api.createImportMap).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state', () => {
    // Override mocks to never resolve
    vi.mocked(api.listCacheEntries).mockImplementation(() => new Promise(() => {}));
    vi.mocked(api.getCacheStats).mockImplementation(() => new Promise(() => {}));
    vi.mocked(api.listImportMaps).mockImplementation(() => new Promise(() => {}));

    renderDashboard();
    expect(screen.getByText('Total Entries')).toBeInTheDocument();
  });
});