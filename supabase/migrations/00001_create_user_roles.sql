-- User role enum for role-based access control
create type public.user_role as enum ('user', 'front_desk', 'clinician');
