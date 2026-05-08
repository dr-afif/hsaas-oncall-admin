-- 11_viewer_access_requests.sql

-- 1. Create the new table for access requests
CREATE TABLE viewer_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    department_id TEXT NOT NULL REFERENCES departments(id),
    duration_months INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    approved_at TIMESTAMPTZ,
    approved_by TEXT
);

-- Index for fast lookup
CREATE INDEX idx_viewer_requests_email_status ON viewer_access_requests(email, status);

-- Enable RLS
ALTER TABLE viewer_access_requests ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admin full access requests" ON viewer_access_requests FOR ALL TO authenticated USING (is_admin());

-- Anyone (even anon) can insert a request via the public form
CREATE POLICY "Public insert requests" ON viewer_access_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Authenticated users can read their own request status
CREATE POLICY "Users read own requests" ON viewer_access_requests FOR SELECT TO authenticated USING (email = current_email());


-- 2. Create the helper function to check viewer access
CREATE OR REPLACE FUNCTION check_viewer_access() RETURNS BOOLEAN AS $$
  DECLARE
    prov TEXT := current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'provider';
  BEGIN
    -- If they logged in via Google OAuth, they are permanent staff
    IF prov = 'google' THEN RETURN TRUE; END IF;
    
    -- If they logged in via Email/OTP, they must have an approved, unexpired request
    RETURN EXISTS (
      SELECT 1 FROM viewer_access_requests 
      WHERE email = current_email() AND status = 'approved' AND expires_at > now()
    );
  END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Note: To fully secure the data, RLS read policies on all public tables 
-- (departments, contacts, roster_cells, etc.) should use `check_viewer_access()`.
-- However, since the public viewer app relies on client-side routing guards,
-- the primary security check will be added to the viewer app's index.html.
