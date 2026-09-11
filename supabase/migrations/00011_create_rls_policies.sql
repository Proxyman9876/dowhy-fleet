-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_record_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'manager') OR id = auth.uid());
CREATE POLICY profiles_insert ON profiles FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin' OR id = auth.uid());

-- VEHICLES
CREATE POLICY vehicles_select ON vehicles FOR SELECT TO authenticated
  USING (is_deleted = false);
CREATE POLICY vehicles_insert ON vehicles FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY vehicles_update ON vehicles FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY vehicles_delete ON vehicles FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- MAINTENANCE SCHEDULES
CREATE POLICY ms_select ON maintenance_schedules FOR SELECT TO authenticated
  USING (true);
CREATE POLICY ms_insert ON maintenance_schedules FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY ms_update ON maintenance_schedules FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

-- VEHICLE MAINTENANCE SCHEDULES
CREATE POLICY vms_select ON vehicle_maintenance_schedules FOR SELECT TO authenticated
  USING (true);
CREATE POLICY vms_insert ON vehicle_maintenance_schedules FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY vms_update ON vehicle_maintenance_schedules FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

-- MAINTENANCE RECORDS
CREATE POLICY mr_select ON maintenance_records FOR SELECT TO authenticated
  USING (true);
CREATE POLICY mr_insert ON maintenance_records FOR INSERT TO authenticated
  WITH CHECK (performed_by = auth.uid());
CREATE POLICY mr_update ON maintenance_records FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager') OR performed_by = auth.uid());

-- MAINTENANCE RECORD PARTS
CREATE POLICY mrp_select ON maintenance_record_parts FOR SELECT TO authenticated
  USING (true);
CREATE POLICY mrp_insert ON maintenance_record_parts FOR INSERT TO authenticated
  WITH CHECK (true);

-- PARTS
CREATE POLICY parts_select ON parts FOR SELECT TO authenticated
  USING (true);
CREATE POLICY parts_insert ON parts FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY parts_update ON parts FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

-- PARTS INVENTORY
CREATE POLICY pi_select ON parts_inventory FOR SELECT TO authenticated
  USING (true);
CREATE POLICY pi_insert ON parts_inventory FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY pi_update ON parts_inventory FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

-- INVENTORY TRANSACTIONS
CREATE POLICY itx_select ON inventory_transactions FOR SELECT TO authenticated
  USING (true);
CREATE POLICY itx_insert ON inventory_transactions FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));
