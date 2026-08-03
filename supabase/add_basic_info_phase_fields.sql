alter table public.respondents
  add column if not exists employee_size text,
  add column if not exists founding_years text,
  add column if not exists annual_revenue_range text;
