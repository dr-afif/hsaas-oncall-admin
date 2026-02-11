-- 05_multi_person_slots.sql

-- 1. Add instance_index to roster_cells
ALTER TABLE roster_cells ADD COLUMN instance_index INT NOT NULL DEFAULT 0;

-- 2. Update the UNIQUE constraint
-- First, drop the old one
ALTER TABLE roster_cells DROP CONSTRAINT roster_cells_roster_month_id_date_slot_definition_id_key;

-- Then, add the new one including instance_index
ALTER TABLE roster_cells ADD CONSTRAINT roster_cells_unique_identity 
    UNIQUE(roster_month_id, date, slot_definition_id, instance_index);

-- 3. Update slot_definitions UI field (logic already exists in DB, making sure UI follows)
-- No changes needed to schema for slot_definitions, just the data usage.
