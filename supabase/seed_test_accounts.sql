-- ============================================================================
-- Seed script: 3 test accounts with realistic history
--   patient.test@gmail.com    (role: patient)
--   user.test@gmail.com       (role: sponsor, sponsors the patient)
--   clinician.test@gmail.com  (role: clinician, treats the patient)
--
-- Password for all three: password
--
-- Paste this whole file into the Supabase SQL editor and run it.
-- Safe to re-run: it deletes any existing rows for these 3 emails first,
-- then recreates everything from scratch.
--
-- Not a numbered migration (supabase/migrations/) on purpose -- this is a
-- one-off dev/QA fixture meant to be run ad hoc from the SQL editor, not
-- applied via `supabase db push`.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- STEP 0: Clean up any existing seed accounts.
--
-- Deleted in patient -> sponsor -> clinician order deliberately: several
-- tables (appointments, patient_metrics, follow_ups, patient_conditions,
-- medications, lab_results, patient_status_updates) reference the clinician
-- via ON DELETE RESTRICT, but reference the patient via ON DELETE CASCADE.
-- Deleting the patient first cascades away every row that would otherwise
-- block deleting the clinician afterward.
-- ----------------------------------------------------------------------------

do $$
declare
  v_patient_id uuid;
  v_sponsor_id uuid;
  v_clinician_id uuid;
begin
  select id into v_patient_id from auth.users where email = 'patient.test@gmail.com';
  select id into v_sponsor_id from auth.users where email = 'user.test@gmail.com';
  select id into v_clinician_id from auth.users where email = 'clinician.test@gmail.com';

  if v_patient_id is not null then
    delete from auth.users where id = v_patient_id;
  end if;

  if v_sponsor_id is not null then
    delete from auth.users where id = v_sponsor_id;
  end if;

  if v_clinician_id is not null then
    delete from auth.users where id = v_clinician_id;
  end if;

  -- Not linked to auth.users by FK, so it survives user deletion and needs
  -- its own cleanup.
  delete from public.clinician_signup_requests where email = 'clinician.test@gmail.com';
end $$;

-- ----------------------------------------------------------------------------
-- STEP 1: Create the three accounts and all seeded history.
-- ----------------------------------------------------------------------------

do $$
declare
  v_patient_id   uuid := gen_random_uuid();
  v_sponsor_id   uuid := gen_random_uuid();
  v_clinician_id uuid := gen_random_uuid();

  v_care_plan_id        uuid;
  v_consent_request_id  uuid := gen_random_uuid();
  v_wallet_id           uuid;

  -- Past visits (oldest to most recent).
  v_appt_1 uuid := gen_random_uuid(); -- 90d ago, completed, wellness_check
  v_appt_2 uuid := gen_random_uuid(); -- 75d ago, completed, vitals
  v_appt_3 uuid := gen_random_uuid(); -- 60d ago, no_show
  v_appt_4 uuid := gen_random_uuid(); -- 45d ago, completed, chronic_lab (labs drawn)
  v_appt_5 uuid := gen_random_uuid(); -- 30d ago, completed, vitals
  v_appt_6 uuid := gen_random_uuid(); -- 15d ago, completed, follow_up discussion
  -- Upcoming visits.
  v_appt_7 uuid := gen_random_uuid(); -- +7d, scheduled
  v_appt_8 uuid := gen_random_uuid(); -- +30d, scheduled

  v_encrypted_password text := crypt('password', gen_salt('bf'));
begin
  -- ---- auth.users -----------------------------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current
  ) values
  (
    '00000000-0000-0000-0000-000000000000', v_patient_id, 'authenticated', 'authenticated',
    'patient.test@gmail.com', v_encrypted_password, now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'role', 'patient',
      'full_name', 'Patricia Testpatient',
      'phone', '+18765550101',
      'date_of_birth', '1958-04-12',
      'parish', 'Kingston'
    ),
    now(), now(), '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000', v_sponsor_id, 'authenticated', 'authenticated',
    'user.test@gmail.com', v_encrypted_password, now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'role', 'sponsor',
      'full_name', 'Samuel Testsponsor',
      'phone', '+18765550102',
      'organisation', 'Testsponsor Family'
    ),
    now(), now(), '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000', v_clinician_id, 'authenticated', 'authenticated',
    'clinician.test@gmail.com', v_encrypted_password, now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'role', 'clinician',
      'full_name', 'Dr. Clara Testclinician',
      'phone', '+18765550103',
      'organisation', 'Island Echoes Clinic'
    ),
    now(), now(), '', '', '', '', ''
  );

  -- ---- auth.identities (required for email/password sign-in) ----------
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values
  (
    gen_random_uuid(), v_patient_id, v_patient_id::text,
    jsonb_build_object('sub', v_patient_id::text, 'email', 'patient.test@gmail.com', 'email_verified', true),
    'email', now(), now(), now()
  ),
  (
    gen_random_uuid(), v_sponsor_id, v_sponsor_id::text,
    jsonb_build_object('sub', v_sponsor_id::text, 'email', 'user.test@gmail.com', 'email_verified', true),
    'email', now(), now(), now()
  ),
  (
    gen_random_uuid(), v_clinician_id, v_clinician_id::text,
    jsonb_build_object('sub', v_clinician_id::text, 'email', 'clinician.test@gmail.com', 'email_verified', true),
    'email', now(), now(), now()
  );

  -- `profiles` rows for all three are created automatically by the
  -- on_auth_user_created trigger (handle_new_user), which reads role,
  -- full_name, phone, date_of_birth, organisation and parish straight out
  -- of raw_user_meta_data above -- no manual insert/update needed here.

  -- ---- Sponsorship link -------------------------------------------------
  select id into v_care_plan_id from public.care_plans where slug = 'sponsorship';

  insert into public.sponsorship_consent_requests (
    id, sponsor_id, patient_email, patient_id, care_plan_id,
    status, payment_simulated_at, created_at, responded_at
  ) values (
    v_consent_request_id, v_sponsor_id, 'patient.test@gmail.com', v_patient_id, v_care_plan_id,
    'accepted', now() - interval '95 days', now() - interval '96 days', now() - interval '95 days'
  );

  insert into public.sponsor_patient_plans (
    sponsor_id, patient_id, care_plan_id, consent_request_id, started_at
  ) values (
    v_sponsor_id, v_patient_id, v_care_plan_id, v_consent_request_id, now() - interval '95 days'
  );

  -- ---- Wallet -------------------------------------------------------------
  insert into public.patient_wallets (patient_id) values (v_patient_id)
  returning id into v_wallet_id;

  perform public.credit_wallet_topup(v_wallet_id, 20000, v_sponsor_id, 'seed-pi-0001');
  perform public.credit_wallet_topup(v_wallet_id, 15000, v_sponsor_id, 'seed-pi-0002');

  -- ---- Appointments ---------------------------------------------------
  insert into public.appointments (
    id, patient_id, clinician_id, scheduled_at, status, appointment_type, patient_notes
  ) values
  (v_appt_1, v_patient_id, v_clinician_id, now() - interval '90 days', 'completed', 'wellness_check', 'Routine wellness check-in.'),
  (v_appt_2, v_patient_id, v_clinician_id, now() - interval '75 days', 'completed', 'vitals', 'Follow-up on blood pressure.'),
  (v_appt_3, v_patient_id, v_clinician_id, now() - interval '60 days', 'no_show', 'vitals', null),
  (v_appt_4, v_patient_id, v_clinician_id, now() - interval '45 days', 'completed', 'chronic_lab', 'Quarterly labs for diabetes management.'),
  (v_appt_5, v_patient_id, v_clinician_id, now() - interval '30 days', 'completed', 'vitals', 'Blood pressure and weight check.'),
  (v_appt_6, v_patient_id, v_clinician_id, now() - interval '15 days', 'completed', 'follow_up', 'Discussed medication adherence.'),
  (v_appt_7, v_patient_id, v_clinician_id, now() + interval '7 days', 'scheduled', 'wellness_check', null),
  (v_appt_8, v_patient_id, v_clinician_id, now() + interval '30 days', 'scheduled', 'chronic_lab', null);

  -- ---- Appointment services ---------------------------------------------
  insert into public.appointment_services (appointment_id, service_type, details) values
  (v_appt_1, 'wellness_check', 'General wellness assessment'),
  (v_appt_2, 'vitals', 'Blood pressure and weight recorded'),
  (v_appt_4, 'chronic_lab', 'Lipid panel and metabolic panel drawn'),
  (v_appt_5, 'vitals', 'Blood pressure, weight, and heart rate recorded'),
  (v_appt_6, 'follow_up', 'Reviewed medication adherence and follow-up plan');

  -- ---- Appointment notes --------------------------------------------------
  insert into public.appointment_notes (appointment_id, content, note_type, flag_for_follow_up, created_by) values
  (v_appt_1, 'Patient reports feeling well overall. Encouraged continued monitoring of blood pressure at home.', 'general', false, v_clinician_id),
  (v_appt_4, 'Labs drawn for quarterly diabetes management review. Results pending discussion at next visit.', 'clinical_summary', false, v_clinician_id),
  (v_appt_6, 'Patient adherence to Metformin has improved. Discussed lifestyle changes. Recommend follow-up in 2 weeks to confirm trend.', 'clinical_summary', true, v_clinician_id),
  (v_appt_6, 'Internal note: coordinate with pharmacy on refill timing.', 'coordination', false, v_clinician_id);

  -- ---- Patient metrics (one per completed appointment, trending better) ---
  insert into public.patient_metrics (
    patient_id, appointment_id, recorded_by, recorded_at,
    blood_pressure_systolic, blood_pressure_diastolic, weight_kg, a1c,
    heart_rate_bpm, temperature_c, medication_adherence
  ) values
  (v_patient_id, v_appt_1, v_clinician_id, now() - interval '90 days', 150, 95, 82.5, 7.8, 78, 36.8, 'fair'),
  (v_patient_id, v_appt_2, v_clinician_id, now() - interval '75 days', 145, 92, 81.8, 7.6, 76, 36.7, 'fair'),
  (v_patient_id, v_appt_4, v_clinician_id, now() - interval '45 days', 138, 88, 81.0, 7.3, 74, 36.6, 'good'),
  (v_patient_id, v_appt_5, v_clinician_id, now() - interval '30 days', 130, 85, 80.4, 7.1, 75, 36.7, 'good'),
  (v_patient_id, v_appt_6, v_clinician_id, now() - interval '15 days', 128, 82, 79.9, 6.9, 72, 36.6, 'good');

  -- ---- Conditions & allergies ---------------------------------------------
  insert into public.patient_conditions (patient_id, label, type, severity, created_by) values
  (v_patient_id, 'Type 2 Diabetes', 'condition', null, v_clinician_id),
  (v_patient_id, 'Hypertension', 'condition', null, v_clinician_id),
  (v_patient_id, 'Penicillin', 'allergy', 'moderate', v_clinician_id);

  -- ---- Medications ---------------------------------------------------------
  insert into public.medications (
    patient_id, name, dosage, frequency, prescribed_by, started_at, ended_at, notes, created_by
  ) values
  (v_patient_id, 'Metformin', '500mg', 'Twice daily', 'Dr. Clara Testclinician', current_date - interval '90 days', null, 'For type 2 diabetes management.', v_clinician_id),
  (v_patient_id, 'Lisinopril', '10mg', 'Once daily', 'Dr. Clara Testclinician', current_date - interval '90 days', null, 'For hypertension.', v_clinician_id),
  (v_patient_id, 'Amoxicillin', '500mg', 'Three times daily', 'Dr. Clara Testclinician', current_date - interval '75 days', current_date - interval '68 days', 'Course completed for respiratory infection.', v_clinician_id);

  -- ---- Lab results (drawn at the chronic_lab visit) -----------------------
  insert into public.lab_results (
    patient_id, panel_type, test_name, value, unit, reference_low, reference_high, drawn_at, created_by
  ) values
  (v_patient_id, 'lipid_panel', 'LDL', 128, 'mg/dL', 0, 100, current_date - interval '45 days', v_clinician_id),
  (v_patient_id, 'lipid_panel', 'HDL', 48, 'mg/dL', 40, 60, current_date - interval '45 days', v_clinician_id),
  (v_patient_id, 'lipid_panel', 'Triglycerides', 165, 'mg/dL', 0, 150, current_date - interval '45 days', v_clinician_id),
  (v_patient_id, 'metabolic_panel', 'Fasting Glucose', 132, 'mg/dL', 70, 99, current_date - interval '45 days', v_clinician_id),
  (v_patient_id, 'metabolic_panel', 'Creatinine', 0.9, 'mg/dL', 0.6, 1.3, current_date - interval '45 days', v_clinician_id);

  -- ---- Follow-up task --------------------------------------------------
  insert into public.follow_ups (patient_id, clinician_id, appointment_id, due_date, status, notes) values
  (v_patient_id, v_clinician_id, v_appt_6, current_date + interval '10 days', 'pending', 'Confirm sustained medication adherence and recheck blood pressure.');

  -- ---- Patient status updates (mixed visibility) ---------------------------
  insert into public.patient_status_updates (patient_id, created_by, status_text, visibility, created_at) values
  (v_patient_id, v_clinician_id, 'Patricia had a great check-in today -- blood pressure trending down and she is feeling well.', 'all', now() - interval '30 days'),
  (v_patient_id, v_clinician_id, 'Reminder: next quarterly labs are scheduled for the end of the month.', 'sponsor_only', now() - interval '15 days'),
  (v_patient_id, v_clinician_id, 'Discussed a sensitive personal matter with the patient during today''s visit.', 'patient_only', now() - interval '15 days');

  -- ---- Notifications ---------------------------------------------------
  insert into public.notifications (user_id, type, title, body, reference_id, created_at) values
  (v_patient_id, 'visit_update', 'Visit summary available', 'Your clinician added notes from your last visit.', v_appt_6, now() - interval '15 days'),
  (v_patient_id, 'follow_up_due', 'Follow-up coming up', 'You have a follow-up due in 10 days.', v_appt_6, now() - interval '1 days'),
  (v_sponsor_id, 'sponsorship_accepted', 'Sponsorship confirmed', 'Patricia Testpatient has accepted your sponsorship.', v_patient_id, now() - interval '95 days'),
  (v_sponsor_id, 'visit_update', 'New visit summary', 'A new visit summary is available for Patricia.', v_appt_6, now() - interval '15 days');

  -- ---- Clinician signup request (for realism / admin-portal history) ----
  insert into public.clinician_signup_requests (
    email, full_name, license_number, specialty, institution_or_clinic_name, license_image_path, status, reviewed_at
  ) values (
    'clinician.test@gmail.com', 'Dr. Clara Testclinician', 'LIC-TEST-00123', 'Family Medicine',
    'Island Echoes Clinic', 'seed/placeholder-license.pdf', 'approved', now() - interval '100 days'
  );
end $$;

commit;

-- ----------------------------------------------------------------------------
-- Verification (run after the script completes):
--
--   select p.role, p.full_name, u.email
--   from public.profiles p join auth.users u on u.id = p.id
--   where u.email in ('patient.test@gmail.com','user.test@gmail.com','clinician.test@gmail.com');
--
--   select balance_cents from public.patient_wallets pw
--   join public.profiles p on p.id = pw.patient_id
--   join auth.users u on u.id = p.id where u.email = 'patient.test@gmail.com';
-- ----------------------------------------------------------------------------
