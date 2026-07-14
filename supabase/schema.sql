create extension if not exists "pgcrypto";

create table if not exists public.respondents (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  name text not null,
  email text not null,
  industry text not null,
  employee_size text,
  user_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.diagnosis_responses (
  id uuid primary key default gen_random_uuid(),
  respondent_id uuid not null references public.respondents(id) on delete cascade,
  answers_json jsonb not null,
  total_score integer not null,
  achievement_rate integer not null,
  category_scores_json jsonb not null,
  top_categories_json jsonb not null,
  low_categories_json jsonb not null,
  priority_categories_json jsonb not null,
  email text,
  email_normalized text,
  traffic_source text,
  referrer_name text,
  referrer_company text,
  referrer_email text,
  consent_agreed boolean not null default false,
  consent_agreed_at timestamptz,
  ip_hash text,
  user_agent text,
  result_token text unique,
  result_token_expires_at timestamptz,
  result_view_count integer not null default 0,
  result_last_viewed_at timestamptz,
  participant_email_sent_at timestamptz,
  participant_email_error text,
  is_demo boolean not null default true,
  watermark_enabled boolean not null default true,
  watermark_text text not null default 'DEMO｜社長カルテ',
  copyright_enabled boolean not null default true,
  copyright_text text not null default '© Two rails',
  commercial_use_allowed boolean not null default false,
  resubmission_allowed boolean not null default false,
  usage_purpose text,
  status text not null default 'completed' check (status in ('draft', 'completed')),
  progress_rate numeric not null default 100,
  last_answered_question_id text,
  last_answered_question_order integer not null default 0,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.diagnosis_events (
  id uuid primary key default gen_random_uuid(),
  respondent_id uuid not null references public.respondents(id) on delete cascade,
  event_type text not null check (event_type in ('cta_clicked')),
  created_at timestamptz not null default now()
);

create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null unique references public.diagnosis_responses(id) on delete cascade,
  one_line_summary text,
  summary text,
  executive_type text,
  psychological_tendency text,
  strength text,
  gap text,
  short_term_action text,
  mid_long_term_action text,
  advisor_use_case text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists diagnosis_responses_result_token_idx
  on public.diagnosis_responses (result_token);

create index if not exists diagnosis_responses_status_idx
  on public.diagnosis_responses (status);

create index if not exists diagnosis_responses_draft_email_idx
  on public.diagnosis_responses (email_normalized, status, updated_at);

create index if not exists diagnosis_responses_expires_at_idx
  on public.diagnosis_responses (expires_at);

create index if not exists feedback_reports_response_id_idx
  on public.feedback_reports (response_id);

alter table public.respondents enable row level security;
alter table public.diagnosis_responses enable row level security;
alter table public.diagnosis_events enable row level security;
alter table public.feedback_reports enable row level security;
