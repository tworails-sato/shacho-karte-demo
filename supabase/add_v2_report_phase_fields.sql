alter table public.respondents
  add column if not exists annual_revenue_range text;

alter table public.diagnosis_responses
  add column if not exists management_phase_logic_version text,
  add column if not exists management_phase_adjustment_comment text;

alter table public.feedback_reports
  add column if not exists management_phase_comment text,
  add column if not exists main_style_comment text,
  add column if not exists sub_style_comment text,
  add column if not exists main_style_short_copy text,
  add column if not exists style_strengths_text text,
  add column if not exists style_watchouts_text text,
  add column if not exists style_works_well_text text,
  add column if not exists phase_people_priorities text,
  add column if not exists phase_business_priorities text,
  add column if not exists phase_finance_priorities text,
  add column if not exists growth_ability_comment text,
  add column if not exists show_theme_detail_table boolean not null default false;

create index if not exists diagnosis_responses_management_phase_logic_version_idx
  on public.diagnosis_responses (management_phase_logic_version);
