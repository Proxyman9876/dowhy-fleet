'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adjustInventory } from '@/app/(authenticated)/parts/actions';
import { INVENTORY_TX_TYPES } from '@/types/enums';

interface InventoryAdjustDialogProps {
  partId: string;
  currentQty: number;
}

export function InventoryAdjustDialog({ partId, currentQty }: InventoryAdjustDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [txType, setTxType] = useState<string>('purchase');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setResult(null);

    const formData = new FormData();
    formData.set('part_id', partId);
    formData.set('quantity', quantity);
    formData.set('transaction_type', txType);
    if (notes) formData.set('notes', notes);

    const res = await adjustInventory(formData);
    setPending(false);
    setResult(res);

    if (res.success) {
      setTimeout(() => {
        setOpen(false);
        setQuantity('');
        setNotes('');
        setResult(null);
      }, 1000);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" size="md" onClick={() => setOpen(true)} className="w-full">
        Adjust Inventory
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <h3 className="text-sm font-semibold text-gray-900">
        Adjust Inventory (current: {currentQty})
      </h3>

      {result?.error && (
        <div className="rounded bg-red-50 p-2 text-sm text-red-700">{result.error}</div>
      )}
      {result?.success && (
        <div className="rounded bg-green-50 p-2 text-sm text-green-700">Adjusted!</div>
      )}

      <div>
        <label htmlFor="tx_type" className="mb-1 block text-xs font-medium text-gray-600">
          Type
        </label>
        <select
          id="tx_type"
          value={txType}
          onChange={(e) => setTxType(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {INVENTORY_TX_TYPES.filter((t) => t !== 'usage').map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <Input
        id="adjust_qty"
        label="Quantity (+/-)"
        type="number"
        step="0.01"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="e.g. 12 or -3"
      />

      <Input
        id="adjust_notes"
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Reason for adjustment"
      />

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || !quantity}>
          {pending ? '...' : 'Apply'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
