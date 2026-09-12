import { createAdminClient as createClient } from '@/lib/supabase/admin';

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  overdueCount: number;
  dueSoonCount: number;
  lowStockCount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();

  const [vehiclesRes, overdueRes, dueSoonRes, partsRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('status', { count: 'exact', head: false })
      .eq('is_deleted', false),
    supabase
      .from('vehicle_maintenance_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('cached_status', 'overdue')
      .eq('is_active', true),
    supabase
      .from('vehicle_maintenance_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('cached_status', 'due_soon')
      .eq('is_active', true),
    supabase
      .from('parts_inventory')
      .select('quantity_on_hand, reorder_point')
      .gte('reorder_point', 0),
  ]);

  const vehicles = vehiclesRes.data ?? [];
  const activeCount = vehicles.filter((v) => v.status === 'active').length;
  const lowStockParts = (partsRes.data ?? []).filter(
    (p) => p.quantity_on_hand <= p.reorder_point,
  );

  return {
    totalVehicles: vehicles.length,
    activeVehicles: activeCount,
    overdueCount: overdueRes.count ?? 0,
    dueSoonCount: dueSoonRes.count ?? 0,
    lowStockCount: lowStockParts.length,
  };
}

export interface OverdueItem {
  vehicleId: string;
  vehicleName: string;
  scheduleName: string;
  status: string;
  nextDueMileage: number | null;
  nextDueDate: string | null;
}

export async function getOverdueItems(): Promise<OverdueItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('vehicle_maintenance_schedules')
    .select(`
      cached_status,
      next_due_mileage,
      next_due_date,
      vehicle:vehicles(id, unit_number, make, model, year),
      schedule:maintenance_schedules(name)
    `)
    .in('cached_status', ['overdue', 'due_soon'])
    .eq('is_active', true);

  if (error) throw error;

  return (data ?? []).map((item) => {
    const v = item.vehicle as unknown as { id: string; unit_number: string | null; make: string; model: string; year: number };
    const s = item.schedule as unknown as { name: string };
    return {
      vehicleId: v.id,
      vehicleName: v.unit_number ?? `${v.year} ${v.make} ${v.model}`,
      scheduleName: s.name,
      status: item.cached_status,
      nextDueMileage: item.next_due_mileage,
      nextDueDate: item.next_due_date,
    };
  });
}
