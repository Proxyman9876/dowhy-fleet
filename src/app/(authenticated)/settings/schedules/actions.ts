'use server';

import { createAdminClient as createClient } from '@/lib/supabase/admin';
import { maintenanceScheduleSchema, vehicleScheduleAssignSchema } from '@/lib/validators/maintenance';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createSchedule(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = maintenanceScheduleSchema.parse({
    name: raw.name,
    description: raw.description || null,
    interval_miles: raw.interval_miles ? Number(raw.interval_miles) : null,
    interval_hours: raw.interval_hours ? Number(raw.interval_hours) : null,
    interval_days: raw.interval_days ? Number(raw.interval_days) : null,
    due_soon_pct: raw.due_soon_pct ? Number(raw.due_soon_pct) : 10,
  });

  const supabase = createClient();
  const { error } = await supabase.from('maintenance_schedules').insert(parsed);
  if (error) return { error: error.message };

  revalidatePath('/settings/schedules');
  redirect('/settings/schedules');
}

export async function assignScheduleToVehicle(formData: FormData) {
  const parsed = vehicleScheduleAssignSchema.parse({
    vehicle_id: formData.get('vehicle_id') as string,
    schedule_id: formData.get('schedule_id') as string,
    custom_due_soon_pct: formData.get('custom_due_soon_pct')
      ? Number(formData.get('custom_due_soon_pct'))
      : null,
  });

  const supabase = createClient();
  const { error } = await supabase
    .from('vehicle_maintenance_schedules')
    .upsert(parsed, { onConflict: 'vehicle_id,schedule_id' });

  if (error) return { error: error.message };

  revalidatePath(`/vehicles/${parsed.vehicle_id}`);
  return { success: true };
}

export async function deleteSchedule(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('maintenance_schedules')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/settings/schedules');
  return { success: true };
}
