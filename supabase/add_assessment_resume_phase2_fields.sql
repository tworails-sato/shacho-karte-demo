alter table public.diagnosis_responses
  add column if not exists status text not null default 'completed',
  add column if not exists progress_rate numeric not null default 100,
  add column if not exists answered_count integer not null default 48,
  add column if not exists completion_rate numeric not null default 100,
  add column if not exists last_answered_question_id text,
  add column if not exists last_answered_question_order integer not null default 0,
  add column if not exists started_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists resume_key_hash text,
  add column if not exists resume_token text,
  add column if not exists resume_mail_sent_at timestamptz,
  add column if not exists resume_mail_error text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'diagnosis_responses_status_check'
      and conrelid = 'public.diagnosis_responses'::regclass
  ) then
    alter table public.diagnosis_responses
      add constraint diagnosis_responses_status_check
      check (status in ('draft', 'completed'));
  end if;
end $$;

update public.diagnosis_responses
set
  status = coalesce(status, 'completed'),
  progress_rate = coalesce(progress_rate, 100),
  answered_count = coalesce(answered_count, 48),
  completion_rate = coalesce(completion_rate, 100),
  last_answered_question_order = coalesce(last_answered_question_order, 48),
  started_at = coalesce(started_at, created_at),
  completed_at = case
    when status = 'completed' then coalesce(completed_at, created_at)
    else completed_at
  end,
  updated_at = coalesce(updated_at, created_at);

create unique index if not exists diagnosis_responses_resume_token_uidx
  on public.diagnosis_responses (resume_token)
  where resume_token is not null;

create index if not exists diagnosis_responses_status_idx
  on public.diagnosis_responses (status);

create index if not exists diagnosis_responses_draft_email_idx
  on public.diagnosis_responses (email_normalized, status, updated_at);

create index if not exists diagnosis_responses_expires_at_idx
  on public.diagnosis_responses (expires_at);

create index if not exists diagnosis_responses_resume_mail_sent_idx
  on public.diagnosis_responses (resume_mail_sent_at);
