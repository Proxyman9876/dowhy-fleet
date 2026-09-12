'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSchedule } from '../actions';

export default function NewSchedulePage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createSchedule(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Add Maintenance Schedule</h1>
      <div className="max-w-2xl">
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
          )}

          <Input id="name" name="name" label="Schedule Name *" required placeholder="e.g. Oil Change" />

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                         focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <p className="text-sm font-medium text-gray-700">
            Intervals (at least one required)
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input id="interval_miles" name="interval_miles" label="Miles" type="number" placeholder="e.g. 5000" />
            <Input id="interval_hours" name="interval_hours" label="Hours" type="number" step="0.1" placeholder="e.g. 500" />
            <Input id="interval_days" name="interval_days" label="Days" type="number" placeholder="e.g. 180" />
          </div>

          <Input
            id="due_soon_pct"
            name="due_soon_pct"
            label="Due Soon Alert (%)"
            type="number"
            defaultValue={10}
            min={1}
            max={50}
          />

          <Button type="submit" disabled={pending} size="lg">
            {pending ? 'Creating...' : 'Create Schedule'}
          </Button>
        </form>
      </div>
    </div>
  );
}
