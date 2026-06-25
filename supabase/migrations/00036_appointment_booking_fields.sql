ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS appointment_type text,
  ADD COLUMN IF NOT EXISTS patient_notes text;
