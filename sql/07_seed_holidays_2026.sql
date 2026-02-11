-- 07_seed_holidays_2026.sql

-- Clear existing 2026 holidays if any (optional, be careful)
-- DELETE FROM public_holidays WHERE date >= '2026-01-01' AND date <= '2026-12-31';

INSERT INTO public_holidays (date, name, is_state_holiday) VALUES
('2026-01-01', 'New Year''s Day', false),
('2026-02-01', 'Thaipusam', true),
('2026-02-02', 'Thaipusam Holiday', true),
('2026-02-17', 'Chinese New Year', false),
('2026-02-18', 'Chinese New Year Day 2', false),
('2026-03-07', 'Nuzul Al-Quran', true),
('2026-03-21', 'Hari Raya Aidilfitri', false),
('2026-03-22', 'Hari Raya Aidilfitri Day 2', false),
('2026-03-23', 'Hari Raya Aidilfitri Holiday', false),
('2026-05-01', 'Labour Day', false),
('2026-05-27', 'Hari Raya Haji', false),
('2026-05-31', 'Wesak Day', false),
('2026-06-01', 'Agong''s Birthday', false),
('2026-06-17', 'Awal Muharram', false),
('2026-08-25', 'Prophet Muhammad''s Birthday', false),
('2026-08-31', 'National Day', false),
('2026-09-16', 'Malaysia Day', false),
('2026-11-08', 'Deepavali', false),
('2026-11-09', 'Deepavali Holiday', false),
('2026-12-11', 'Sultan of Selangor''s Birthday', true),
('2026-12-25', 'Christmas Day', false)
ON CONFLICT (date) DO UPDATE SET name = EXCLUDED.name, is_state_holiday = EXCLUDED.is_state_holiday;
