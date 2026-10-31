import type { Bucket } from '../lib/supabase';
import { IMPACT_ASPECTS, RESEARCH_CATEGORIES, GALLERY_CATEGORIES, LESSON_KINDS } from '../lib/constants';

export type FieldType = 'text' | 'textarea' | 'number' | 'bool' | 'select' | 'file' | 'url';
export interface Field {
  k: string; label: string; type?: FieldType; help?: string; req?: boolean;
  options?: (string | [string, string])[]; bucket?: Bucket;
}
/** One JSON document in site_settings. */
export interface SettingDoc { key: string; title: string; note?: string; fields: Field[] }
/** One database table edited as a list of rows. */
export interface Coll { key: string; title: string; table: string; note?: string; fields: Field[]; cols: string[]; order: string[] }

const t = (k: string, label: string, help?: string): Field => ({ k, label, help });
const a = (k: string, label: string, help?: string): Field => ({ k, label, type: 'textarea', help });
const n = (k: string, label: string, help?: string): Field => ({ k, label, type: 'number', help });

export const SETTINGS: SettingDoc[] = [
  { key: 'home', title: 'Homepage', note: 'Leave a text field empty to use the default wording. Journey stages are edited under Project stages.', fields: [
    t('hero_title', 'Hero heading'), a('hero_text', 'Hero supporting text'),
    { k: 'hero_image', label: 'Hero photograph', type: 'file', bucket: 'public-media', help: 'JPG, PNG, WebP or AVIF, up to 5 MB. Use a real laboratory or student-work photo.' },
    t('featured_title', 'Featured section heading'), a('featured_text', 'Featured section text'),
    ...[1, 2, 3, 4].flatMap((i) => [n(`stat${i}_value`, `Statistic ${i}: number`), t(`stat${i}_label`, `Statistic ${i}: label`)]),
  ] },
  { key: 'problem', title: 'The problem', note: 'Only enter statements you can support with a reference.', fields: [
    a('background', 'Background of the problem'), a('why_matters', 'Why it matters'), a('where_occurs', 'Where it occurs'),
    a('who_affected', 'Who is affected'), a('professionals', 'Healthcare professionals involved'), a('current_approaches', 'Current approaches to management'),
    a('statement', 'Problem statement'), a('stakeholders', 'Stakeholders', 'One per line.'),
  ] },
  { key: 'screening', title: 'Screening criteria', fields: [a('criteria', 'Criteria', 'One per line, written as: Name | Question')] },
  { key: 'selected_need', title: 'Selected need', note: 'Nothing shows publicly until you tick "Confirmed".', fields: [
    { k: 'confirmed', label: 'Confirmed', type: 'bool', help: 'Tick only when the team has made its final selection.' },
    a('statement', 'Final need statement'), a('why', 'Why the team selected it'), a('evidence', 'Evidence supporting the selection'),
    a('stakeholders', 'Identified stakeholders'), a('impact', 'Potential impact'), a('questions', 'Questions requiring further investigation'),
  ] },
  { key: 'innovation', title: 'Innovation', note: 'Fill "Demonstrated" only for benefits that have been tested.', fields: [
    t('name', 'Proposed innovation name'), a('need', 'Healthcare need addressed'), a('purpose', 'Intended purpose'), a('users', 'Target users'), a('setting', 'Expected healthcare setting'),
    a('working_principle', 'Working principle'), a('technical', 'Technical explanation'), a('components', 'Main components'), a('diagram_note', 'System diagram description'),
    ...IMPACT_ASPECTS.flatMap((x, i) => [a(`impact_${i + 1}_proposed`, `${x}: proposed benefit`), a(`impact_${i + 1}_demonstrated`, `${x}: demonstrated benefit`)]),
  ] },
  { key: 'about', title: 'Supervision and institution', fields: [t('supervisor', 'Project supervisor'), t('institution', 'Academic institution'), t('department', 'Department'), a('collaborators', 'Collaborators and mentors')] },
  { key: 'contact', title: 'Contact details', fields: [
    { k: 'email', label: 'Official team email', type: 'text' }, t('institution', 'Institution'), a('socials', 'Social media links', 'One per line, written as: Label | https://link'),
  ] },
];

const STATUS: [string, string][] = [['not_started', 'Upcoming'], ['in_progress', 'In progress'], ['completed', 'Completed']];

export const COLLS: Coll[] = [
  { key: 'needs', title: 'Healthcare needs', table: 'needs', order: ['number'], cols: ['number', 'title', 'area', 'shortlisted'],
    note: 'The initial 100 needs, the shortlist and their notes. Tick "Shortlisted" for the ten finalists.', fields: [
      { ...n('number', 'Number'), req: true }, { ...t('title', 'Healthcare need'), req: true }, t('area', 'Healthcare area'), t('setting', 'Identified setting'),
      a('description', 'Description'), t('status', 'Status'), { k: 'shortlisted', label: 'Shortlisted', type: 'bool' }, n('shortlist_rank', 'Shortlist order'),
      t('screening_outcome', 'Screening outcome'), a('research_notes', 'Research notes'), { k: 'is_sample', label: 'This is sample data', type: 'bool' },
    ] },
  { key: 'stages',
     title: 'Project stages', 
     table: 'project_stages', 
     order: ['kind', 'position'], 
     cols: ['id', 'kind', 'position', 'title', 'status'],
     note: '"journey" stages appear on the homepage; "process" stages on the Design Process timeline. Statuses are never set automatically.', 
     fields: [
      { k: 'kind', 
        label: 'Where it appears', 
        type: 'select', 
        options: [ 
          ['journey', 'Homepage journey'], 
          ['process', 'Design Process timeline']
        ] 
      },
      n('position', 'Order'), 
      { ...t('title', 'Title'), 
        req: true 
      }, 
      a('description', 'Description'), t('period', 'Date or period'), { k: 'status', label: 'Status', type: 'select', options: STATUS },
    ] },
  { key: 'gaps', title: 'Existing solutions and gaps', table: 'gaps', order: ['position'], cols: ['position', 'approach'], fields: [
    n('position', 'Order'), t('approach', 'Existing approach'), a('advantages', 'Advantages'), a('limitations', 'Limitations'), a('unmet_needs', 'Unmet needs'),
  ] },
  { key: 'evidence', title: 'Research evidence', table: 'evidence', order: ['position'], cols: ['position', 'figure', 'label', 'source'],
    note: 'Only add figures taken from a source you can cite.', fields: [
      n('position', 'Order'), { ...t('figure', 'Figure or statistic'), req: true }, t('label', 'What it measures'), t('source', 'Source'), { k: 'source_url', label: 'Source link', type: 'url' },
    ] },
  { key: 'research', title: 'Research library', table: 'research_refs', order: ['year'], cols: ['year', 'title', 'category', 'is_published'], fields: [
    { k: 'category', label: 'Category', type: 'select', options: RESEARCH_CATEGORIES }, { ...t('title', 'Title'), req: true }, t('authors', 'Author(s)'), n('year', 'Publication year'),
    t('source', 'Source or journal'), a('summary', 'Short summary'), a('relevance', 'Relevance to CORE5'), { k: 'url', label: 'External link', type: 'url' },
    { k: 'document_path', label: 'Document (PDF)', type: 'file', bucket: 'research-docs', help: 'PDF, up to 20 MB.' },
    n('stage_id', 'Linked process stage ID', 'Optional. IDs are listed under Project stages.'), { k: 'is_published', label: 'Published', type: 'bool' },
  ] },
  { key: 'team', title: 'Team profiles', table: 'team_members', order: ['position'], cols: ['position', 'full_name', 'role', 'is_published'], fields: [
    n('position', 'Order'), { ...t('full_name', 'Full name'), req: true }, t('role', 'Academic role or responsibility'), a('bio', 'Short biography'), a('contribution', 'Contribution to the project'),
    { k: 'photo_path', label: 'Photograph', type: 'file', bucket: 'public-media', help: 'Square images work best. Up to 5 MB.' }, { k: 'is_published', label: 'Published', type: 'bool' },
  ] },
  { key: 'gallery', title: 'Design gallery', table: 'gallery_items', order: ['position'], cols: ['position', 'category', 'caption'], fields: [
    { k: 'category', label: 'Category', type: 'select', options: GALLERY_CATEGORIES }, n('position', 'Order'), t('caption', 'Caption'),
    { k: 'image_path', label: 'Image', type: 'file', bucket: 'public-media', req: true, help: 'Sketches, CAD renders, illustrations or prototype photos. Up to 5 MB.' },
    n('stage_id', 'Linked process stage ID', 'Optional. Shows the image on that stage of the timeline.'),
  ] },
  { key: 'lessons', title: 'Challenges and lessons', table: 'lessons', order: ['kind', 'position'], cols: ['kind', 'position', 'body'], fields: [
    { k: 'kind', label: 'Type', type: 'select', options: Object.entries(LESSON_KINDS) as [string, string][] }, n('position', 'Order'), { ...a('body', 'Entry'), req: true },
  ] },
];
