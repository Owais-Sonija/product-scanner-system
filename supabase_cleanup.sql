-- BACKEND LIMITS via Supabase SQL
-- Run this in SQL Editor in Supabase to auto-clean old logs

CREATE OR REPLACE FUNCTION cleanup_old_confirmation_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  log_count INT;
BEGIN
  -- Check total count
  SELECT count(*) INTO log_count FROM confirmation_logs;
  
  -- If over 200, delete the oldest 50
  IF log_count > 200 THEN
    DELETE FROM confirmation_logs
    WHERE id IN (
      SELECT id FROM confirmation_logs
      ORDER BY created_at ASC
      LIMIT 50
    );
  END IF;
END;
$$;

-- You could use pg_cron if enabled in your project:
-- SELECT cron.schedule('cleanup_logs_job', '0 0 * * *', 'SELECT cleanup_old_confirmation_logs();');
