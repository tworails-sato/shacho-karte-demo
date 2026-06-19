alter table diagnosis_responses add column if not exists is_demo boolean not null default true;
alter table diagnosis_responses add column if not exists watermark_enabled boolean not null default true;
alter table diagnosis_responses add column if not exists watermark_text text not null default 'DEMO｜社長カルテ';
alter table diagnosis_responses add column if not exists copyright_enabled boolean not null default true;
alter table diagnosis_responses add column if not exists copyright_text text not null default '© Two rails';
alter table diagnosis_responses add column if not exists commercial_use_allowed boolean not null default false;
alter table diagnosis_responses add column if not exists resubmission_allowed boolean not null default false;
alter table diagnosis_responses add column if not exists usage_purpose text;
alter table diagnosis_responses add column if not exists updated_at timestamptz not null default now();

create index if not exists diagnosis_responses_email_demo_created_idx
  on diagnosis_responses (email_normalized, is_demo, created_at desc);
