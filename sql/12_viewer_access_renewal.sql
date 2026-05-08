-- 12_viewer_access_renewal.sql
-- Run this in the Supabase SQL editor to enable the renewal flow.

-- Allow authenticated users to update THEIR OWN expired request back to pending.
-- Security: 
--   USING clause ensures they can only touch rows where the email matches their JWT email 
--   AND the current status is 'approved' (expired ones — expires_at check is in app logic).
--   WITH CHECK ensures they can only set status back to 'pending', not grant themselves access.
CREATE POLICY "Users can request renewal"
  ON viewer_access_requests
  FOR UPDATE
  TO authenticated
  USING (
    email = current_email()
    AND status = 'approved'     -- Only their own approved (but expired) rows
  )
  WITH CHECK (
    email = current_email()
    AND status = 'pending'      -- They can only set it back to pending
    AND expires_at IS NULL      -- Must clear the expiry date
    AND approved_at IS NULL     -- Must clear approval timestamp
    AND approved_by IS NULL     -- Must clear approver name
  );
