'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { vehicleCreateSchema, vehicleUpdateSchema, mileageUpdateSchema } from '@/lib/validators/vehicle';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createVehicle(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = vehicleCreateSchema.parse({
    ...raw,
    year: Number(raw.year),
    current_mileage: Number(raw.current_mileage || 0),
    current_hours: Number(raw.current_hours || 0),
    tire_rotation_mileage: raw.tire_rotation_mileage ? Number(raw.tire_rotation_mileage) : null,
    greased_mileage: raw.greased_mileage ? Number(raw.greased_mileage) : null,
    differential_oil_mileage: raw.differential_oil_mileage ? Number(raw.differential_oil_mileage) : null,
    transmission_oil_mileage: raw.transmission_oil_mileage || null,
    tire_notes: raw.tire_notes || null,
    major_repairs: raw.major_repairs || null,
  });

  const supabase = createAdminClient();
  const { error } = await supabase.from('vehicles').insert(parsed);

  if (error) {
    if (error.code === '23505') {
      return { error: 'A vehicle with this VIN already exists' };
    }
    return { error: error.message };
  }

  revalidatePath('/vehicles');
  redirect('/vehicles');
}

export async function updateVehicle(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = vehicleUpdateSchema.parse({
    ...raw,
    year: raw.year ? Number(raw.year) : undefined,
    current_mileage: raw.current_mileage ? Number(raw.current_mileage) : undefined,
    current_hours: raw.current_hours ? Number(raw.current_hours) : undefined,
    tire_rotation_mileage: raw.tire_rotation_mileage ? Number(raw.tire_rotation_mileage) : null,
    greased_mileage: raw.greased_mileage ? Number(raw.greased_mileage) : null,
    differential_oil_mileage: raw.differential_oil_mileage ? Number(raw.differential_oil_mileage) : null,
    transmission_oil_mileage: raw.transmission_oil_mileage || null,
    tire_notes: raw.tire_notes || null,
    major_repairs: raw.major_repairs || null,
  });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('vehicles')
    .update(parsed)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/vehicles/${id}`);
  revalidatePath('/vehicles');
  redirect(`/vehicles/${id}`);
}

export async function updateMileage(formData: FormData) {
  const parsed = mileageUpdateSchema.parse({
    vehicle_id: formData.get('vehicle_id') as string,
    mileage: Number(formData.get('mileage')),
    hours: formData.get('hours') ? Number(formData.get('hours')) : null,
  });

  const supabase = createAdminClient();
  const { error } = await supabase.rpc('update_vehicle_mileage', {
    p_vehicle_id: parsed.vehicle_id,
    p_mileage: parsed.mileage,
    p_hours: parsed.hours,
  });

  if (error) return { error: error.message };

  revalidatePath(`/vehicles/${parsed.vehicle_id}`);
  revalidatePath('/vehicles');
  return { success: true };
}

export async function deleteVehicle(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('vehicles')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/vehicles');
  redirect('/vehicles');
}
