import { createAdminClient as createClient } from '@/lib/supabase/admin';
import type { Vehicle } from '@/types/database';

export async function getVehicles(filters?: {
  status?: string;
  search?: string;
}): Promise<Vehicle[]> {
  const supabase = createClient();
  let query = supabase
    .from('vehicles')
    .select('*')
    .eq('is_deleted', false)
    .order('unit_number', { ascending: true, nullsFirst: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `unit_number.ilike.${term},make.ilike.${term},model.ilike.${term},vin.ilike.${term}`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function getVehicleByQrCode(qrCodeId: string): Promise<Vehicle | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('qr_code_id', qrCodeId)
    .eq('is_deleted', false)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}
