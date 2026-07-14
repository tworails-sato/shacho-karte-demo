alter table public.diagnosis_responses
add column if not exists status text not null default 'completed',
add column if not exists progress_rate numeric not null default 100,
add column if not exists last_answered_question_id text,
add column if not exists last_answered_question_order integer not null default 0,
add column if not exists expires_at timestamptz,
add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'diagnosis_responses_status_check'
  ) then
    alter table public.diagnosis_responses
    add constraint diagnosis_responses_status_check
    check (status in ('draft', 'completed'));
  end if;
end $$;

create index if not exists diagnosis_responses_status_idx
  on public.diagnosis_responses (status);

create index if not exists diagnosis_responses_draft_email_idx
  on public.diagnosis_responses (email_normalized, status, updated_at);

create index if not exists diagnosis_responses_expires_at_idx
  on public.diagnosis_responses (expires_at);
