-- ============================================================================
-- Josan Logistics Driver App - Driver Login Audit Logs
-- Migration: 20261119_driver_audit_logs.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.driver_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    identifier VARCHAR(255),
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    error_category VARCHAR(64),
    error_summary TEXT,
    platform VARCHAR(32),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for querying audit trails by driver or time
CREATE INDEX IF NOT EXISTS idx_driver_audit_driver_id ON public.driver_audit_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_audit_identifier ON public.driver_audit_logs(identifier);
CREATE INDEX IF NOT EXISTS idx_driver_audit_created_at ON public.driver_audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.driver_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous/authenticated inserts from the driver app
CREATE POLICY "Allow app to insert driver audit logs"
    ON public.driver_audit_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only dispatch administrators / service role can view audit logs
CREATE POLICY "Dispatch admins view driver audit logs"
    ON public.driver_audit_logs
    FOR SELECT
    TO service_role
    USING (true);

