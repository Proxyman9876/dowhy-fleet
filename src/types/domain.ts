import type { MaintenanceStatus } from './enums';
import type {
  Vehicle,
  VehicleMaintenanceSchedule,
  MaintenanceSchedule,
  MaintenanceRecord,
  Part,
  PartsInventory,
  Profile,
} from './database';

/** Vehicle with its maintenance schedule statuses joined */
export interface VehicleWithStatus extends Vehicle {
  schedules: VehicleScheduleDetail[];
  worst_status: MaintenanceStatus;
}

/** A vehicle's schedule with the template info joined */
export interface VehicleScheduleDetail extends VehicleMaintenanceSchedule {
  schedule: MaintenanceSchedule;
  assigned_part: Pick<Part, 'id' | 'part_number' | 'name'> | null;
}

/** Maintenance record with performer and parts joined */
export interface MaintenanceRecordDetail extends MaintenanceRecord {
  performer: Pick<Profile, 'id' | 'full_name'> | null;
  vehicle: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model' | 'year'>;
  parts_used: RecordPartDetail[];
}

/** Part usage in a record with part info */
export interface RecordPartDetail {
  part_id: string;
  part_number: string;
  name: string;
  quantity_used: number;
  unit_cost_at_time: number | null;
}

/** Part with inventory info joined */
export interface PartWithInventory extends Part {
  inventory: PartsInventory | null;
}

/** Service-due calculation result */
export interface DueStatusResult {
  status: MaintenanceStatus;
  reasons: string[];
}
