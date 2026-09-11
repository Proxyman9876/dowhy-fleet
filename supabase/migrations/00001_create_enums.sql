-- Enums for Dowhy Towing Fleet Maintenance

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'mechanic');
CREATE TYPE vehicle_status AS ENUM ('active', 'inactive', 'out_of_service', 'sold');
CREATE TYPE maintenance_status AS ENUM ('overdue', 'due_soon', 'ok', 'not_applicable');
CREATE TYPE inventory_tx_type AS ENUM ('purchase', 'usage', 'adjustment', 'return');
