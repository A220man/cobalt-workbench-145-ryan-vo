import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../components/StatCard';
import { Database } from 'lucide-react';

describe('StatCard', () => {
  it('renders title, value, and icon', () => {
    render(<StatCard title="Test" value={42} icon={Database} color="bg-blue-500" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<StatCard title="Test" value={42} icon={Database} color="bg-blue-500" description="Test description" />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('formats large numbers with commas', () => {
    render(<StatCard title="Test" value={1234567} icon={Database} color="bg-blue-500" />);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });
});