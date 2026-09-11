import { z } from 'zod';
import { INVENTORY_TX_TYPES } from '@/types/enums';

export const partCreateSchema = z.object({
  part_number: z.string().min(1, 'Part number is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit_cost: z.number().min(0).optional().nullable(),
  supplier: z.string().optional().nullable(),
});

export const partUpdateSchema = partCreateSchema.partial();

export const inventoryAdjustSchema = z.object({
  part_id: z.string().uuid(),
  quantity: z.number().refine((val) => val !== 0, 'Quantity cannot be zero'),
  transaction_type: z.enum(INVENTORY_TX_TYPES),
  notes: z.string().optional().nullable(),
});

export const inventoryCreateSchema = z.object({
  part_id: z.string().uuid(),
  quantity_on_hand: z.number().default(0),
  reorder_point: z.number().min(0).default(0),
  reorder_quantity: z.number().min(0).optional().nullable(),
  bin_location: z.string().optional().nullable(),
});

export type PartCreateInput = z.infer<typeof partCreateSchema>;
export type PartUpdateInput = z.infer<typeof partUpdateSchema>;
export type InventoryAdjustInput = z.infer<typeof inventoryAdjustSchema>;
export type InventoryCreateInput = z.infer<typeof inventoryCreateSchema>;
