import { createClient } from '@/lib/supabase/server';
import type { MaintenanceSchedule } from '@/types/database';
import type { VehicleScheduleDetail } from '@/types/domain';

export async function getSchedules(): Promise<MaintenanceSchedule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function getSchedule(id: string): Promise<MaintenanceSchedule | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getVehicleSchedules(vehicleId: string): Promise<VehicleScheduleDetail[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehicle_maintenance_schedules')
    .select('*, schedule:maintenance_schedules(*)')
    .eq('vehicle_id', vehicleId)
    .eq('is_active', true);

  if (error) throw error;
  return (data ?? []) as unknown as VehicleScheduleDetail[];
}
