import { z } from 'zod';

export const maintenanceScheduleSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().nullable(),
    interval_miles: z.number().int().positive().optional().nullable(),
    interval_hours: z.number().positive().optional().nullable(),
    interval_days: z.number().int().positive().optional().nullable(),
    due_soon_pct: z.number().min(1).max(50).default(10),
  })
  .refine(
    (data) =>
      data.interval_miles != null ||
      data.interval_hours != null ||
      data.interval_days != null,
    { message: 'At least one interval (miles, hours, or days) is required' },
  );

export const maintenanceRecordSchema = z.object({
  vehicle_id: z.string().uuid(),
  schedule_id: z.string().uuid().optional().nullable(),
  mileage_at: z.number().int().min(0, 'Mileage cannot be negative'),
  hours_at: z.number().min(0).optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional().nullable(),
  labor_minutes: z.number().int().min(0).optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  parts_used: z
    .array(
      z.object({
        part_id: z.string().uuid(),
        quantity_used: z.number().positive('Quantity must be positive'),
      }),
    )
    .default([]),
});

export const vehicleScheduleAssignSchema = z.object({
  vehicle_id: z.string().uuid(),
  schedule_id: z.string().uuid(),
  custom_due_soon_pct: z.number().min(1).max(50).optional().nullable(),
});

export type MaintenanceScheduleInput = z.infer<typeof maintenanceScheduleSchema>;
export type MaintenanceRecordInput = z.infer<typeof maintenanceRecordSchema>;
export type VehicleScheduleAssignInput = z.infer<typeof vehicleScheduleAssignSchema>;
