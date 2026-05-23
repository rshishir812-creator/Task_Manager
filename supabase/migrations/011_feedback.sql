-- Feedback ("Contact us") from parents to the super admin.
-- Submitter's email + name are denormalised so the row stays readable
-- even if the user is later deleted.

create table if not exists public.feedback (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  user_email    text not null,
  user_name     text,
  subject       text not null check (char_length(subject) between 1 and 160),
  message       text not null check (char_length(message) between 1 and 4000),
  status        text not null default 'new'
                  check (status in ('new','in_progress','resolved','archived')),
  admin_note    text,
  reviewed_by   uuid references public.profiles(id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_feedback_status_created
  on public.feedback (status, created_at desc);
create index if not exists idx_feedback_family
  on public.feedback (family_id);

alter table public.feedback enable row level security;

-- Any authenticated user can insert their own feedback row.
drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback
  for insert with check (auth.uid() = user_id);

-- Only super admins can read.
drop policy if exists "feedback_select_super" on public.feedback;
create policy "feedback_select_super" on public.feedback
  for select using (public.is_super_admin());

-- Only super admins can update (status / admin_note).
drop policy if exists "feedback_update_super" on public.feedback;
create policy "feedback_update_super" on public.feedback
  for update using (public.is_super_admin());
