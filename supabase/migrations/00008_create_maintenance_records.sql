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
