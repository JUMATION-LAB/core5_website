-- Starter content. Safe to re-run. Replace everything from the admin dashboard.

insert into public.site_settings (key, value) values
  ('home', '{"stat1_value":100,"stat1_label":"Initial healthcare needs","stat2_value":10,"stat2_label":"Shortlisted needs","stat3_value":1,"stat3_label":"Primary need to investigate","stat4_value":5,"stat4_label":"Team members"}'),
  ('screening', jsonb_build_object('criteria', E'Clinical significance | How serious are the consequences for patients?\nUnmet need | How far do current solutions fall short?\nPotential impact | How many people could benefit?\nFeasibility | Can a student team realistically address it?\nAccessibility | Could it be affordable and usable in low-resource settings?\nLocal relevance | Does it matter in Uganda''s healthcare environment?')),
  ('problem', '{}'), ('selected_need', '{"confirmed":false}'), ('innovation', '{}'),
  ('about', '{}'), ('contact', '{}')
on conflict (key) do nothing;

-- Stages: statuses are placeholders. Update them to match real progress.
insert into public.project_stages (kind, position, title, description, status)
select * from (values
  ('journey', 1, 'Problem Identification', 'Surveying healthcare settings to surface real clinical challenges.', 'in_progress'),
  ('journey', 2, 'Needs Assessment', 'Recording, screening and rating observed needs.', 'in_progress'),
  ('journey', 3, 'Need Selection', 'Choosing one need to investigate in depth.', 'not_started'),
  ('journey', 4, 'Concept Development', 'Generating and comparing early design concepts.', 'not_started'),
  ('journey', 5, 'Prototyping', 'Building and refining a testable prototype.', 'not_started'),
  ('journey', 6, 'Evaluation', 'Testing against the need and documenting results.', 'not_started'),
  ('process', 1, 'Problem Discovery', '', 'in_progress'),
  ('process', 2, 'Needs Identification', '', 'in_progress'),
  ('process', 3, 'Needs Filtering', '', 'not_started'),
  ('process', 4, 'Need Prioritization', '', 'not_started'),
  ('process', 5, 'Concept Generation', '', 'not_started'),
  ('process', 6, 'Concept Selection', '', 'not_started'),
  ('process', 7, 'Prototype Development', '', 'not_started'),
  ('process', 8, 'Testing and Evaluation', '', 'not_started')
) as v(kind, position, title, description, status)
where not exists (select 1 from public.project_stages);

-- 100 clearly labelled sample needs (is_sample = true).
insert into public.needs (number, title, area, setting, description, status, is_sample)
select g, 'Sample need ' || g,
  (array['Cardiology','Maternal Health','Infectious Disease','Diagnostics','Surgery','Paediatrics','Critical Care','Oncology','Orthopaedics','Public Health'])[1 + (g - 1) % 10],
  (array['Referral hospital','Health centre','Community or home','District hospital'])[1 + (g - 1) % 4],
  'Sample description. Replace with the observed clinical problem, who it affects and how it was observed.',
  'Sample data', true
from generate_series(1, 100) g
on conflict (number) do nothing;

-- Five placeholder profiles. No names or details are invented.
insert into public.team_members (position, full_name, role)
select g, 'Team member ' || g, 'Role to be confirmed'
from generate_series(1, 5) g
where not exists (select 1 from public.team_members);

insert into public.gaps (position) select 1 where not exists (select 1 from public.gaps);
