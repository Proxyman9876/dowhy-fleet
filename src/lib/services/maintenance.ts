import { createAdminClient as createClient } from '@/lib/supabase/admin';
import type { MaintenanceRecordDetail } from '@/types/domain';

export async function getMaintenanceRecords(filters?: {
  vehicleId?: string;
  limit?: number;
}): Promise<MaintenanceRecordDetail[]> {
  const supabase = createClient();
  let query = supabase
    .from('maintenance_records')
    .select(`
      *,
      performer:profiles!performed_by(id, full_name),
      vehicle:vehicles!vehicle_id(id, unit_number, make, model, year),
      parts_used:maintenance_record_parts(
        part_id,
        quantity_used,
        unit_cost_at_time,
        part:parts(part_number, name)
      )
    `)
    .order('performed_at', { ascending: false });

  if (filters?.vehicleId) {
    query = query.eq('vehicle_id', filters.vehicleId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Reshape the nested joins
  return (data ?? []).map((record) => ({
    ...record,
    performer: record.performer as unknown as MaintenanceRecordDetail['performer'],
    vehicle: record.vehicle as unknown as MaintenanceRecordDetail['vehicle'],
    parts_used: ((record.parts_used as unknown as Array<{
      part_id: string;
      quantity_used: number;
      unit_cost_at_time: number | null;
      part: { part_number: string; name: string };
    }>) ?? []).map((pu) => ({
      part_id: pu.part_id,
      part_number: pu.part?.part_number ?? '',
      name: pu.part?.name ?? '',
      quantity_used: pu.quantity_used,
      unit_cost_at_time: pu.unit_cost_at_time,
    })),
  }));
}

export async function getMaintenanceRecord(id: string): Promise<MaintenanceRecordDetail | null> {
  const records = await getMaintenanceRecords();
  return records.find((r) => r.id === id) ?? null;
}
