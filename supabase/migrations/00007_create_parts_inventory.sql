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
