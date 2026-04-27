-- 09_performance_indexes.sql
-- Optional helper indexes for common app queries and RLS lookups.
-- Safe to rerun: every index is created only if it does not already exist.

CREATE INDEX IF NOT EXISTS idx_department_members_email_role_active
ON department_members (email, role, active);

CREATE INDEX IF NOT EXISTS idx_contacts_department_active_short_name
ON contacts (department_id, active, short_name);

CREATE INDEX IF NOT EXISTS idx_contact_aliases_department_active_token
ON contact_aliases (department_id, active, alias_token);

CREATE INDEX IF NOT EXISTS idx_slot_definitions_department_active_months
ON slot_definitions (department_id, active, effective_from_month, effective_to_month);

CREATE INDEX IF NOT EXISTS idx_roster_months_department_month
ON roster_months (department_id, month);

CREATE INDEX IF NOT EXISTS idx_roster_cells_month_date
ON roster_cells (roster_month_id, date);

CREATE INDEX IF NOT EXISTS idx_roster_cells_contact_id
ON roster_cells (contact_id)
WHERE contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_publish_events_department_month
ON publish_events (department_id, month);

CREATE INDEX IF NOT EXISTS idx_audit_log_ts
ON audit_log (ts DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_context_department
ON audit_log ((context->>'department_id'));
