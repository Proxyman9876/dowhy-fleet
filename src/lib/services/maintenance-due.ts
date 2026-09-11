import type { MaintenanceStatus } from '@/types/enums';
import type { DueStatusResult } from '@/types/domain';

interface ScheduleIntervals {
  interval_miles: number | null;
  interval_hours: number | null;
  interval_days: number | null;
  due_soon_pct: number;
}

interface VehicleCurrent {
  current_mileage: number;
  current_hours: number;
}

interface LastPerformed {
  mileage: number | null;
  hours: number | null;
  date: string | null; // ISO date string
}

/**
 * Calculate whether a maintenance schedule is overdue, due_soon, or ok.
 *
 * For each non-null interval dimension (miles, hours, days):
 * 1. If never performed -> overdue
 * 2. next_due = last_done + interval
 * 3. remaining = next_due - current
 * 4. threshold = interval * (due_soon_pct / 100)
 * 5. remaining <= 0 -> overdue
 * 6. remaining <= threshold -> due_soon
 * 7. else -> ok
 *
 * Final status = worst across all dimensions.
 */
export function calculateDueStatus(
  schedule: ScheduleIntervals,
  vehicle: VehicleCurrent,
  lastDone: LastPerformed,
): DueStatusResult {
  const reasons: string[] = [];
  let worstStatus: MaintenanceStatus = 'ok';

  function escalate(status: MaintenanceStatus, reason: string) {
    reasons.push(reason);
    if (status === 'overdue') {
      worstStatus = 'overdue';
    } else if (status === 'due_soon' && worstStatus === 'ok') {
      worstStatus = 'due_soon';
    }
  }

  const pct = schedule.due_soon_pct / 100;

  // Check miles
  if (schedule.interval_miles != null) {
    if (lastDone.mileage == null) {
      escalate('overdue', 'Never performed (miles)');
    } else {
      const nextDue = lastDone.mileage + schedule.interval_miles;
      const remaining = nextDue - vehicle.current_mileage;
      const threshold = schedule.interval_miles * pct;

      if (remaining <= 0) {
        escalate('overdue', `Overdue by ${Math.abs(remaining).toLocaleString()} miles`);
      } else if (remaining <= threshold) {
        escalate('due_soon', `Due in ${remaining.toLocaleString()} miles`);
      }
    }
  }

  // Check hours
  if (schedule.interval_hours != null) {
    if (lastDone.hours == null) {
      escalate('overdue', 'Never performed (hours)');
    } else {
      const nextDue = lastDone.hours + schedule.interval_hours;
      const remaining = nextDue - vehicle.current_hours;
      const threshold = schedule.interval_hours * pct;

      if (remaining <= 0) {
        escalate('overdue', `Overdue by ${Math.abs(remaining).toFixed(1)} hours`);
      } else if (remaining <= threshold) {
        escalate('due_soon', `Due in ${remaining.toFixed(1)} hours`);
      }
    }
  }

  // Check days
  if (schedule.interval_days != null) {
    if (lastDone.date == null) {
      escalate('overdue', 'Never performed (date)');
    } else {
      const lastDate = new Date(lastDone.date);
      const now = new Date();
      const diffMs = now.getTime() - lastDate.getTime();
      const daysSince = diffMs / (1000 * 60 * 60 * 24);
      const remaining = schedule.interval_days - daysSince;
      const threshold = schedule.interval_days * pct;

      if (remaining <= 0) {
        escalate('overdue', `Overdue by ${Math.abs(Math.floor(remaining))} days`);
      } else if (remaining <= threshold) {
        escalate('due_soon', `Due in ${Math.floor(remaining)} days`);
      }
    }
  }

  return { status: worstStatus, reasons };
}
