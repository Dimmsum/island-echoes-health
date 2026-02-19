-- Notification type
create type public.notification_type as enum (
  'consent_request',
  'visit_update',
  'no_show_alert',
  'sponsorship_accepted'
);

-- In-app notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  reference_id uuid,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_read_at on public.notifications(read_at) where read_at is null;
create index idx_notifications_created_at on public.notifications(created_at desc);
