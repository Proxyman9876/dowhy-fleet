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
