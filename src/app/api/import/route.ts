import { NextResponse } from 'next/server';
import { createAdminClient as createClient } from '@/lib/supabase/admin';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role === 'mechanic') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  // Detect headers and return parsed data for preview
  const headers = Object.keys(rows[0] ?? {});

  // Parse rows with best-effort column detection
  const parsedRows = rows
    .filter((row) => {
      // Skip empty rows
      const values = Object.values(row);
      return values.some((v) => v !== '' && v != null);
    })
    .map((row, index) => ({
      row_number: index + 2, // Excel row (1-indexed + header)
      raw: row,
    }));

  return NextResponse.json({
    headers,
    rows: parsedRows,
    sheetName,
    totalRows: parsedRows.length,
  });
}
