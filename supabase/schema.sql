create extension if not exists "pgcrypto";

create table if not exists public.respondents (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  name text not null,
  email text not null,
  industry text not null,
  employee_size text,
  annual_revenue_range text,
  founding_years text,
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
  main_management_style_key text,
  sub_management_style_key text,
  management_style_scores jsonb,
  style_logic_version text,
  management_phase_key text,
  management_phase_label text,
  management_phase_logic_version text,
  management_phase_adjustment_comment text,
  v2_calculated_at timestamptz,
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
  answered_count integer not null default 48,
  completion_rate numeric not null default 100,
  last_answered_question_id text,
  last_answered_question_order integer not null default 0,
  started_at timestamptz,
  expires_at timestamptz,
  completed_at timestamptz,
  resume_key_hash text,
  resume_token text,
  resume_mail_sent_at timestamptz,
  resume_mail_error text,
  reminder_1_sent_at timestamptz,
  reminder_2_sent_at timestamptz,
  reminder_3_sent_at timestamptz,
  manual_reminder_sent_at timestamptz,
  manual_reminder_count integer not null default 0,
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
  management_phase_comment text,
  main_style_comment text,
  sub_style_comment text,
  main_style_short_copy text,
  style_strengths_text text,
  style_watchouts_text text,
  style_works_well_text text,
  phase_people_priorities text,
  phase_business_priorities text,
  phase_finance_priorities text,
  growth_ability_comment text,
  show_theme_detail_table boolean not null default false,
  roadmap_3_months text,
  roadmap_12_months text,
  feedback_discussion_points text,
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

create unique index if not exists diagnosis_responses_resume_token_uidx
  on public.diagnosis_responses (resume_token)
  where resume_token is not null;

create index if not exists diagnosis_responses_resume_mail_sent_idx
  on public.diagnosis_responses (resume_mail_sent_at);

create index if not exists diagnosis_responses_draft_reminder_idx
  on public.diagnosis_responses (status, updated_at, expires_at)
  where status = 'draft';

create index if not exists diagnosis_responses_main_management_style_idx
  on public.diagnosis_responses (main_management_style_key);

create index if not exists diagnosis_responses_management_phase_idx
  on public.diagnosis_responses (management_phase_key);

create index if not exists diagnosis_responses_reminder_1_sent_idx
  on public.diagnosis_responses (reminder_1_sent_at);

create index if not exists diagnosis_responses_reminder_2_sent_idx
  on public.diagnosis_responses (reminder_2_sent_at);

create index if not exists diagnosis_responses_reminder_3_sent_idx
  on public.diagnosis_responses (reminder_3_sent_at);

create index if not exists feedback_reports_response_id_idx
  on public.feedback_reports (response_id);

alter table public.respondents enable row level security;
alter table public.diagnosis_responses enable row level security;
alter table public.diagnosis_events enable row level security;
alter table public.feedback_reports enable row level security;
