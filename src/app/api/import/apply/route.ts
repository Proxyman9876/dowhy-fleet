import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ImportVehicle {
  vin: string;
  unit_number: string;
  make_model: string;
  oil_type: string;
  current_mileage: number;
  notes: string;
}

interface ImportPart {
  part_number: string;
  name: string;
  category: string;
  quantity_on_hand: number;
}

export async function POST(request: Request) {
  const supabase = await createClient();
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

  // Import vehicles
  for (const v of vehicles ?? []) {
    if (!v.vin && !v.unit_number) {
      results.vehiclesSkipped++;
      continue;
    }

    // Parse make/model (format: "Peterbilt 335 Rollback")
    const makeModelParts = (v.make_model ?? '').split(' ');
    const make = makeModelParts[0] || 'Unknown';
    const model = makeModelParts.slice(1).join(' ') || 'Unknown';

    // Parse mileage from string (may contain commas and newline-separated dates)
    let mileage = 0;
    if (v.current_mileage) {
      const mileStr = String(v.current_mileage).split('\n')[0].replace(/,/g, '');
      const parsed = parseInt(mileStr, 10);
      if (!isNaN(parsed)) mileage = parsed;
    }

    const { error } = await supabase.from('vehicles').upsert(
      {
        vin: v.vin || `UNKNOWN-${v.unit_number}`,
        unit_number: v.unit_number || null,
        year: 2020, // Default since spreadsheet doesn't have year column
        make,
        model,
        oil_type: v.oil_type || null,
        current_mileage: mileage,
        notes: v.notes || null,
      },
      { onConflict: 'vin' },
    );

    if (error) {
      results.errors.push(`Vehicle ${v.unit_number}: ${error.message}`);
      results.vehiclesSkipped++;
    } else {
      results.vehiclesCreated++;
    }
  }

  // Import parts
  for (const p of parts ?? []) {
    if (!p.part_number) {
      results.partsSkipped++;
      continue;
    }

    const { data: existingPart } = await supabase
      .from('parts')
      .select('id')
      .eq('part_number', p.part_number)
      .single();

    if (existingPart) {
      results.partsSkipped++;
      continue;
    }

    const { data: newPart, error } = await supabase
      .from('parts')
      .insert({
        part_number: p.part_number,
        name: p.name || p.part_number,
        category: p.category || null,
      })
      .select('id')
      .single();

    if (error) {
      results.errors.push(`Part ${p.part_number}: ${error.message}`);
      results.partsSkipped++;
    } else if (newPart) {
      await supabase.from('parts_inventory').insert({
        part_id: newPart.id,
        quantity_on_hand: p.quantity_on_hand ?? 0,
        reorder_point: 0,
      });
      results.partsCreated++;
    }
  }

  return NextResponse.json(results);
}
