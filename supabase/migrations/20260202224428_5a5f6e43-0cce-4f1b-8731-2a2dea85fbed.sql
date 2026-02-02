-- Step 1: Add new roles to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';