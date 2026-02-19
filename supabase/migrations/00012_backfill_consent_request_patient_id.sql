-- Backfill patient_id on sponsorship_consent_requests when a new user signs up (email match)
create or replace function public.backfill_consent_request_patient_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.sponsorship_consent_requests
  set patient_id = NEW.id
  where lower(trim(patient_email)) = lower(trim(NEW.email))
    and status = 'pending'
    and patient_id is null;
  return NEW;
end;
$$;

-- Trigger on auth.users after insert (runs when new user is created)
create trigger on_auth_user_created_backfill_consent
  after insert on auth.users
  for each row execute procedure public.backfill_consent_request_patient_id();
