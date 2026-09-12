'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPart } from '../actions';
import { PART_CATEGORIES } from '@/lib/constants';

export default function NewPartPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createPart(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Add Part</h1>
      <div className="max-w-2xl">
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="part_number" name="part_number" label="Part Number *" required />
            <Input id="name" name="name" label="Name *" required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                           focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select category...</option>
                {PART_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Input id="unit_cost" name="unit_cost" label="Unit Cost ($)" type="number" step="0.01" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="supplier" name="supplier" label="Supplier" />
            <Input id="bin_location" name="bin_location" label="Bin Location" placeholder="e.g. A-1" />
          </div>

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

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="initial_quantity"
              name="initial_quantity"
              label="Initial Quantity"
              type="number"
              defaultValue={0}
            />
            <Input
              id="reorder_point"
              name="reorder_point"
              label="Reorder Point"
              type="number"
              defaultValue={0}
            />
          </div>

          <Button type="submit" disabled={pending} size="lg">
            {pending ? 'Creating...' : 'Add Part'}
          </Button>
        </form>
      </div>
    </div>
  );
}
