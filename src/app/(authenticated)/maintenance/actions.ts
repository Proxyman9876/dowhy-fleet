'use server';

import { createAdminClient as createClient } from '@/lib/supabase/admin';
import { maintenanceRecordSchema } from '@/lib/validators/maintenance';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createMaintenanceRecord(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const raw = Object.fromEntries(formData);
  const partsJson = formData.get('parts_used') as string;

  const parsed = maintenanceRecordSchema.parse({
    vehicle_id: raw.vehicle_id,
    schedule_id: raw.schedule_id || null,
    mileage_at: Number(raw.mileage_at),
    hours_at: raw.hours_at ? Number(raw.hours_at) : null,
    description: raw.description,
    notes: raw.notes || null,
    labor_minutes: raw.labor_minutes ? Number(raw.labor_minutes) : null,
    cost: raw.cost ? Number(raw.cost) : null,
    parts_used: partsJson ? JSON.parse(partsJson) : [],
  });

  // Insert maintenance record
  const { data: record, error: recordError } = await supabase
    .from('maintenance_records')
    .insert({
      vehicle_id: parsed.vehicle_id,
      schedule_id: parsed.schedule_id,
      performed_by: user.id,
      mileage_at: parsed.mileage_at,
      hours_at: parsed.hours_at,
      description: parsed.description,
      notes: parsed.notes,
      labor_minutes: parsed.labor_minutes,
      cost: parsed.cost,
    })
    .select('id')
    .single();

  if (recordError) return { error: recordError.message };

  // Insert parts used
  if (parsed.parts_used.length > 0) {
    const partsToInsert = parsed.parts_used.map((p) => ({
      maintenance_record_id: record.id,
      part_id: p.part_id,
      quantity_used: p.quantity_used,
    }));

    const { error: partsError } = await supabase
      .from('maintenance_record_parts')
      .insert(partsToInsert);

    if (partsError) return { error: partsError.message };
  }

  revalidatePath(`/vehicles/${parsed.vehicle_id}`);
  revalidatePath('/maintenance');
  revalidatePath('/');
  redirect(`/vehicles/${parsed.vehicle_id}`);
}
