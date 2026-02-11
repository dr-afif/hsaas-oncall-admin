-- sql/08_maintenance.sql
-- Enable the pg_cron extension if not already enabled
-- Note: In Supabase, pg_cron is usually enabled via the dashboard, 
-- but we can try enabling it here.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a maintenance function to delete old audit logs
CREATE OR REPLACE FUNCTION public.prune_audit_logs(retention_days INT DEFAULT 90)
RETURNS void AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.audit_log
    WHERE ts < (NOW() - (retention_days || ' days')::interval);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Pruned % audit log entries older than % days.', deleted_count, retention_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cleanup to run every day at 3:00 AM (server time)
-- We use 90 days as the default retention for the Free Tier.
SELECT cron.schedule(
    'daily-audit-prune', -- name of the cron job
    '0 3 * * *',         -- every day at 3 AM
    'SELECT public.prune_audit_logs(90)'
);
