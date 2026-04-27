-- 10_rls_verification.sql
-- Manual RLS verification checklist for Supabase SQL editor.
--
-- This file is intentionally documentation-first. Do not run it as-is in
-- production without replacing the placeholder emails and department IDs.

-- Before testing:
-- 1. Run the core setup scripts.
-- 2. Create or confirm these users in department_members:
--    - one ADMIN user
--    - one active DEPT_USER in department A
--    - one active DEPT_USER in department B
--    - one inactive DEPT_USER
-- 3. Replace the placeholder values below before running each block.

-- Helper: inspect effective membership data used by policies.
-- Replace values before running.
/*
SELECT *
FROM department_members
WHERE email IN (
    'admin@example.com',
    'dept.a@example.com',
    'dept.b@example.com',
    'inactive@example.com'
);
*/

-- Scenario 1: Admin should be able to read all departments and members.
/*
-- In the Supabase SQL editor, use "Run as authenticated user" if available,
-- or test through the app using the admin@example.com account.
SELECT 'admin departments visible' AS check_name, count(*) FROM departments;
SELECT 'admin members visible' AS check_name, count(*) FROM department_members;
*/

-- Scenario 2: Active department user should only work inside their department.
/*
-- Expected:
-- - own department contacts are visible
-- - unrelated department contacts are not visible
SELECT *
FROM contacts
WHERE department_id = 'DEPT_A';

SELECT *
FROM contacts
WHERE department_id = 'DEPT_B';
*/

-- Scenario 3: Department user writes must stay in their department.
/*
-- Expected:
-- - insert/update with department_id = own department succeeds
-- - insert/update with department_id = another department fails or affects 0 rows
INSERT INTO contacts (department_id, full_name, short_name)
VALUES ('DEPT_A', 'RLS Test Own Department', 'RLS_TEST_OWN');

INSERT INTO contacts (department_id, full_name, short_name)
VALUES ('DEPT_B', 'RLS Test Other Department', 'RLS_TEST_OTHER');
*/

-- Scenario 4: Inactive member should not have app data access.
/*
-- Expected:
-- - app access denied after membership check
-- - direct table queries as authenticated inactive user return no protected rows
SELECT * FROM department_members WHERE email = 'inactive@example.com';
SELECT * FROM contacts LIMIT 5;
*/

-- Scenario 5: Audit log visibility should be limited for department users.
/*
-- Expected:
-- - admin can read all audit rows
-- - department user can read own actor rows or rows with matching context.department_id
SELECT actor_email, table_name, action, context
FROM audit_log
ORDER BY ts DESC
LIMIT 20;
*/
