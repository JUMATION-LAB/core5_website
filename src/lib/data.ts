import { sb } from './supabase';
import type { SiteData, Need, Stage, Doc } from './types';

const AREAS = ['Cardiology', 'Maternal Health', 'Infectious Disease', 'Diagnostics', 'Surgery', 'Paediatrics', 'Critical Care', 'Oncology', 'Orthopaedics', 'Public Health'];
const SETTINGS = ['Referral hospital', 'Health centre', 'Community or home', 'District hospital'];

const J: [string, string][] = [
  ['Problem Identification', 'Surveying healthcare settings to surface real clinical challenges.'],
  ['Needs Assessment', 'Recording, screening and rating observed needs.'],
  ['Need Selection', 'Choosing one need to investigate in depth.'],
  ['Concept Development', 'Generating and comparing early design concepts.'],
  ['Prototyping', 'Building and refining a testable prototype.'],
  ['Evaluation', 'Testing against the need and documenting results.'],
];
const PR = ['Problem Discovery', 'Needs Identification', 'Needs Filtering', 'Need Prioritization', 'Concept Generation', 'Concept Selection', 'Prototype Development', 'Testing and Evaluation'];

/** Offline preview content: used only when Supabase is not configured or unreachable. */
function offline(): SiteData {
  const st = (i: number): Stage['status'] => (i < 2 ? 'in_progress' : 'not_started');
  const stages: Stage[] = [
    ...J.map(([title, description], i) => ({ id: i + 1, kind: 'journey' as const, position: i + 1, title, description, period: '', status: st(i) })),
    ...PR.map((title, i) => ({ id: 100 + i, kind: 'process' as const, position: i + 1, title, description: '', period: '', status: st(i) })),
  ];
  const needs: Need[] = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1, number: i + 1, title: `Sample need ${i + 1}`, area: AREAS[i % 10], setting: SETTINGS[i % 4],
    description: 'Sample description. Replace with the observed clinical problem, who it affects and how it was observed.',
    status: 'Sample data', is_sample: true, shortlisted: false, shortlist_rank: null, screening_outcome: '', research_notes: '',
  }));
  return {
    live: false,
    s: {
      home: { stat1_value: 100, stat1_label: 'Initial healthcare needs', stat2_value: 10, stat2_label: 'Shortlisted needs', stat3_value: 1, stat3_label: 'Primary need to investigate', stat4_value: 5, stat4_label: 'Team members' },
      problem: {}, screening: {}, selected_need: {}, innovation: {}, about: {}, contact: {},
    },
    stages, needs, gaps: [], evidence: [], refs: [], lessons: [], gallery: [],
    team: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, position: i + 1, full_name: `Team member ${i + 1}`, role: 'Role to be confirmed', bio: '', contribution: '', photo_path: '' })),
  };
}

export async function loadSite(): Promise<SiteData> {
  if (!sb) return offline();
  const client = sb;
  let failed = false;
  const q = async <T,>(p: PromiseLike<{ data: T | null; error: unknown }>, fb: T): Promise<T> => {
    try {
      const { data, error } = await p;
      if (error) throw error;
      return data ?? fb;
    } catch (e) {
      failed = true;
      console.warn('[CORE5] could not load data from Supabase', e);
      return fb;
    }
  };
  const [settings, stages, needs, gaps, evidence, refs, team, gallery, lessons] = await Promise.all([
    q(client.from('site_settings').select('key,value'), [] as { key: string; value: Doc }[]),
    q(client.from('project_stages').select('*').order('position'), [] as SiteData['stages']),
    q(client.from('needs').select('*').order('number'), [] as SiteData['needs']),
    q(client.from('gaps').select('*').order('position'), [] as SiteData['gaps']),
    q(client.from('evidence').select('*').order('position'), [] as SiteData['evidence']),
    q(client.from('research_refs').select('*').eq('is_published', true), [] as SiteData['refs']),
    q(client.from('team_members').select('*').eq('is_published', true).order('position'), [] as SiteData['team']),
    q(client.from('gallery_items').select('*').order('position'), [] as SiteData['gallery']),
    q(client.from('lessons').select('*').order('position'), [] as SiteData['lessons']),
  ]);
  if (failed) return offline();
  const doc = (k: string): Doc => settings.find((r) => r.key === k)?.value ?? {};
  return {
    live: true,
    s: { home: doc('home'), problem: doc('problem'), screening: doc('screening'), selected_need: doc('selected_need'), innovation: doc('innovation'), about: doc('about'), contact: doc('contact') },
    stages, needs, gaps, evidence, refs, team, gallery, lessons,
  };
}
