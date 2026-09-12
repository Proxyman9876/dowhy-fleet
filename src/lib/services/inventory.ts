import { createAdminClient as createClient } from '@/lib/supabase/admin';
import type { InventoryTransaction } from '@/types/database';
import type { PartWithInventory } from '@/types/domain';

export async function getPart(id: string): Promise<PartWithInventory | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('parts')
    .select('*, inventory:parts_inventory(*)')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    ...data,
    inventory: Array.isArray(data.inventory)
      ? (data.inventory[0] ?? null)
      : (data.inventory ?? null),
  } as unknown as PartWithInventory;
}

export async function getInventoryTransactions(partId: string): Promise<InventoryTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select('*')
    .eq('part_id', partId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function getLowStockParts(): Promise<PartWithInventory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('parts')
    .select('*, inventory:parts_inventory(*)')
    .eq('is_active', true);

  if (error) throw error;

  return ((data ?? []) as unknown as Array<PartWithInventory & { inventory: PartWithInventory['inventory'] | PartWithInventory['inventory'][] }>)
    .map((p) => ({
      ...p,
      inventory: Array.isArray(p.inventory) ? (p.inventory[0] ?? null) : (p.inventory ?? null),
    }))
    .filter(
      (p) => p.inventory && p.inventory.quantity_on_hand <= p.inventory.reorder_point,
    ) as PartWithInventory[];
}
