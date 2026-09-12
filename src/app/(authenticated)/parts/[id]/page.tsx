import { notFound } from 'next/navigation';
import { getPart, getInventoryTransactions } from '@/lib/services/inventory';
import { Badge } from '@/components/ui/badge';
import { InventoryAdjustDialog } from '@/components/parts/inventory-adjust-dialog';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export default async function PartDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const [part, transactions] = await Promise.all([
    getPart(id),
    getInventoryTransactions(id),
  ]);

  if (!part) notFound();

  const inv = part.inventory;
  const lowStock = inv && inv.quantity_on_hand <= inv.reorder_point;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{part.part_number}</h1>
          {part.category && <Badge>{part.category}</Badge>}
          {lowStock && (
            <Badge variant="warning">
              Low Stock
            </Badge>
          )}
        </div>
        <p className="text-gray-500">{part.name}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Part Details */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {part.description && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Description</dt>
                  <dd className="text-gray-900">{part.description}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Unit Cost</dt>
                <dd className="text-gray-900">
                  {part.unit_cost != null ? formatCurrency(part.unit_cost) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Supplier</dt>
                <dd className="text-gray-900">{part.supplier || '—'}</dd>
              </div>
              {inv && (
                <>
                  <div>
                    <dt className="text-gray-500">On Hand</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {inv.quantity_on_hand}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Reorder Point</dt>
                    <dd className="text-gray-900">{inv.reorder_point}</dd>
                  </div>
                  {inv.bin_location && (
                    <div>
                      <dt className="text-gray-500">Bin Location</dt>
                      <dd className="font-mono text-gray-900">{inv.bin_location}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>

          {/* Transaction History */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Transaction History</h2>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions yet.</p>
            ) : (
              <ul className="space-y-2">
                {transactions.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium capitalize text-gray-900">{tx.transaction_type}</span>
                      {tx.notes && <span className="ml-2 text-gray-500">— {tx.notes}</span>}
                      <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                    </div>
                    <span className={tx.quantity >= 0 ? 'font-semibold text-green-700' : 'font-semibold text-red-600'}>
                      {tx.quantity >= 0 ? '+' : ''}{tx.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar: Adjust Inventory */}
        <div>
          {inv && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Inventory</h2>
              <InventoryAdjustDialog partId={part.id} currentQty={inv.quantity_on_hand} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
