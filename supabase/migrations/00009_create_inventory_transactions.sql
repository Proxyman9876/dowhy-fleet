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
