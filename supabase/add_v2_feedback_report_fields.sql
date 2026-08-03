alter table public.respondents
  add column if not exists annual_revenue_range text,
  add column if not exists founding_years text;

alter table public.feedback_reports
  add column if not exists management_phase_comment text,
  add column if not exists main_style_comment text,
  add column if not exists sub_style_comment text,
  add column if not exists style_strengths_text text,
  add column if not exists style_watchouts_text text,
  add column if not exists style_works_well_text text,
  add column if not exists growth_ability_comment text;

create index if not exists feedback_reports_response_id_idx
  on public.feedback_reports (response_id);
