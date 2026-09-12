-- Add missing columns from TRUCK MAINTENANCE.xlsx

-- Vehicle-level fields for tire, fluid, and repair tracking
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tire_rotation_mileage INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS greased_mileage INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tire_notes TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS differential_oil_mileage INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission_oil_mileage TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS major_repairs TEXT;

-- Link a specific part to a vehicle's maintenance schedule
ALTER TABLE vehicle_maintenance_schedules ADD COLUMN IF NOT EXISTS assigned_part_id UUID REFERENCES parts(id) ON DELETE SET NULL;
