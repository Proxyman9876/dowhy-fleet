import { Badge } from '@/components/ui/badge';
import type { MaintenanceStatus } from '@/types/enums';

const statusConfig: Record<MaintenanceStatus, { variant: 'danger' | 'warning' | 'success' | 'default'; label: string }> = {
  overdue: { variant: 'danger', label: 'Overdue' },
  due_soon: { variant: 'warning', label: 'Due Soon' },
  ok: { variant: 'success', label: 'OK' },
  not_applicable: { variant: 'default', label: 'N/A' },
};

export function DueStatusBadge({ status }: { status: MaintenanceStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
