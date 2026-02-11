-- 01_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) departments
CREATE TABLE departments (
    id TEXT PRIMARY KEY, -- "ED", "MED", etc.
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) department_members
CREATE TABLE department_members (
    email TEXT PRIMARY KEY,
    department_id TEXT REFERENCES departments(id),
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DEPT_USER')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Constraint: Non-admin must have department_id
ALTER TABLE department_members ADD CONSTRAINT non_admin_needs_dept 
    CHECK (role = 'ADMIN' OR department_id IS NOT NULL);

-- 3) contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id TEXT NOT NULL REFERENCES departments(id),
    full_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    phone_number TEXT,
    position TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(department_id, short_name) -- Simplified; lower handled in logic or via index
);
CREATE UNIQUE INDEX idx_contacts_short_name_lower ON contacts (department_id, lower(short_name));

-- 4) contact_aliases
CREATE TABLE contact_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id TEXT NOT NULL REFERENCES departments(id),
    alias_token TEXT NOT NULL,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX idx_aliases_token_lower ON contact_aliases (department_id, lower(alias_token));

-- 5) slot_definitions
CREATE TABLE slot_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id TEXT NOT NULL REFERENCES departments(id),
    slot_key TEXT NOT NULL,
    label TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    required BOOLEAN DEFAULT false,
    max_people INT NOT NULL DEFAULT 1,
    effective_from_month TEXT NOT NULL, -- "YYYY-MM"
    effective_to_month TEXT, -- "YYYY-MM"
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(department_id, slot_key, effective_from_month)
);

-- 6) roster_months
CREATE TABLE roster_months (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id TEXT NOT NULL REFERENCES departments(id),
    month TEXT NOT NULL, -- "YYYY-MM"
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(department_id, month)
);

-- 7) roster_cells
CREATE TABLE roster_cells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roster_month_id UUID NOT NULL REFERENCES roster_months(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot_definition_id UUID NOT NULL REFERENCES slot_definitions(id),
    contact_id UUID REFERENCES contacts(id),
    raw_text TEXT,
    version INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by_email TEXT,
    UNIQUE(roster_month_id, date, slot_definition_id)
);

-- 8) publish_events
CREATE TABLE publish_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roster_month_id UUID NOT NULL REFERENCES roster_months(id),
    department_id TEXT NOT NULL REFERENCES departments(id),
    month TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_by_email TEXT NOT NULL,
    validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 9) audit_log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ts TIMESTAMPTZ DEFAULT now(),
    actor_email TEXT,
    actor_role TEXT,
    table_name TEXT,
    action TEXT,
    row_pk TEXT,
    before_json JSONB,
    after_json JSONB,
    context JSONB
);
