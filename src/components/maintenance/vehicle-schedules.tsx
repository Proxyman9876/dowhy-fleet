'use client';

import { useState } from 'react';
import { DueStatusBadge } from './due-status-badge';
import { Button } from '@/components/ui/button';
import { assignScheduleToVehicle } from '@/app/(authenticated)/settings/schedules/actions';
import { formatMileage, formatDate } from '@/lib/utils/format';
import type { VehicleScheduleDetail } from '@/types/domain';
import type { MaintenanceSchedule } from '@/types/database';

interface VehicleSchedulesProps {
  vehicleId: string;
  schedules: VehicleScheduleDetail[];
  allSchedules: MaintenanceSchedule[];
}

export function VehicleSchedules({ vehicleId, schedules, allSchedules }: VehicleSchedulesProps) {
  const [assigning, setAssigning] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [pending, setPending] = useState(false);

  const assignedIds = new Set(schedules.map((s) => s.schedule_id));
  const unassigned = allSchedules.filter((s) => !assignedIds.has(s.id));

  async function handleAssign() {
    if (!selectedSchedule) return;
    setPending(true);
    const formData = new FormData();
    formData.set('vehicle_id', vehicleId);
    formData.set('schedule_id', selectedSchedule);
    await assignScheduleToVehicle(formData);
    setPending(false);
    setAssigning(false);
    setSelectedSchedule('');
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Maintenance Schedules</h2>
        {unassigned.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setAssigning(!assigning)}>
            {assigning ? 'Cancel' : '+ Assign'}
          </Button>
        )}
      </div>

      {assigning && (
        <div className="mb-3 flex gap-2">
          <select
            value={selectedSchedule}
            onChange={(e) => setSelectedSchedule(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select schedule...</option>
            {unassigned.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Button size="sm" disabled={!selectedSchedule || pending} onClick={handleAssign}>
            {pending ? '...' : 'Assign'}
          </Button>
        </div>
      )}

      {schedules.length === 0 ? (
        <p className="text-sm text-gray-500">No schedules assigned.</p>
      ) : (
        <ul className="space-y-2">
          {schedules.map((vms) => (
            <li key={vms.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{vms.schedule.name}</span>
                  <DueStatusBadge status={vms.cached_status} />
                </div>
                <p className="text-xs text-gray-500">
                  {vms.next_due_mileage && `Next: ${formatMileage(vms.next_due_mileage)}`}
                  {vms.next_due_mileage && vms.next_due_date && ' · '}
                  {vms.next_due_date && `By: ${formatDate(vms.next_due_date)}`}
                  {!vms.next_due_mileage && !vms.next_due_date && 'Not yet performed'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
