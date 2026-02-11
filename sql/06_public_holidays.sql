-- 06_public_holidays.sql

CREATE TABLE public_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_state_holiday BOOLEAN DEFAULT false, -- True if specific to Selangor
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public_holidays ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public holidays are viewable by everyone" 
ON public_holidays FOR SELECT USING (true);

CREATE POLICY "Public holidays are manageable by admins" 
ON public_holidays FOR ALL USING (
    EXISTS (
        SELECT 1 FROM department_members 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'ADMIN'
    )
);
