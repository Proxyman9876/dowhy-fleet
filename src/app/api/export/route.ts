import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'maintenance';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let csv = '';
  let filename = '';

  if (type === 'maintenance') {
    const { data } = await supabase
      .from('maintenance_records')
      .select(`
        performed_at, mileage_at, hours_at, description, notes, cost, labor_minutes,
        vehicle:vehicles(unit_number, vin, make, model, year),
        performer:profiles!performed_by(full_name)
      `)
      .order('performed_at', { ascending: false });

    csv = 'Date,Vehicle,VIN,Mileage,Hours,Description,Notes,Cost,Labor (min),Performed By\n';
    for (const r of data ?? []) {
      const v = r.vehicle as unknown as { unit_number: string; vin: string; make: string; model: string; year: number };
      const p = r.performer as unknown as { full_name: string };
      csv += [
        r.performed_at,
        v?.unit_number ?? `${v?.year} ${v?.make} ${v?.model}`,
        v?.vin,
        r.mileage_at,
        r.hours_at ?? '',
        `"${(r.description ?? '').replace(/"/g, '""')}"`,
        `"${(r.notes ?? '').replace(/"/g, '""')}"`,
        r.cost ?? '',
        r.labor_minutes ?? '',
        p?.full_name ?? '',
      ].join(',') + '\n';
    }
    filename = 'maintenance-history.csv';
  } else if (type === 'inventory') {
    const { data } = await supabase
      .from('parts')
      .select('*, inventory:parts_inventory(*)')
      .eq('is_active', true)
      .order('part_number');

    csv = 'Part Number,Name,Category,Unit Cost,Supplier,On Hand,Reorder Point,Bin Location\n';
    for (const p of data ?? []) {
      const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory;
      csv += [
        p.part_number,
        `"${(p.name ?? '').replace(/"/g, '""')}"`,
        p.category ?? '',
        p.unit_cost ?? '',
        `"${(p.supplier ?? '').replace(/"/g, '""')}"`,
        inv?.quantity_on_hand ?? 0,
        inv?.reorder_point ?? 0,
        inv?.bin_location ?? '',
      ].join(',') + '\n';
    }
    filename = 'parts-inventory.csv';
  } else {
    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
