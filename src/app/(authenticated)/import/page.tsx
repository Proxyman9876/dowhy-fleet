'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Step = 'upload' | 'preview' | 'mapping' | 'result';

interface ParsedData {
  headers: string[];
  rows: Array<{ row_number: number; raw: Record<string, unknown> }>;
  totalRows: number;
}

interface ColumnMapping {
  unit_number: string;
  make_model: string;
  vin: string;
  oil_type: string;
  current_mileage: string;
}

interface ImportResult {
  vehiclesCreated: number;
  vehiclesSkipped: number;
  partsCreated: number;
  partsSkipped: number;
  errors: string[];
}

// Known column patterns from TRUCK MAINTENANCE.xlsx
const COLUMN_GUESSES: Record<string, string[]> = {
  unit_number: ['TRUCK #', 'TRUCK', 'UNIT', 'UNIT NUMBER', 'UNIT #'],
  make_model: ['MAKE/MODEL', 'MAKE MODEL', 'MAKE', 'VEHICLE'],
  vin: ['VIN #', 'VIN', 'VIN NUMBER'],
  oil_type: ['OIL TYPE', 'OIL'],
  current_mileage: ['OIL CHANGE MILEAGE', 'MILEAGE', 'CURRENT MILEAGE', 'MILES'],
};

function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = { unit_number: '', make_model: '', vin: '', oil_type: '', current_mileage: '' };

  for (const [field, patterns] of Object.entries(COLUMN_GUESSES)) {
    for (const header of headers) {
      const normalized = header.toUpperCase().trim();
      if (patterns.some((p) => normalized.includes(p) || p.includes(normalized))) {
        mapping[field as keyof ColumnMapping] = header;
        break;
      }
    }
  }

  return mapping;
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    unit_number: '', make_model: '', vin: '', oil_type: '', current_mileage: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/import', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to parse file');
      setLoading(false);
      return;
    }

    setParsedData(data);
    setMapping(guessMapping(data.headers));
    setStep('mapping');
    setLoading(false);
  }

  async function handleImport() {
    if (!parsedData) return;
    setLoading(true);
    setError('');

    // Extract vehicles and parts from parsed rows
    const vehicles = parsedData.rows
      .filter((row) => {
        const unitNum = String(row.raw[mapping.unit_number] ?? '').trim();
        return unitNum.length > 0;
      })
      .map((row) => ({
        unit_number: String(row.raw[mapping.unit_number] ?? '').trim(),
        make_model: String(row.raw[mapping.make_model] ?? '').trim(),
        vin: String(row.raw[mapping.vin] ?? '').trim(),
        oil_type: String(row.raw[mapping.oil_type] ?? '').trim(),
        current_mileage: row.raw[mapping.current_mileage],
        notes: '',
      }));

    // Extract unique parts from filter columns
    const partColumns = parsedData.headers.filter((h) => {
      const upper = h.toUpperCase();
      return upper === 'PART NUMBER' || upper.includes('PART');
    });

    const parts: Array<{ part_number: string; name: string; category: string; quantity_on_hand: number }> = [];
    const seenParts = new Set<string>();

    for (const row of parsedData.rows) {
      for (const col of partColumns) {
        const partNum = String(row.raw[col] ?? '').trim();
        if (partNum && partNum !== 'N/A' && !seenParts.has(partNum)) {
          seenParts.add(partNum);
          parts.push({
            part_number: partNum,
            name: partNum,
            category: 'Filter',
            quantity_on_hand: 0,
          });
        }
      }
    }

    const res = await fetch('/api/import/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicles, parts }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Import failed');
      setLoading(false);
      return;
    }

    setResult(data);
    setStep('result');
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
      <p className="mt-1 text-gray-500">Import vehicles and parts from Excel or CSV files.</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      )}

      <div className="mt-6 max-w-3xl">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-3 text-gray-600">
                Drop your Excel (.xlsx) or CSV file here, or click to browse.
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-4 text-sm"
              />
            </div>

            {file && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-700">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                <Button onClick={handleUpload} disabled={loading} size="lg">
                  <Upload className="mr-2 h-4 w-4" />
                  {loading ? 'Parsing...' : 'Upload & Parse'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && parsedData && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Column Mapping — {parsedData.totalRows} rows found
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                Map your spreadsheet columns to vehicle fields. We auto-detected what we could.
              </p>

              <div className="space-y-3">
                {(Object.entries(mapping) as [keyof ColumnMapping, string][]).map(([field, value]) => (
                  <div key={field} className="grid grid-cols-2 gap-3 items-center">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {field.replace(/_/g, ' ')}
                    </label>
                    <select
                      value={value}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">— Skip —</option>
                      {parsedData.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 overflow-x-auto">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Preview (first 5 rows)</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="p-1 text-left text-gray-500">#</th>
                    {Object.entries(mapping).filter(([, v]) => v).map(([field]) => (
                      <th key={field} className="p-1 text-left text-gray-500 capitalize">
                        {field.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.slice(0, 5).map((row) => (
                    <tr key={row.row_number} className="border-t border-gray-100">
                      <td className="p-1 text-gray-400">{row.row_number}</td>
                      {Object.entries(mapping).filter(([, v]) => v).map(([field, col]) => (
                        <td key={field} className="p-1 text-gray-900 truncate max-w-[150px]">
                          {String(row.raw[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleImport} disabled={loading} size="lg">
                {loading ? 'Importing...' : `Import ${parsedData.totalRows} Rows`}
              </Button>
              <Button variant="secondary" onClick={() => { setStep('upload'); setParsedData(null); }}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <Check className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="mt-3 text-lg font-semibold text-green-800">Import Complete</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-white p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Vehicles Created</p>
                <p className="text-2xl font-bold text-gray-900">{result.vehiclesCreated}</p>
                {result.vehiclesSkipped > 0 && (
                  <p className="text-xs text-gray-400">{result.vehiclesSkipped} skipped</p>
                )}
              </div>
              <div className="rounded-lg bg-white p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Parts Created</p>
                <p className="text-2xl font-bold text-gray-900">{result.partsCreated}</p>
                {result.partsSkipped > 0 && (
                  <p className="text-xs text-gray-400">{result.partsSkipped} skipped</p>
                )}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                <h3 className="text-sm font-semibold text-yellow-800">Warnings</h3>
                <ul className="mt-1 text-xs text-yellow-700 space-y-1">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            <Button onClick={() => { setStep('upload'); setFile(null); setParsedData(null); setResult(null); }}>
              Import Another File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
