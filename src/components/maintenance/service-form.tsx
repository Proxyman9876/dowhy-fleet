'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Vehicle } from '@/types/database';
import type { MaintenanceSchedule } from '@/types/database';
import type { PartWithInventory } from '@/types/domain';

interface ServiceFormProps {
  vehicle: Vehicle;
  schedules: MaintenanceSchedule[];
  parts: PartWithInventory[];
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean; redirectTo?: string } | void>;
}

interface PartUsed {
  part_id: string;
  name: string;
  quantity_used: number;
}

export function ServiceForm({ vehicle, schedules, parts, action }: ServiceFormProps) {
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [selectedPart, setSelectedPart] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set('parts_used', JSON.stringify(
        partsUsed.map((p) => ({ part_id: p.part_id, quantity_used: p.quantity_used })),
      ));
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.redirectTo) {
        router.push(result.redirectTo);
      } else {
        router.push(`/vehicles/${vehicle.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(false);
    }
  }

  function addPart() {
    if (!selectedPart) return;
    const part = parts.find((p) => p.id === selectedPart);
    if (!part) return;
    if (partsUsed.some((p) => p.part_id === selectedPart)) return;

    setPartsUsed([...partsUsed, {
      part_id: part.id,
      name: `${part.part_number} — ${part.name}`,
      quantity_used: Number(partQty) || 1,
    }]);
    setSelectedPart('');
    setPartQty('1');
  }

  function removePart(partId: string) {
    setPartsUsed(partsUsed.filter((p) => p.part_id !== partId));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <input type="hidden" name="vehicle_id" value={vehicle.id} />

      {/* Schedule Type */}
      <div>
        <label htmlFor="schedule_id" className="mb-1 block text-sm font-medium text-gray-700">
          Service Type
        </label>
        <select
          id="schedule_id"
          name="schedule_id"
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                     focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Unscheduled / Other</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={2}
          placeholder="What was done?"
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                     focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Mileage & Hours */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="mileage_at"
          name="mileage_at"
          label="Mileage at Service *"
          type="number"
          required
          defaultValue={vehicle.current_mileage}
        />
        <Input
          id="hours_at"
          name="hours_at"
          label="Hours at Service"
          type="number"
          step="0.1"
          defaultValue={vehicle.current_hours}
        />
      </div>

      {/* Cost & Labor */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="cost"
          name="cost"
          label="Cost ($)"
          type="number"
          step="0.01"
          placeholder="0.00"
        />
        <Input
          id="labor_minutes"
          name="labor_minutes"
          label="Labor (minutes)"
          type="number"
          placeholder="0"
        />
      </div>

      {/* Parts Used */}
      <div>
        <p className="mb-1 text-sm font-medium text-gray-700">Parts Used</p>
        <div className="flex gap-2">
          <select
            value={selectedPart}
            onChange={(e) => setSelectedPart(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base
                       focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select a part...</option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.part_number} — {p.name}
                {p.inventory ? ` (${p.inventory.quantity_on_hand} in stock)` : ''}
              </option>
            ))}
          </select>
          <Input
            id="part_qty"
            type="number"
            min="1"
            value={partQty}
            onChange={(e) => setPartQty(e.target.value)}
            className="w-20"
          />
          <Button type="button" variant="secondary" onClick={addPart}>Add</Button>
        </div>

        {partsUsed.length > 0 && (
          <ul className="mt-2 space-y-1">
            {partsUsed.map((p) => (
              <li key={p.part_id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span>{p.name} x{p.quantity_used}</span>
                <button
                  type="button"
                  onClick={() => removePart(p.part_id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                     focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? 'Logging...' : 'Log Service'}
      </Button>
    </form>
  );
}
