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
