-- Enums for Dowhy Towing Fleet Maintenance

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'mechanic');
CREATE TYPE vehicle_status AS ENUM ('active', 'inactive', 'out_of_service', 'sold');
CREATE TYPE maintenance_status AS ENUM ('overdue', 'due_soon', 'ok', 'not_applicable');
CREATE TYPE inventory_tx_type AS ENUM ('purchase', 'usage', 'adjustment', 'return');
-- Profiles table extending Supabase auth.users

CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT NOT NULL,
  role       user_role NOT NULL DEFAULT 'mechanic',
  phone      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'mechanic')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
-- Vehicles table (central entity)

CREATE TABLE vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin             TEXT NOT NULL,
  year            SMALLINT NOT NULL,
  make            TEXT NOT NULL,
  model           TEXT NOT NULL,
  license_plate   TEXT,
  unit_number     TEXT,
  current_mileage INTEGER NOT NULL DEFAULT 0,
  current_hours   NUMERIC(10,1) NOT NULL DEFAULT 0,
  status          vehicle_status NOT NULL DEFAULT 'active',
  qr_code_id      TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  oil_type        TEXT,
  notes           TEXT,
  photo_url       TEXT,
  is_deleted      BOOLEAN NOT NULL DEFAULT false,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_mileage_positive CHECK (current_mileage >= 0),
  CONSTRAINT chk_hours_positive CHECK (current_hours >= 0),
  CONSTRAINT chk_year_range CHECK (year >= 1900 AND year <= 2100)
);

-- Unique VIN among non-deleted vehicles
CREATE UNIQUE INDEX idx_vehicles_vin_active ON vehicles(vin) WHERE is_deleted = false;
CREATE INDEX idx_vehicles_status ON vehicles(status) WHERE is_deleted = false;
CREATE INDEX idx_vehicles_qr ON vehicles(qr_code_id);
-- Maintenance schedule templates (e.g. "Oil Change every 5000 miles")

CREATE TABLE maintenance_schedules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  description    TEXT,
  interval_miles INTEGER,
  interval_hours NUMERIC(10,1),
  interval_days  INTEGER,
  due_soon_pct   NUMERIC(4,2) NOT NULL DEFAULT 10.00,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_at_least_one_interval CHECK (
    interval_miles IS NOT NULL OR interval_hours IS NOT NULL OR interval_days IS NOT NULL
  )
);
-- Links a maintenance schedule to a specific vehicle with tracking data

CREATE TABLE vehicle_maintenance_schedules (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id             UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  schedule_id            UUID NOT NULL REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
  last_performed_at      TIMESTAMPTZ,
  last_performed_mileage INTEGER,
  last_performed_hours   NUMERIC(10,1),
  next_due_mileage       INTEGER,
  next_due_hours         NUMERIC(10,1),
  next_due_date          DATE,
  cached_status          maintenance_status NOT NULL DEFAULT 'ok',
  custom_due_soon_pct    NUMERIC(4,2),
  is_active              BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_vehicle_schedule UNIQUE (vehicle_id, schedule_id)
);

CREATE INDEX idx_vms_vehicle ON vehicle_maintenance_schedules(vehicle_id);
CREATE INDEX idx_vms_status ON vehicle_maintenance_schedules(cached_status)
  WHERE cached_status IN ('overdue', 'due_soon');
-- Parts catalog

CREATE TABLE parts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  unit_cost   NUMERIC(10,2),
  supplier    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_parts_category ON parts(category);
-- Parts inventory tracking

CREATE TABLE parts_inventory (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id          UUID NOT NULL UNIQUE REFERENCES parts(id) ON DELETE CASCADE,
  quantity_on_hand NUMERIC(10,2) NOT NULL DEFAULT 0,
  reorder_point    NUMERIC(10,2) NOT NULL DEFAULT 0,
  reorder_quantity NUMERIC(10,2),
  bin_location     TEXT,
  version          INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- No CHECK on quantity_on_hand: allow negative (warn, don't block mechanics)
-- Completed maintenance work records

CREATE TABLE maintenance_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id   UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  schedule_id  UUID REFERENCES maintenance_schedules(id) ON DELETE SET NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mileage_at   INTEGER NOT NULL,
  hours_at     NUMERIC(10,1),
  description  TEXT NOT NULL,
  notes        TEXT,
  labor_minutes INTEGER,
  cost         NUMERIC(10,2),
  photo_urls   TEXT[],
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mr_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX idx_mr_performed_at ON maintenance_records(performed_at DESC);
CREATE INDEX idx_mr_vehicle_schedule ON maintenance_records(vehicle_id, schedule_id);

-- Parts used in a maintenance record
CREATE TABLE maintenance_record_parts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_record_id UUID NOT NULL REFERENCES maintenance_records(id) ON DELETE CASCADE,
  part_id               UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  quantity_used         NUMERIC(10,2) NOT NULL,
  unit_cost_at_time     NUMERIC(10,2),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mrp_record ON maintenance_record_parts(maintenance_record_id);
-- Inventory audit trail

CREATE TABLE inventory_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id          UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  transaction_type inventory_tx_type NOT NULL,
  quantity         NUMERIC(10,2) NOT NULL,
  reference_id     UUID,
  notes            TEXT,
  performed_by     UUID NOT NULL REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_itx_part ON inventory_transactions(part_id);
CREATE INDEX idx_itx_created ON inventory_transactions(created_at DESC);
-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_maintenance_schedules_updated_at BEFORE UPDATE ON maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vms_updated_at BEFORE UPDATE ON vehicle_maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_parts_updated_at BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_parts_inventory_updated_at BEFORE UPDATE ON parts_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RPC: update vehicle mileage (accessible to all authenticated users)
CREATE OR REPLACE FUNCTION update_vehicle_mileage(
  p_vehicle_id UUID,
  p_mileage INTEGER,
  p_hours NUMERIC DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE vehicles
  SET
    current_mileage = GREATEST(current_mileage, p_mileage),
    current_hours = COALESCE(GREATEST(current_hours, p_hours), current_hours),
    version = version + 1
  WHERE id = p_vehicle_id AND is_deleted = false;

  -- Recalculate maintenance status for this vehicle
  PERFORM fn_recalculate_maintenance_status(p_vehicle_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate cached_status for all schedules on a vehicle
CREATE OR REPLACE FUNCTION fn_recalculate_maintenance_status(p_vehicle_id UUID)
RETURNS void AS $$
DECLARE
  v_mileage INTEGER;
  v_hours NUMERIC(10,1);
  rec RECORD;
  sched RECORD;
  calc_status maintenance_status;
  due_pct NUMERIC;
  remaining NUMERIC;
  threshold NUMERIC;
  worst_status maintenance_status;
BEGIN
  SELECT current_mileage, current_hours INTO v_mileage, v_hours
  FROM vehicles WHERE id = p_vehicle_id;

  FOR rec IN
    SELECT vms.*, ms.interval_miles, ms.interval_hours, ms.interval_days, ms.due_soon_pct
    FROM vehicle_maintenance_schedules vms
    JOIN maintenance_schedules ms ON ms.id = vms.schedule_id
    WHERE vms.vehicle_id = p_vehicle_id AND vms.is_active = true
  LOOP
    worst_status := 'ok';
    due_pct := COALESCE(rec.custom_due_soon_pct, rec.due_soon_pct);

    -- Check miles
    IF rec.interval_miles IS NOT NULL THEN
      IF rec.last_performed_mileage IS NULL THEN
        worst_status := 'overdue';
      ELSE
        remaining := (rec.last_performed_mileage + rec.interval_miles) - v_mileage;
        threshold := rec.interval_miles * (due_pct / 100.0);
        IF remaining <= 0 THEN worst_status := 'overdue';
        ELSIF remaining <= threshold AND worst_status = 'ok' THEN worst_status := 'due_soon';
        END IF;
      END IF;
    END IF;

    -- Check hours
    IF rec.interval_hours IS NOT NULL AND worst_status != 'overdue' THEN
      IF rec.last_performed_hours IS NULL THEN
        worst_status := 'overdue';
      ELSE
        remaining := (rec.last_performed_hours + rec.interval_hours) - v_hours;
        threshold := rec.interval_hours * (due_pct / 100.0);
        IF remaining <= 0 THEN worst_status := 'overdue';
        ELSIF remaining <= threshold AND worst_status = 'ok' THEN worst_status := 'due_soon';
        END IF;
      END IF;
    END IF;

    -- Check days
    IF rec.interval_days IS NOT NULL AND worst_status != 'overdue' THEN
      IF rec.last_performed_at IS NULL THEN
        worst_status := 'overdue';
      ELSE
        remaining := rec.interval_days - EXTRACT(DAY FROM (now() - rec.last_performed_at));
        threshold := rec.interval_days * (due_pct / 100.0);
        IF remaining <= 0 THEN worst_status := 'overdue';
        ELSIF remaining <= threshold AND worst_status = 'ok' THEN worst_status := 'due_soon';
        END IF;
      END IF;
    END IF;

    UPDATE vehicle_maintenance_schedules
    SET cached_status = worst_status
    WHERE id = rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: after maintenance record insert, update schedule tracking
CREATE OR REPLACE FUNCTION fn_after_maintenance_record_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vehicle mileage if new record has higher mileage
  UPDATE vehicles
  SET
    current_mileage = GREATEST(current_mileage, NEW.mileage_at),
    current_hours = COALESCE(GREATEST(current_hours, NEW.hours_at), current_hours)
  WHERE id = NEW.vehicle_id;

  -- Update schedule tracking if this is a scheduled maintenance
  IF NEW.schedule_id IS NOT NULL THEN
    UPDATE vehicle_maintenance_schedules
    SET
      last_performed_at = NEW.performed_at,
      last_performed_mileage = NEW.mileage_at,
      last_performed_hours = NEW.hours_at,
      next_due_mileage = NEW.mileage_at + ms.interval_miles,
      next_due_hours = NEW.hours_at + ms.interval_hours,
      next_due_date = (NEW.performed_at + (ms.interval_days || ' days')::interval)::date
    FROM maintenance_schedules ms
    WHERE vehicle_maintenance_schedules.vehicle_id = NEW.vehicle_id
      AND vehicle_maintenance_schedules.schedule_id = NEW.schedule_id
      AND ms.id = NEW.schedule_id;
  END IF;

  -- Recalculate all statuses for this vehicle
  PERFORM fn_recalculate_maintenance_status(NEW.vehicle_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_after_maintenance_record_insert
  AFTER INSERT ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION fn_after_maintenance_record_insert();

-- Trigger: after parts used in a record, decrement inventory
CREATE OR REPLACE FUNCTION fn_after_record_parts_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement inventory
  UPDATE parts_inventory
  SET
    quantity_on_hand = quantity_on_hand - NEW.quantity_used,
    version = version + 1
  WHERE part_id = NEW.part_id;

  -- Log inventory transaction
  INSERT INTO inventory_transactions (part_id, transaction_type, quantity, reference_id, performed_by)
  SELECT
    NEW.part_id,
    'usage',
    -NEW.quantity_used,
    NEW.maintenance_record_id,
    mr.performed_by
  FROM maintenance_records mr
  WHERE mr.id = NEW.maintenance_record_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_after_record_parts_insert
  AFTER INSERT ON maintenance_record_parts
  FOR EACH ROW EXECUTE FUNCTION fn_after_record_parts_insert();
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
