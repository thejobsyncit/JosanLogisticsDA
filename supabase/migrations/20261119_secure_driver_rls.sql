-- ============================================================================
-- MIGRATION: Secure Row Level Security (RLS) for Josan Logistics Driver App
-- File: supabase/migrations/20261119_secure_driver_rls.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECURITY AUDIT FINDINGS:
-- The 2 existing policies on public.drivers were severely insecure:
--   1. "Allow anon read on drivers" (USING (true)): Exposed the entire driver
--      roster (names, phones, emails, license numbers, vehicles, and passwords)
--      to unauthenticated public callers with the public anon key.
--   2. "Allow authenticated update/insert on drivers" (USING (auth.role() = 'authenticated')):
--      Permitted ANY authenticated user (including non-drivers/customers) to
--      overwrite or insert arbitrary driver rows.
-- ----------------------------------------------------------------------------

-- 1. Helper function to verify Admin / Dispatcher roles
CREATE OR REPLACE FUNCTION public.is_admin_or_dispatcher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'DISPATCHER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Secure public.drivers table
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drop legacy / insecure policies
DROP POLICY IF EXISTS "Allow anon read on drivers" ON public.drivers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.drivers;
DROP POLICY IF EXISTS "Allow public read" ON public.drivers;
DROP POLICY IF EXISTS "Allow authenticated update/insert on drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view own record" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update own record" ON public.drivers;
DROP POLICY IF EXISTS "Admins can insert drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins full access on drivers" ON public.drivers;

-- Drivers can SELECT ONLY their own record; Admins/Dispatchers can view all
CREATE POLICY "Drivers can view own record"
ON public.drivers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin_or_dispatcher()
);

-- Drivers can UPDATE ONLY their own record (e.g. status, vehicle, avatar); Admins can update all
CREATE POLICY "Drivers can update own record"
ON public.drivers
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin_or_dispatcher()
)
WITH CHECK (
  user_id = auth.uid()
  OR public.is_admin_or_dispatcher()
);

-- Only Admins/Dispatchers can INSERT new drivers
CREATE POLICY "Admins can insert drivers"
ON public.drivers
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_or_dispatcher()
);

-- Only Admins/Dispatchers can DELETE drivers
CREATE POLICY "Admins can delete drivers"
ON public.drivers
FOR DELETE
TO authenticated
USING (
  public.is_admin_or_dispatcher()
);


-- ----------------------------------------------------------------------------
-- 3. Secure Driver-Related Tables
-- Accessible only if EXISTS (SELECT 1 FROM drivers WHERE drivers.user_id = auth.uid())
-- ----------------------------------------------------------------------------

-- A. shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Drivers view assigned shipments" ON public.shipments;
DROP POLICY IF EXISTS "Drivers update assigned shipments" ON public.shipments;

CREATE POLICY "Drivers view assigned shipments"
ON public.shipments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers
    WHERE public.drivers.user_id = auth.uid()
      AND public.drivers.id = public.shipments.driver_id
  )
  OR public.is_admin_or_dispatcher()
);

CREATE POLICY "Drivers update assigned shipments"
ON public.shipments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers
    WHERE public.drivers.user_id = auth.uid()
      AND public.drivers.id = public.shipments.driver_id
  )
  OR public.is_admin_or_dispatcher()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.drivers
    WHERE public.drivers.user_id = auth.uid()
      AND public.drivers.id = public.shipments.driver_id
  )
  OR public.is_admin_or_dispatcher()
);

-- B. driver_locations (Telematics stream)
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Drivers insert own telemetry" ON public.driver_locations;
DROP POLICY IF EXISTS "Drivers view own telemetry" ON public.driver_locations;

CREATE POLICY "Drivers insert own telemetry"
ON public.driver_locations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.drivers
    WHERE public.drivers.user_id = auth.uid()
      AND public.drivers.id = public.driver_locations.driver_id
  )
  OR public.is_admin_or_dispatcher()
);

CREATE POLICY "Drivers view own telemetry"
ON public.driver_locations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers
    WHERE public.drivers.user_id = auth.uid()
      AND public.drivers.id = public.driver_locations.driver_id
  )
  OR public.is_admin_or_dispatcher()
);

-- C. proof_of_delivery
ALTER TABLE public.proof_of_delivery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Drivers insert POD" ON public.proof_of_delivery;
DROP POLICY IF EXISTS "Drivers view POD" ON public.proof_of_delivery;

CREATE POLICY "Drivers insert POD"
ON public.proof_of_delivery
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.drivers
    WHERE public.drivers.user_id = auth.uid()
      AND public.drivers.id = public.proof_of_delivery.driver_id
  )
  OR public.is_admin_or_dispatcher()
);

CREATE POLICY "Drivers view POD"
ON public.proof_of_delivery
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers
    WHERE public.drivers.user_id = auth.uid()
      AND public.drivers.id = public.proof_of_delivery.driver_id
  )
  OR public.is_admin_or_dispatcher()
);

-- D. notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;

CREATE POLICY "Users view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()::text
  OR user_id = 'all'
  OR public.is_admin_or_dispatcher()
);

-- E. job_offers & job_offer_responses (if present)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_offers') THEN
    EXECUTE 'ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Drivers view assigned job offers" ON public.job_offers';
    EXECUTE 'CREATE POLICY "Drivers view assigned job offers" ON public.job_offers FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.drivers WHERE public.drivers.user_id = auth.uid() AND public.drivers.id = public.job_offers.driver_id)
      OR public.is_admin_or_dispatcher()
    )';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_offer_responses') THEN
    EXECUTE 'ALTER TABLE public.job_offer_responses ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Drivers insert job offer responses" ON public.job_offer_responses';
    EXECUTE 'CREATE POLICY "Drivers insert job offer responses" ON public.job_offer_responses FOR ALL TO authenticated USING (
      EXISTS (SELECT 1 FROM public.drivers WHERE public.drivers.user_id = auth.uid() AND public.drivers.id = public.job_offer_responses.driver_id)
      OR public.is_admin_or_dispatcher()
    )';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. CLEANUP: Drop legacy plain-text password column (Run AFTER migration verified)
-- ----------------------------------------------------------------------------
-- ALTER TABLE public.drivers DROP COLUMN IF EXISTS password;

