alter table public.diagnosis_responses
  add column if not exists reminder_1_sent_at timestamptz,
  add column if not exists reminder_2_sent_at timestamptz,
  add column if not exists reminder_3_sent_at timestamptz,
  add column if not exists manual_reminder_sent_at timestamptz,
  add column if not exists manual_reminder_count integer not null default 0;

create index if not exists diagnosis_responses_draft_reminder_idx
  on public.diagnosis_responses (status, updated_at, expires_at)
  where status = 'draft';

create index if not exists diagnosis_responses_reminder_1_sent_idx
  on public.diagnosis_responses (reminder_1_sent_at);

create index if not exists diagnosis_responses_reminder_2_sent_idx
  on public.diagnosis_responses (reminder_2_sent_at);

create index if not exists diagnosis_responses_reminder_3_sent_idx
  on public.diagnosis_responses (reminder_3_sent_at);
