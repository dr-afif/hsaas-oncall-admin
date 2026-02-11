-- 04_seed_admin.sql

-- HOW TO SEED YOUR FIRST ADMIN:
-- 1. Create a department first
INSERT INTO departments (id, name) VALUES ('ADMIN', 'Administration');

-- 2. Add yourself as an ADMIN
-- REPLACE 'your-email@example.com' with your actual Auth0 email address.
INSERT INTO department_members (email, role, department_id) 
VALUES ('muhammadafif@upm.edu.my', 'ADMIN', 'ADMIN');

-- 3. Example department
INSERT INTO departments (id, name) VALUES ('MED', 'Department of Medicine');
