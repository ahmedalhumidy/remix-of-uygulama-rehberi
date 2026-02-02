-- Add reports.view permission
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'reports.view';