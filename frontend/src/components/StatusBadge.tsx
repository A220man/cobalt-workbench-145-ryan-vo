interface StatusBadgeProps {
  status: 'resolved' | 'failed' | 'invalidated';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    resolved: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    invalidated: 'bg-gray-100 text-gray-800',
  };

  const labels = {
    resolved: 'Resolved',
    failed: 'Failed',
    invalidated: 'Invalidated',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}