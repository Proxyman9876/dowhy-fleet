import { z } from 'zod';

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

/** Schema for a single vehicle row from CSV/Excel import */
export const importVehicleRowSchema = z.object({
  vin: z.string().regex(VIN_REGEX, 'Invalid VIN format'),
  year: z.coerce.number().int().min(1900).max(2100),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  license_plate: z.string().optional().nullable(),
  unit_number: z.string().optional().nullable(),
  current_mileage: z.coerce.number().int().min(0).default(0),
  current_hours: z.coerce.number().min(0).default(0),
  oil_type: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/** Schema for a single part row from CSV/Excel import */
export const importPartRowSchema = z.object({
  part_number: z.string().min(1, 'Part number is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit_cost: z.coerce.number().min(0).optional().nullable(),
  supplier: z.string().optional().nullable(),
  quantity_on_hand: z.coerce.number().default(0),
  reorder_point: z.coerce.number().min(0).default(0),
  bin_location: z.string().optional().nullable(),
});

export type ImportVehicleRow = z.infer<typeof importVehicleRowSchema>;
export type ImportPartRow = z.infer<typeof importPartRowSchema>;

export interface ImportValidationResult<T> {
  row_number: number;
  status: 'valid' | 'warning' | 'error';
  data: T | null;
  errors: string[];
  warnings: string[];
}
