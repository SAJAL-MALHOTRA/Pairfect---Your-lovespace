-- Migration v38: Cashfree Payments Schema & RLS Lockdown
-- Creates payments table and secures it with strict Row Level Security.

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    payment_session_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
    gateway TEXT NOT NULL DEFAULT 'cashfree',
    customer_phone TEXT,
    customer_email TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 1. SELECT policy: authenticated users can only view their own payment records
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
    ON public.payments FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- 2. INSERT / UPDATE / DELETE are NOT granted to authenticated or anon roles.
-- In PostgreSQL RLS, withholding INSERT/UPDATE/DELETE policies prevents clients from writing/tampering with payments.
-- Only the backend server using the Supabase Service Role client can write to this table.

NOTIFY pgrst, 'reload schema';
