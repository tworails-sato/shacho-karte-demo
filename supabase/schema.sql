create extension if not exists "pgcrypto";

create table if not exists public.respondents (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  name text not null,
  email text not null,
  industry text not null,
  user_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  respondent_id uuid not null references public.respondents(id) on delete cascade,
  answers_json jsonb not null,
  total_score integer not null,
  achievement_rate integer not null,
  category_scores_json jsonb not null,
  top_categories_json jsonb not null,
  low_categories_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  respondent_id uuid not null references public.respondents(id) on delete cascade,
  event_type text not null check (event_type in ('result_viewed', 'cta_clicked')),
  created_at timestamptz not null default now()
);

alter table public.respondents enable row level security;
alter table public.responses enable row level security;
alter table public.events enable row level security;
