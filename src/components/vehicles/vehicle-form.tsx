'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Vehicle } from '@/types/database';
import { VEHICLE_STATUSES } from '@/types/enums';

interface VehicleFormProps {
  vehicle?: Vehicle;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function VehicleForm({ vehicle, action }: VehicleFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="vin" name="vin" label="VIN" required defaultValue={vehicle?.vin} />
        <Input
          id="unit_number"
          name="unit_number"
          label="Unit Number"
          placeholder="e.g. TOW-01"
          defaultValue={vehicle?.unit_number ?? ''}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          id="year"
          name="year"
          label="Year"
          type="number"
          required
          defaultValue={vehicle?.year ?? new Date().getFullYear()}
        />
        <Input id="make" name="make" label="Make" required defaultValue={vehicle?.make} />
        <Input id="model" name="model" label="Model" required defaultValue={vehicle?.model} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="license_plate"
          name="license_plate"
          label="License Plate"
          defaultValue={vehicle?.license_plate ?? ''}
        />
        <Input
          id="oil_type"
          name="oil_type"
          label="Oil Type"
          placeholder="e.g. 5W-30 Synthetic"
          defaultValue={vehicle?.oil_type ?? ''}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="current_mileage"
          name="current_mileage"
          label="Current Mileage"
          type="number"
          defaultValue={vehicle?.current_mileage ?? 0}
        />
        <Input
          id="current_hours"
          name="current_hours"
          label="Current Hours"
          type="number"
          step="0.1"
          defaultValue={vehicle?.current_hours ?? 0}
        />
      </div>

      {vehicle && (
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={vehicle.status}
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                       focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={vehicle?.notes ?? ''}
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                     focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} size="lg">
          {pending ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
      </div>
    </form>
  );
}
