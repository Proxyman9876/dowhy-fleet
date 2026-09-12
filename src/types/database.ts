import type {
  UserRole,
  VehicleStatus,
  MaintenanceStatus,
  InventoryTxType,
} from './enums';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  license_plate: string | null;
  unit_number: string | null;
  current_mileage: number;
  current_hours: number;
  status: VehicleStatus;
  qr_code_id: string;
  oil_type: string | null;
  notes: string | null;
  photo_url: string | null;
  is_deleted: boolean;
  version: number;
  tire_rotation_mileage: number | null;
  greased_mileage: number | null;
  tire_notes: string | null;
  differential_oil_mileage: number | null;
  transmission_oil_mileage: string | null;
  major_repairs: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceSchedule {
  id: string;
  name: string;
  description: string | null;
  interval_miles: number | null;
  interval_hours: number | null;
  interval_days: number | null;
  due_soon_pct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleMaintenanceSchedule {
  id: string;
  vehicle_id: string;
  schedule_id: string;
  last_performed_at: string | null;
  last_performed_mileage: number | null;
  last_performed_hours: number | null;
  next_due_mileage: number | null;
  next_due_hours: number | null;
  next_due_date: string | null;
  cached_status: MaintenanceStatus;
  custom_due_soon_pct: number | null;
  assigned_part_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  schedule_id: string | null;
  performed_by: string;
  performed_at: string;
  mileage_at: number;
  hours_at: number | null;
  description: string;
  notes: string | null;
  labor_minutes: number | null;
  cost: number | null;
  photo_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecordPart {
  id: string;
  maintenance_record_id: string;
  part_id: string;
  quantity_used: number;
  unit_cost_at_time: number | null;
  created_at: string;
}

export interface Part {
  id: string;
  part_number: string;
  name: string;
  description: string | null;
  category: string | null;
  unit_cost: number | null;
  supplier: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartsInventory {
  id: string;
  part_id: string;
  quantity_on_hand: number;
  reorder_point: number;
  reorder_quantity: number | null;
  bin_location: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  part_id: string;
  transaction_type: InventoryTxType;
  quantity: number;
  reference_id: string | null;
  notes: string | null;
  performed_by: string;
  created_at: string;
}
