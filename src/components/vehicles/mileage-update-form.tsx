'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateMileage } from '@/app/(authenticated)/vehicles/actions';

interface MileageUpdateFormProps {
  vehicleId: string;
  currentMileage: number;
  currentHours: number;
}

export function MileageUpdateForm({ vehicleId, currentMileage, currentHours }: MileageUpdateFormProps) {
  const [mileage, setMileage] = useState(currentMileage.toString());
  const [hours, setHours] = useState(currentHours.toString());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setPending(true);

    const formData = new FormData();
    formData.set('vehicle_id', vehicleId);
    formData.set('mileage', mileage);
    if (hours) formData.set('hours', hours);

    const result = await updateMileage(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900">Quick Mileage Update</h3>

      {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 p-2 text-sm text-green-700">Updated!</div>}

      <div className="flex gap-3">
        <Input
          id="mileage"
          label="Mileage"
          type="number"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
        />
        <Input
          id="hours"
          label="Hours"
          type="number"
          step="0.1"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? 'Updating...' : 'Update Mileage'}
      </Button>
    </form>
  );
}
