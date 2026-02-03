-- Fix: Remove INSERT policy from login_attempts table
-- Login attempts should ONLY be logged via the log-login-attempt edge function
-- which uses service role credentials

DROP POLICY IF EXISTS "Authenticated users can insert login attempts" ON public.login_attempts;

-- No new INSERT policy needed - the edge function uses service role which bypasses RLS