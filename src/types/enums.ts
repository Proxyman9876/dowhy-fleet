export const USER_ROLES = ['admin', 'manager', 'mechanic'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const VEHICLE_STATUSES = ['active', 'inactive', 'out_of_service', 'sold'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const MAINTENANCE_STATUSES = ['overdue', 'due_soon', 'ok', 'not_applicable'] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const INVENTORY_TX_TYPES = ['purchase', 'usage', 'adjustment', 'return'] as const;
export type InventoryTxType = (typeof INVENTORY_TX_TYPES)[number];
