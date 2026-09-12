import Link from 'next/link';
import { Plus, AlertTriangle } from 'lucide-react';
import { getPartsWithInventory } from '@/lib/services/parts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';

export default async function PartsPage() {
  const parts = await getPartsWithInventory();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
        <Link href="/parts/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" /> Add Part
          </Button>
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {parts.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No parts in inventory.</p>
        ) : (
          parts.map((part) => {
            const inv = part.inventory;
            const lowStock = inv && inv.quantity_on_hand <= inv.reorder_point;

            return (
              <Link key={part.id} href={`/parts/${part.id}`}>
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm
                                hover:shadow-md active:bg-gray-50 transition-shadow min-h-[64px]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">{part.part_number}</span>
                      {part.category && <Badge>{part.category}</Badge>}
                      {lowStock && (
                        <Badge variant="warning">
                          <AlertTriangle className="mr-1 h-3 w-3" />Low
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{part.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-semibold text-gray-900">
                      {inv ? inv.quantity_on_hand : '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {part.unit_cost != null ? formatCurrency(part.unit_cost) : ''}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
