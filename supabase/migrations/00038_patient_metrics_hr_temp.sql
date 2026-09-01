alter table public.patient_metrics
  add column if not exists heart_rate_bpm integer,
  add column if not exists temperature_c numeric(4,1);
