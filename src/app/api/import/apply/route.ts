import { NextResponse } from 'next/server';
import { createAdminClient as createClient } from '@/lib/supabase/admin';

interface FilterInfo {
  last_mileage: string;
  part_number: string;
  qty_on_hand: string;
}

interface ImportVehicle {
  vin: string;
  unit_number: string;
  make_model: string;
  oil_type: string;
  current_mileage: string;
  oil_filter: FilterInfo;
  air_filter: FilterInfo;
  fuel_filter: FilterInfo;
  fuel_water_sep: FilterInfo;
  coolant_filter: FilterInfo;
  hydraulic_filter: FilterInfo;
  tire_rotation: string;
  greased: string;
  tires: string;
  differential_oil: string;
  transmission_oil: string;
  major_repairs: string;
}

interface ImportPart {
  part_number: string;
  name: string;
  category: string;
  quantity_on_hand: number;
}

function parseMileage(val: unknown): number {
  if (!val) return 0;
  const str = String(val).split('\n')[0].replace(/,/g, '').replace(/\s*hrs?\s*/i, '').trim();
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function cleanStr(val: unknown): string {
  return String(val ?? '').trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findOrCreatePart(
  supabase: any,
  partNumber: string,
  category: string,
): Promise<string | null> {
  const clean = partNumber.trim().toUpperCase();
  if (!clean || clean === 'N/A' || clean === 'NONE' || clean === 'NA') return null;

  // Check existing
  const { data: existing } = await supabase
    .from('parts')
    .select('id')
    .ilike('part_number', clean)
    .maybeSingle();

  if (existing) return existing.id;

  // Create new
  const { data: newPart, error } = await supabase
    .from('parts')
    .insert({ part_number: clean, name: clean, category })
    .select('id')
    .single();

  if (error || !newPart) return null;

  // Create inventory record
  await supabase.from('parts_inventory').insert({
    part_id: newPart.id,
    quantity_on_hand: 0,
    reorder_point: 0,
  });

  return newPart.id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findOrCreateSchedule(
  supabase: any,
  name: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('maintenance_schedules')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('maintenance_schedules')
    .insert({ name, description: `${name} service`, interval_miles: 19000, due_soon_pct: 10 })
    .select('id')
    .single();

  if (error || !created) return null;
  return created.id;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role === 'mechanic') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const body = await request.json();
  const { vehicles, parts } = body as {
    vehicles: ImportVehicle[];
    parts: ImportPart[];
  };

  const results = { vehiclesCreated: 0, vehiclesSkipped: 0, partsCreated: 0, partsSkipped: 0, errors: [] as string[] };

  // Pre-create maintenance schedule types
  const scheduleNames = ['Oil Change', 'Oil Filter', 'Air Filter', 'Fuel Filter', 'Fuel/Water Separator', 'Coolant Filter', 'Hydraulic Filter'];
  const scheduleIds: Record<string, string> = {};
  for (const name of scheduleNames) {
    const id = await findOrCreateSchedule(supabase, name);
    if (id) scheduleIds[name] = id;
  }

  // Import vehicles
  for (const v of vehicles ?? []) {
    if (!v.vin && !v.unit_number) {
      results.vehiclesSkipped++;
      continue;
    }

    const vin = cleanStr(v.vin) || `UNKNOWN-${cleanStr(v.unit_number)}`;

    // Check if vehicle with this VIN already exists
    const { data: existing } = await supabase
      .from('vehicles')
      .select('id')
      .eq('vin', vin)
      .eq('is_deleted', false)
      .maybeSingle();

    if (existing) {
      results.vehiclesSkipped++;
      continue;
    }

    // Parse make/model — may have year prefix like "2015 Pete 389"
    const mmStr = cleanStr(v.make_model);
    const makeModelParts = mmStr.split(/\s+/);
    let year = 2020;
    let make = 'Unknown';
    let model = 'Unknown';

    if (makeModelParts.length > 0) {
      const maybeYear = parseInt(makeModelParts[0], 10);
      if (maybeYear >= 1900 && maybeYear <= 2100) {
        year = maybeYear;
        make = makeModelParts[1] || 'Unknown';
        model = makeModelParts.slice(2).join(' ') || 'Unknown';
      } else {
        make = makeModelParts[0] || 'Unknown';
        model = makeModelParts.slice(1).join(' ') || 'Unknown';
      }
    }

    const mileage = parseMileage(v.current_mileage);

    const { data: newVehicle, error } = await supabase.from('vehicles').insert({
      vin,
      unit_number: cleanStr(v.unit_number) || null,
      year,
      make,
      model,
      oil_type: cleanStr(v.oil_type) || null,
      current_mileage: mileage,
      tire_rotation_mileage: parseMileage(v.tire_rotation) || null,
      greased_mileage: parseMileage(v.greased) || null,
      tire_notes: cleanStr(v.tires) || null,
      differential_oil_mileage: parseMileage(v.differential_oil) || null,
      transmission_oil_mileage: cleanStr(v.transmission_oil) || null,
      major_repairs: cleanStr(v.major_repairs) || null,
    }).select('id').single();

    if (error || !newVehicle) {
      results.errors.push(`Vehicle ${cleanStr(v.unit_number)}: ${error?.message ?? 'unknown error'}`);
      results.vehiclesSkipped++;
      continue;
    }

    results.vehiclesCreated++;

    // Create vehicle maintenance schedules with assigned parts
    const filterMap: Array<{ scheduleName: string; filter: FilterInfo; category: string }> = [
      { scheduleName: 'Oil Change', filter: v.oil_filter ?? { last_mileage: '', part_number: '', qty_on_hand: '' }, category: 'Oil Filter' },
      { scheduleName: 'Oil Filter', filter: v.oil_filter ?? { last_mileage: '', part_number: '', qty_on_hand: '' }, category: 'Oil Filter' },
      { scheduleName: 'Air Filter', filter: v.air_filter ?? { last_mileage: '', part_number: '', qty_on_hand: '' }, category: 'Air Filter' },
      { scheduleName: 'Fuel Filter', filter: v.fuel_filter ?? { last_mileage: '', part_number: '', qty_on_hand: '' }, category: 'Fuel Filter' },
      { scheduleName: 'Fuel/Water Separator', filter: v.fuel_water_sep ?? { last_mileage: '', part_number: '', qty_on_hand: '' }, category: 'Fuel Filter' },
      { scheduleName: 'Coolant Filter', filter: v.coolant_filter ?? { last_mileage: '', part_number: '', qty_on_hand: '' }, category: 'Coolant Filter' },
      { scheduleName: 'Hydraulic Filter', filter: v.hydraulic_filter ?? { last_mileage: '', part_number: '', qty_on_hand: '' }, category: 'Hydraulic Filter' },
    ];

    for (const { scheduleName, filter, category } of filterMap) {
      // Skip Oil Change duplicate — Oil Change and Oil Filter share filter data,
      // but Oil Change is the mileage schedule, Oil Filter tracks the part
      if (scheduleName === 'Oil Change') {
        const schedId = scheduleIds[scheduleName];
        if (!schedId) continue;
        const lastMileage = parseMileage(filter.last_mileage);
        if (!lastMileage && !mileage) continue;

        await supabase.from('vehicle_maintenance_schedules').insert({
          vehicle_id: newVehicle.id,
          schedule_id: schedId,
          last_performed_mileage: lastMileage || null,
        });
        continue;
      }

      const schedId = scheduleIds[scheduleName];
      if (!schedId) continue;

      const partNum = cleanStr(filter.part_number);
      const lastMileage = parseMileage(filter.last_mileage);
      const qtyOnHand = parseMileage(filter.qty_on_hand);

      if (!partNum && !lastMileage) continue;

      // Find or create the part and update inventory
      let partId: string | null = null;
      if (partNum) {
        partId = await findOrCreatePart(supabase, partNum, category);
        // Update qty on hand if provided
        if (partId && qtyOnHand > 0) {
          await supabase
            .from('parts_inventory')
            .update({ quantity_on_hand: qtyOnHand })
            .eq('part_id', partId);
        }
      }

      await supabase.from('vehicle_maintenance_schedules').insert({
        vehicle_id: newVehicle.id,
        schedule_id: schedId,
        last_performed_mileage: lastMileage || null,
        assigned_part_id: partId,
      });
    }
  }

  // Import standalone parts
  for (const p of parts ?? []) {
    if (!p.part_number) {
      results.partsSkipped++;
      continue;
    }

    const partId = await findOrCreatePart(supabase, p.part_number, p.category || 'General');
    if (partId) {
      if (p.quantity_on_hand > 0) {
        await supabase
          .from('parts_inventory')
          .update({ quantity_on_hand: p.quantity_on_hand })
          .eq('part_id', partId);
      }
      results.partsCreated++;
    } else {
      results.partsSkipped++;
    }
  }

  return NextResponse.json(results);
}
