'use server';

import { createAdminClient as createClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createMaintenanceRecord(formData: FormData) {
  try {
    const supabase = createClient();

    const vehicleId = formData.get('vehicle_id') as string;
    const scheduleId = formData.get('schedule_id') as string;
    const description = formData.get('description') as string;
    const mileageAt = Number(formData.get('mileage_at') || 0);
    const hoursAt = formData.get('hours_at') ? Number(formData.get('hours_at')) : null;
    const cost = formData.get('cost') ? Number(formData.get('cost')) : null;
    const laborMinutes = formData.get('labor_minutes') ? Number(formData.get('labor_minutes')) : null;
    const notes = (formData.get('notes') as string) || null;
    const partsJson = formData.get('parts_used') as string;
    const partsUsed = partsJson ? JSON.parse(partsJson) : [];

    if (!vehicleId || !description) {
      return { error: 'Vehicle and description are required' };
    }

    // Insert maintenance record
    const { data: record, error: recordError } = await supabase
      .from('maintenance_records')
      .insert({
        vehicle_id: vehicleId,
        schedule_id: scheduleId || null,
        performed_by: null,
        mileage_at: mileageAt,
        hours_at: hoursAt,
        description,
        notes,
        labor_minutes: laborMinutes,
        cost,
      })
      .select('id')
      .single();

    if (recordError) return { error: recordError.message };

    // Insert parts used
    if (partsUsed.length > 0) {
      const partsToInsert = partsUsed.map((p: { part_id: string; quantity_used: number }) => ({
        maintenance_record_id: record.id,
        part_id: p.part_id,
        quantity_used: p.quantity_used,
      }));

      const { error: partsError } = await supabase
        .from('maintenance_record_parts')
        .insert(partsToInsert);

      if (partsError) return { error: partsError.message };
    }

    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath('/maintenance');
    return { success: true, redirectTo: `/vehicles/${vehicleId}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' };
  }
}
