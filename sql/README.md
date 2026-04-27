# SQL Setup Guide

Run these scripts from the Supabase SQL editor or another trusted Postgres client.

## Core Setup

Run these in order for a fresh project:

1. `01_schema.sql` - creates the base tables and constraints.
2. `05_multi_person_slots.sql` - adds multi-person roster cell support. Safe to rerun.
3. `06_public_holidays.sql` - creates public holiday support and policies.
4. `02_rls.sql` - enables row-level security and access policies.
5. `03_audit_triggers.sql` - creates audit triggers. Safe to rerun.
6. `04_seed_admin.sql` - seeds the first admin and starter department after you edit the email.

## Optional Scripts

- `07_seed_holidays_2026.sql` - seeds 2026 public holidays.
- `08_maintenance.sql` - adds audit-log pruning support with `pg_cron`.
- `09_performance_indexes.sql` - adds helper indexes for common app queries and RLS lookups. Safe to rerun.

## Notes

- Run `04_seed_admin.sql` only after replacing the placeholder/admin email with the intended Google login email.
- Do not expose service-role or secret keys in `public/js/config.js`; use only the Supabase URL and anon/publishable key.
- For production schema evolution, prefer Supabase migrations over editing already-applied setup scripts.
