'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { deleteVehicle } from '@/app/(authenticated)/vehicles/actions';

export function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    await deleteVehicle(vehicleId);
  }

  if (!confirming) {
    return (
      <Button variant="danger" size="sm" onClick={() => setConfirming(true)} className="w-full">
        Remove Vehicle
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        This will hide the vehicle from the fleet. Maintenance history is preserved.
      </p>
      <div className="flex gap-2">
        <Button variant="danger" size="sm" disabled={pending} onClick={handleDelete} className="flex-1">
          {pending ? 'Removing...' : 'Confirm'}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}
