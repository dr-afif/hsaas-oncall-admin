-- 02_rls.sql

-- Helper functions
CREATE OR REPLACE FUNCTION current_email() RETURNS TEXT AS $$
  SELECT lower(coalesce(
    current_setting('request.jwt.claims', true)::jsonb ->> 'email',
    ''
  ));
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM department_members 
    WHERE email = current_email() AND role = 'ADMIN' AND active = true
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION my_department() RETURNS TEXT AS $$
  SELECT department_id FROM department_members 
  WHERE email = current_email() AND role = 'DEPT_USER' AND active = true;
$$ LANGUAGE sql STABLE;

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 1) departments
CREATE POLICY "Admin full access" ON departments FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Users can read active depts" ON departments FOR SELECT TO authenticated USING (active = true);

-- 2) department_members
CREATE POLICY "Admin full access members" ON department_members FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Users read self" ON department_members FOR SELECT TO authenticated USING (email = current_email());

-- 3) contacts
CREATE POLICY "Admin contacts" ON contacts FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Dept users CRUD contacts" ON contacts FOR ALL TO authenticated 
  USING (department_id = my_department())
  WITH CHECK (department_id = my_department());

-- 4) contact_aliases
CREATE POLICY "Admin aliases" ON contact_aliases FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Dept users CRUD aliases" ON contact_aliases FOR ALL TO authenticated 
  USING (department_id = my_department())
  WITH CHECK (department_id = my_department());

-- 5) slot_definitions
CREATE POLICY "Admin slots" ON slot_definitions FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Dept users CRUD slots" ON slot_definitions FOR ALL TO authenticated 
  USING (department_id = my_department())
  WITH CHECK (department_id = my_department());

-- 6) roster_months
CREATE POLICY "Admin roster_months" ON roster_months FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Dept users CRUD roster_months" ON roster_months FOR ALL TO authenticated 
  USING (department_id = my_department())
  WITH CHECK (department_id = my_department());

-- 7) roster_cells
CREATE POLICY "Admin roster_cells" ON roster_cells FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Dept users CRUD roster_cells" ON roster_cells FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM roster_months rm 
    WHERE rm.id = roster_cells.roster_month_id AND rm.department_id = my_department()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM roster_months rm 
    WHERE rm.id = roster_cells.roster_month_id AND rm.department_id = my_department()
  ));

-- 8) publish_events
CREATE POLICY "Admin publish" ON publish_events FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Dept users CRUD publish" ON publish_events FOR ALL TO authenticated 
  USING (department_id = my_department())
  WITH CHECK (department_id = my_department());

-- 9) audit_log
CREATE POLICY "Admin audit" ON audit_log FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Users audit filter" ON audit_log FOR SELECT TO authenticated 
  USING (actor_email = current_email() OR (context->>'department_id') = my_department());

-- Access Control Block: If user not in department_members, they have no access
-- This is naturally handled by the policies above (they won't match any policy).
