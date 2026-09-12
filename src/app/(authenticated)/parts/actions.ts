'use server';

import { createClient } from '@/lib/supabase/server';
import { partCreateSchema, partUpdateSchema, inventoryAdjustSchema } from '@/lib/validators/parts';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPart(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = partCreateSchema.parse({
    ...raw,
    unit_cost: raw.unit_cost ? Number(raw.unit_cost) : null,
  });

  const supabase = await createClient();
  const { data: part, error } = await supabase
    .from('parts')
    .insert(parsed)
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { error: 'A part with this number already exists' };
    return { error: error.message };
  }

  // Create inventory record
  const initialQty = Number(formData.get('initial_quantity') || 0);
  const reorderPoint = Number(formData.get('reorder_point') || 0);
  const binLocation = (formData.get('bin_location') as string) || null;

  await supabase.from('parts_inventory').insert({
    part_id: part.id,
    quantity_on_hand: initialQty,
    reorder_point: reorderPoint,
    bin_location: binLocation,
  });

  revalidatePath('/parts');
  redirect('/parts');
}

export async function updatePart(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = partUpdateSchema.parse({
    ...raw,
    unit_cost: raw.unit_cost ? Number(raw.unit_cost) : null,
  });

  const supabase = await createClient();
  const { error } = await supabase.from('parts').update(parsed).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath(`/parts/${id}`);
  revalidatePath('/parts');
  redirect(`/parts/${id}`);
}

export async function adjustInventory(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsed = inventoryAdjustSchema.parse({
    part_id: formData.get('part_id'),
    quantity: Number(formData.get('quantity')),
    transaction_type: formData.get('transaction_type'),
    notes: formData.get('notes') || null,
  });

  // Read current inventory with version for optimistic locking
  const { data: inv } = await supabase
    .from('parts_inventory')
    .select('quantity_on_hand, version')
    .eq('part_id', parsed.part_id)
    .single();

  if (!inv) return { error: 'Inventory record not found' };

  const newQty = inv.quantity_on_hand + parsed.quantity;
  const { error: updateError } = await supabase
    .from('parts_inventory')
    .update({ quantity_on_hand: newQty, version: inv.version + 1 })
    .eq('part_id', parsed.part_id)
    .eq('version', inv.version);

  if (updateError) return { error: 'Concurrent update detected. Please try again.' };

  // Log transaction
  await supabase.from('inventory_transactions').insert({
    part_id: parsed.part_id,
    transaction_type: parsed.transaction_type,
    quantity: parsed.quantity,
    notes: parsed.notes,
    performed_by: user.id,
  });

  revalidatePath(`/parts/${parsed.part_id}`);
  revalidatePath('/parts');
  return { success: true };
}
