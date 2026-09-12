import { z } from 'zod';
import { VEHICLE_STATUSES } from '@/types/enums';

export const vehicleCreateSchema = z.object({
  vin: z.string().min(1, 'VIN is required'),
  year: z
    .number()
    .int()
    .min(1900, 'Year must be 1900 or later')
    .max(2100, 'Year must be 2100 or earlier'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  license_plate: z.string().optional().nullable(),
  unit_number: z.string().optional().nullable(),
  current_mileage: z.number().int().min(0, 'Mileage cannot be negative').default(0),
  current_hours: z.number().min(0, 'Hours cannot be negative').default(0),
  status: z.enum(VEHICLE_STATUSES).default('active'),
  oil_type: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tire_rotation_mileage: z.number().int().min(0).optional().nullable(),
  greased_mileage: z.number().int().min(0).optional().nullable(),
  tire_notes: z.string().optional().nullable(),
  differential_oil_mileage: z.number().int().min(0).optional().nullable(),
  transmission_oil_mileage: z.string().optional().nullable(),
  major_repairs: z.string().optional().nullable(),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial();

export const mileageUpdateSchema = z.object({
  vehicle_id: z.string().uuid(),
  mileage: z.number().int().min(0, 'Mileage cannot be negative'),
  hours: z.number().min(0, 'Hours cannot be negative').optional().nullable(),
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
export type MileageUpdateInput = z.infer<typeof mileageUpdateSchema>;
