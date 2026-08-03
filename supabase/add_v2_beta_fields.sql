alter table public.diagnosis_responses
  add column if not exists main_management_style_key text,
  add column if not exists sub_management_style_key text,
  add column if not exists management_style_scores jsonb,
  add column if not exists style_logic_version text,
  add column if not exists management_phase_key text,
  add column if not exists management_phase_label text,
  add column if not exists v2_calculated_at timestamptz;

alter table public.feedback_reports
  add column if not exists roadmap_3_months text,
  add column if not exists roadmap_12_months text,
  add column if not exists feedback_discussion_points text;

create index if not exists diagnosis_responses_main_management_style_idx
  on public.diagnosis_responses (main_management_style_key);

create index if not exists diagnosis_responses_management_phase_idx
  on public.diagnosis_responses (management_phase_key);
