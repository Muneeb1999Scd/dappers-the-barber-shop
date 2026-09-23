-- =========================================================================
-- DAPPERS | THE GENTLEMAN CHOICE - SUPABASE SCHEMA
-- Project Ref: kpgpxokcsumjtpyrhlxr
-- Copy and run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kpgpxokcsumjtpyrhlxr/sql
-- =========================================================================

-- 1. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    booking_reference TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    service_id TEXT,
    service_title TEXT,
    package_id TEXT,
    staff_id TEXT,
    staff_name TEXT,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration INTEGER DEFAULT 45,
    price NUMERIC DEFAULT 1200,
    notes TEXT,
    status TEXT DEFAULT 'Confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    notes TEXT,
    total_appointments INTEGER DEFAULT 1,
    last_appointment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS Policies to allow public booking form to insert & read appointments
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;
CREATE POLICY "Public can insert appointments"
ON public.appointments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can select appointments" ON public.appointments;
CREATE POLICY "Public can select appointments"
ON public.appointments FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can update appointments" ON public.appointments;
CREATE POLICY "Public can update appointments"
ON public.appointments FOR UPDATE
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can insert customers" ON public.customers;
CREATE POLICY "Public can insert customers"
ON public.customers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can select customers" ON public.customers;
CREATE POLICY "Public can select customers"
ON public.customers FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can update customers" ON public.customers;
CREATE POLICY "Public can update customers"
ON public.customers FOR UPDATE
TO anon, authenticated
USING (true);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_ref ON public.appointments(booking_reference);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
