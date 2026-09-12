'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Step = 'upload' | 'preview' | 'result';

interface ParsedData {
  headers: string[];
  rows: Array<{ row_number: number; raw: Record<string, unknown> }>;
  totalRows: number;
}

interface ImportResult {
  vehiclesCreated: number;
  vehiclesSkipped: number;
  partsCreated: number;
  partsSkipped: number;
  errors: string[];
}

function cleanStr(val: unknown): string {
  return String(val ?? '').trim();
}

// Auto-detect column by checking headers against known patterns
function findColumn(headers: string[], patterns: string[]): string {
  for (const header of headers) {
    const normalized = header.toUpperCase().trim();
    if (patterns.some((p) => normalized === p || normalized.includes(p))) {
      return header;
    }
  }
  return '';
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
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
    setStep('preview');
    setLoading(false);
  }

  async function handleImport() {
    if (!parsedData) return;
    setLoading(true);
    setError('');

    const headers = parsedData.headers;

    // Auto-detect columns
    const colUnitNumber = findColumn(headers, ['TRUCK #', 'TRUCK', 'UNIT', 'UNIT #']);
    const colMakeModel = findColumn(headers, ['MAKE/MODEL', 'MAKE MODEL']);
    const colVin = findColumn(headers, ['VIN #', 'VIN']);
    const colOilChangeMileage = findColumn(headers, ['OIL CHANGE MILEAGE']);
    const colOilType = findColumn(headers, ['OIL TYPE']);

    // Filter columns — each filter has a mileage column, part number column, and qty column
    // The spreadsheet pattern: FILTER_NAME, Part Number(_{n}), QTY ON HAND(_{n})
    const colOilFilter = findColumn(headers, ['OIL FILTER']);
    const colAirFilter = findColumn(headers, ['AIR FILTER']);
    const colFuelFilter = findColumn(headers, ['FUEL FILTER']);
    const colFuelWaterSep = findColumn(headers, ['FUEL/H2O SEP', 'FUEL/WATER']);
    const colCoolantFilter = findColumn(headers, ['COOLANT FILTER']);
    const colHydraulicFilter = findColumn(headers, ['HYDRAULIC FILTER']);

    // Part number and qty columns follow each filter column
    // Headers: "Part Number", "Part Number_1", etc. and "QTY ON HAND", "QUANTITY ON HAND", etc.
    const partNumCols = headers.filter((h) => h.toUpperCase().startsWith('PART NUMBER'));
    const qtyCols = headers.filter((h) => {
      const u = h.toUpperCase();
      return u.startsWith('QTY ON HAND') || u.startsWith('QUANTITY ON HAND');
    });

    // Map filter columns to their associated part number and qty columns by position
    const filterOrder = [colOilFilter, colAirFilter, colFuelFilter, colFuelWaterSep, colCoolantFilter, colHydraulicFilter];
    const filterPartMap: Record<string, { partCol: string; qtyCol: string }> = {};
    let partIdx = 0;
    for (const filterCol of filterOrder) {
      if (filterCol) {
        filterPartMap[filterCol] = {
          partCol: partNumCols[partIdx] ?? '',
          qtyCol: qtyCols[partIdx] ?? '',
        };
        partIdx++;
      }
    }

    // Additional vehicle columns
    const colTireRotation = findColumn(headers, ['ROTATION/CHANGE', 'TIRE ROTATION']);
    const colGreased = findColumn(headers, ['GREASED']);
    const colTires = findColumn(headers, ['TIRES']);
    const colDiffOil = findColumn(headers, ['DIFFERENTIAL OIL', 'DIFF OIL']);
    const colTransOil = findColumn(headers, ['TRANSMISSION OIL', 'TRANS OIL']);
    const colMajorRepairs = findColumn(headers, ['MAJOR REPAIRS', 'REPAIRS']);

    function getFilterInfo(row: Record<string, unknown>, filterCol: string) {
      const mapping = filterPartMap[filterCol];
      return {
        last_mileage: cleanStr(row[filterCol]),
        part_number: mapping ? cleanStr(row[mapping.partCol]) : '',
        qty_on_hand: mapping ? cleanStr(row[mapping.qtyCol]) : '',
      };
    }

    const vehicles = parsedData.rows
      .filter((row) => {
        const unitNum = cleanStr(row.raw[colUnitNumber]);
        return unitNum.length > 0;
      })
      .map((row) => ({
        unit_number: cleanStr(row.raw[colUnitNumber]),
        make_model: cleanStr(row.raw[colMakeModel]),
        vin: cleanStr(row.raw[colVin]),
        oil_type: cleanStr(row.raw[colOilType]),
        current_mileage: cleanStr(row.raw[colOilChangeMileage]),
        oil_filter: getFilterInfo(row.raw, colOilFilter),
        air_filter: getFilterInfo(row.raw, colAirFilter),
        fuel_filter: getFilterInfo(row.raw, colFuelFilter),
        fuel_water_sep: getFilterInfo(row.raw, colFuelWaterSep),
        coolant_filter: getFilterInfo(row.raw, colCoolantFilter),
        hydraulic_filter: getFilterInfo(row.raw, colHydraulicFilter),
        tire_rotation: cleanStr(row.raw[colTireRotation]),
        greased: cleanStr(row.raw[colGreased]),
        tires: cleanStr(row.raw[colTires]),
        differential_oil: cleanStr(row.raw[colDiffOil]),
        transmission_oil: cleanStr(row.raw[colTransOil]),
        major_repairs: cleanStr(row.raw[colMajorRepairs]),
      }));

    const res = await fetch('/api/import/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicles, parts: [] }),
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

        {/* Step 2: Preview */}
        {step === 'preview' && parsedData && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Preview — {parsedData.totalRows} rows found
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                Detected columns: {parsedData.headers.length}. All spreadsheet columns will be imported including
                filter types, part numbers, quantities, tire info, fluids, and major repairs.
              </p>
            </div>

            {/* Preview table */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 overflow-x-auto">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Preview (first 5 rows)</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="p-1 text-left text-gray-500">#</th>
                    {parsedData.headers.slice(0, 8).map((h) => (
                      <th key={h} className="p-1 text-left text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                    {parsedData.headers.length > 8 && (
                      <th className="p-1 text-left text-gray-400">+{parsedData.headers.length - 8} more</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.slice(0, 5).map((row) => (
                    <tr key={row.row_number} className="border-t border-gray-100">
                      <td className="p-1 text-gray-400">{row.row_number}</td>
                      {parsedData.headers.slice(0, 8).map((h) => (
                        <td key={h} className="p-1 text-gray-900 truncate max-w-[120px]">
                          {String(row.raw[h] ?? '')}
                        </td>
                      ))}
                      {parsedData.headers.length > 8 && <td className="p-1 text-gray-400">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleImport} disabled={loading} size="lg">
                {loading ? 'Importing...' : `Import ${parsedData.totalRows} Vehicles`}
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
