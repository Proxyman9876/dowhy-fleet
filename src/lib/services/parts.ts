import { createAdminClient as createClient } from '@/lib/supabase/admin';
import type { PartWithInventory } from '@/types/domain';

export async function getPartsWithInventory(): Promise<PartWithInventory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('parts')
    .select('*, inventory:parts_inventory(*)')
    .eq('is_active', true)
    .order('part_number');

  if (error) throw error;

  return (data ?? []).map((p) => ({
    ...p,
    inventory: Array.isArray(p.inventory)
      ? (p.inventory[0] ?? null)
      : (p.inventory ?? null),
  })) as unknown as PartWithInventory[];
}
