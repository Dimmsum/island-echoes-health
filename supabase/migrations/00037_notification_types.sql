-- M5.1: Notification coverage for the follow-up and patient-status-update features.
--
-- Both shipped in the late-June web push without any notification wiring: a clinician could
-- schedule a follow-up or post a status update and the patient would only find out by opening
-- the app. This adds the enum values the API needs to notify them.
--
--   * follow_up_due         -> patient, when a follow-up is created and again on its due date
--   * follow_up_overdue     -> owning clinician, for a pending follow-up past its due date
--   * patient_status_update -> patient and/or linked sponsors, per the row's visibility
--
-- Design note: this file intentionally contains nothing but the enum additions.
-- `alter type ... add value` cannot be followed by a statement that *uses* the new value in the
-- same transaction, so any index or constraint referencing these literals would fail here.
-- Deduplication of the recurring reminder notifications therefore lives in application code
-- (see createNotificationOnce in api/src/lib/notifications.ts).

alter type public.notification_type add value if not exists 'follow_up_due';
alter type public.notification_type add value if not exists 'follow_up_overdue';
alter type public.notification_type add value if not exists 'patient_status_update';
