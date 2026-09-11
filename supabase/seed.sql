-- ============================================================
-- SEED DATA — for development/testing only
-- Do NOT run in production
-- ============================================================

-- Maintenance schedule templates
INSERT INTO maintenance_schedules (id, name, description, interval_miles, interval_hours, interval_days, due_soon_pct) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Oil Change', 'Engine oil and filter change', 5000, NULL, 180, 10),
  ('a0000000-0000-0000-0000-000000000002', 'Tire Rotation', 'Rotate tires for even wear', 7500, NULL, NULL, 10),
  ('a0000000-0000-0000-0000-000000000003', 'Brake Inspection', 'Inspect brake pads, rotors, and fluid', 15000, NULL, 365, 15),
  ('a0000000-0000-0000-0000-000000000004', 'Transmission Service', 'Transmission fluid and filter', 30000, NULL, NULL, 10),
  ('a0000000-0000-0000-0000-000000000005', 'Coolant Flush', 'Drain and refill cooling system', 30000, NULL, 730, 10),
  ('a0000000-0000-0000-0000-000000000006', 'PTO Service', 'Power take-off unit inspection and fluid', NULL, 500, 365, 15);

-- Sample vehicles
INSERT INTO vehicles (id, vin, year, make, model, unit_number, current_mileage, current_hours, status, oil_type) VALUES
  ('b0000000-0000-0000-0000-000000000001', '1FTSW2BT0HEB12345', 2017, 'Ford', 'F-250 Super Duty', 'TOW-01', 87500, 3200.0, 'active', '5W-30 Synthetic'),
  ('b0000000-0000-0000-0000-000000000002', '1FTSW2BT0HEB67890', 2019, 'Ford', 'F-350 Super Duty', 'TOW-02', 62000, 2100.5, 'active', '15W-40 Diesel'),
  ('b0000000-0000-0000-0000-000000000003', '3C7WRTCL5MG543210', 2021, 'Ram', '5500 Chassis Cab', 'TOW-03', 41200, 1500.0, 'active', '5W-40 Synthetic'),
  ('b0000000-0000-0000-0000-000000000004', '1GC4KPEY5LF098765', 2020, 'Chevrolet', 'Silverado 3500HD', 'TOW-04', 55800, 1800.0, 'active', '5W-30 Synthetic'),
  ('b0000000-0000-0000-0000-000000000005', '1FTSW2BT0HEB11111', 2015, 'Ford', 'F-450 Super Duty', 'TOW-05', 142000, 5200.0, 'out_of_service', '15W-40 Diesel');

-- Assign schedules to vehicles
INSERT INTO vehicle_maintenance_schedules (vehicle_id, schedule_id, last_performed_at, last_performed_mileage, last_performed_hours, next_due_mileage, next_due_date, cached_status) VALUES
  -- TOW-01
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-07-15', 85000, NULL, 90000, '2027-01-11', 'due_soon'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '2026-06-01', 82000, NULL, 89500, NULL, 'ok'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '2026-03-01', 75000, NULL, 90000, '2027-03-01', 'ok'),
  -- TOW-02
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '2026-08-01', 60000, NULL, 65000, '2027-01-28', 'ok'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006', '2026-05-01', NULL, 1900.0, NULL, '2027-05-01', 'ok'),
  -- TOW-03
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '2026-04-01', 38000, NULL, 43000, '2026-09-28', 'overdue'),
  -- TOW-04
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '2026-08-20', 55000, NULL, 60000, '2027-02-16', 'ok');

-- Sample parts
INSERT INTO parts (id, part_number, name, category, unit_cost, supplier) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'FL-820S', 'Motorcraft Oil Filter', 'Filter', 8.99, 'Ford Parts'),
  ('c0000000-0000-0000-0000-000000000002', 'PF-48', 'AC Delco Oil Filter', 'Filter', 7.50, 'GM Parts'),
  ('c0000000-0000-0000-0000-000000000003', 'XO-5W30-5Q', 'Castrol Edge 5W-30 5qt', 'Oil', 28.99, 'AutoZone'),
  ('c0000000-0000-0000-0000-000000000004', 'XO-15W40-2.5G', 'Shell Rotella T6 15W-40 2.5gal', 'Oil', 42.99, 'AutoZone'),
  ('c0000000-0000-0000-0000-000000000005', 'BP-D1084', 'Wagner QuickStop Brake Pads Front', 'Brake', 45.99, 'AutoZone'),
  ('c0000000-0000-0000-0000-000000000006', 'AF-CA11114', 'Engine Air Filter', 'Filter', 22.99, 'Ford Parts');

INSERT INTO parts_inventory (part_id, quantity_on_hand, reorder_point, reorder_quantity, bin_location) VALUES
  ('c0000000-0000-0000-0000-000000000001', 12, 4, 12, 'A-1'),
  ('c0000000-0000-0000-0000-000000000002', 6, 3, 6, 'A-2'),
  ('c0000000-0000-0000-0000-000000000003', 8, 3, 6, 'B-1'),
  ('c0000000-0000-0000-0000-000000000004', 4, 2, 4, 'B-2'),
  ('c0000000-0000-0000-0000-000000000005', 2, 2, 4, 'C-1'),
  ('c0000000-0000-0000-0000-000000000006', 5, 2, 6, 'A-3');
