import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders resolved status with correct styling', () => {
    render(<StatusBadge status="resolved" />);
    const badge = screen.getByText('Resolved');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders failed status with correct styling', () => {
    render(<StatusBadge status="failed" />);
    const badge = screen.getByText('Failed');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renders invalidated status with correct styling', () => {
    render(<StatusBadge status="invalidated" />);
    const badge = screen.getByText('Invalidated');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });
});