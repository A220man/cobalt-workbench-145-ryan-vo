import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PackageDirsPanel } from '../components/PackageDirsPanel';
import type { PackageDir, PackageDirResolveResponse } from '../types';

const mockDirs: PackageDir[] = [
  {
    id: 1,
    name: 'test-package',
    path: '/path/to/test-package',
    package_json: { name: 'test-package', version: '1.0.0', main: 'index.js' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: '@scope/scoped-package',
    path: '/path/to/scoped-package',
    package_json: { name: '@scope/scoped-package', version: '2.0.0' },
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockResolveResponse: PackageDirResolveResponse = {
  specifier: 'test-package',
  package_dir: mockDirs[0],
  resolved: true,
};

describe('PackageDirsPanel', () => {
  const mockOnCreate = vi.fn().mockResolvedValue(undefined);
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);
  const mockOnResolve = vi.fn().mockResolvedValue(mockResolveResponse);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders package directories list', () => {
    render(
      <PackageDirsPanel
        dirs={mockDirs}
        loading={false}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onResolve={mockOnResolve}
      />
    );

    expect(screen.getByText('test-package')).toBeInTheDocument();
    expect(screen.getByText('@scope/scoped-package')).toBeInTheDocument();
    expect(screen.getByText('Path: /path/to/test-package')).toBeInTheDocument();
    expect(screen.getByText('Path: /path/to/scoped-package')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <PackageDirsPanel
        dirs={[]}
        loading={true}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onResolve={mockOnResolve}
      />
    );

    // Loading state shows skeleton, not the panel content
    expect(screen.queryByText('Package Directories')).not.toBeInTheDocument();
    expect(screen.queryByText('Resolve Package Directory')).not.toBeInTheDocument();
  });

  it('shows empty state when no directories', () => {
    render(
      <PackageDirsPanel
        dirs={[]}
        loading={false}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onResolve={mockOnResolve}
      />
    );

    expect(screen.getByText('No package directories configured.')).toBeInTheDocument();
  });

  it('opens create form when clicking New Package Directory', () => {
    render(
      <PackageDirsPanel
        dirs={mockDirs}
        loading={false}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onResolve={mockOnResolve}
      />
    );

    fireEvent.click(screen.getByText('New Package Directory'));
    expect(screen.getByText('Create Package Directory')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Path')).toBeInTheDocument();
    expect(screen.getByLabelText('Package JSON (optional)')).toBeInTheDocument();
  });

  it('shows package JSON validation error for invalid JSON', () => {
    render(
      <PackageDirsPanel
        dirs={mockDirs}
        loading={false}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onResolve={mockOnResolve}
      />
    );

    fireEvent.click(screen.getByText('New Package Directory'));
    const jsonTextarea = screen.getByLabelText('Package JSON (optional)');
    fireEvent.change(jsonTextarea, { target: { value: '{ invalid json' } });
    // The validation shows the actual JSON parse error message in a p element with AlertCircle icon
    expect(screen.getByText(/Expected property name/)).toBeInTheDocument();
  });

  it('calls onCreate when submitting valid create form', async () => {
    render(
      <PackageDirsPanel
        dirs={mockDirs}
        loading={false}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onResolve={mockOnResolve}
      />
    );

    fireEvent.click(screen.getByText('New Package Directory'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'new-package' } });
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: '/path/to/new-package' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith('new-package', '/path/to/new-package', {});
    });
  });

  it('opens edit form when clicking edit button', () => {
    render(
      <PackageDirsPanel
        dirs={mockDirs}
        loading={false}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onResolve={mockOnResolve}
      />
    );

    fireEvent.click(screen.getAllByLabelText('Edit')[0]);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test-package')).toBeInTheDocument();
  });

  it('calls onUpdate when saving edit', async () => {
    render(
      <PackageDirsPanel
        dirs={mockDirs}
        loading={false}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onResolve={mockOnResolve}
      />
    );

    fireEvent.click(screen.getAllByLabelText('Edit')[0]);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'updated-name' } });
    fireEvent.click(screen.getByLabelText('Save'));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(1, 'updated-name', '/path/to/test-package', { name: 'test-package', version: '1.0.0', main: 'index.js' });
    });
  });

  it('calls onDelete when clicking delete button and confirming', async () => {
    // Mock confirm to return true
    const originalConfirm = globalThis.confirm;
    globalThis.confirm = vi.fn(() => true);

    render(
      <PackageDirsPanel
        dirs={mockDirs}
        loading={false}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onResolve={mockOnResolve}
      />
    );

    fireEvent.click(screen.getAllByLabelText('Delete')[0]);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });

    globalThis.confirm = originalConfirm;
  });

  it('shows resolve form and calls onResolve', async () => {
    render(
      <PackageDirsPanel
        dirs={mockDirs}
        loading={false}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onResolve={mockOnResolve}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('lodash, @scope/package, react'), { target: { value: 'test-package' } });
    fireEvent.click(screen.getByText('Resolve'));

    await waitFor(() => {
      expect(mockOnResolve).toHaveBeenCalledWith('test-package');
    });

    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByText('Path:')).toBeInTheDocument();
  });

  it('shows not resolved state when package not found', async () => {
    mockOnResolve.mockResolvedValueOnce({
      specifier: 'nonexistent',
      package_dir: null,
      resolved: false,
    });

    render(
      <PackageDirsPanel
        dirs={mockDirs}
        loading={false}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onResolve={mockOnResolve}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('lodash, @scope/package, react'), { target: { value: 'nonexistent' } });
    fireEvent.click(screen.getByText('Resolve'));

    await waitFor(() => {
      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });
  });
});
