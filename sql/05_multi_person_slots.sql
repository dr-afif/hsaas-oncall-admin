-- 05_multi_person_slots.sql

-- 1. Add instance_index to roster_cells
ALTER TABLE roster_cells ADD COLUMN IF NOT EXISTS instance_index INT NOT NULL DEFAULT 0;

-- 2. Update the UNIQUE constraint
-- First, drop the old one if this script is being run against the original schema.
ALTER TABLE roster_cells DROP CONSTRAINT IF EXISTS roster_cells_roster_month_id_date_slot_definition_id_key;

-- Then, add the new one including instance_index if it does not already exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'roster_cells'::regclass
        AND conname = 'roster_cells_unique_identity'
    ) THEN
        ALTER TABLE roster_cells ADD CONSTRAINT roster_cells_unique_identity
            UNIQUE(roster_month_id, date, slot_definition_id, instance_index);
    END IF;
END $$;

-- 3. Update slot_definitions UI field (logic already exists in DB, making sure UI follows)
-- No changes needed to schema for slot_definitions, just the data usage.
