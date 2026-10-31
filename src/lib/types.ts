export type Status = 'not_started' | 'in_progress' | 'completed';
export type Doc = Record<string, any>; // one JSON document from site_settings

export interface Stage { id: number; kind: 'journey' | 'process'; position: number; title: string; description: string; period: string; status: Status }
export interface Need {
  id: number; number: number; title: string; area: string; setting: string; description: string; status: string;
  is_sample: boolean; shortlisted: boolean; shortlist_rank: number | null; screening_outcome: string; research_notes: string;
}
export interface Gap { id: number; position: number; approach: string; advantages: string; limitations: string; unmet_needs: string }
export interface Evidence { id: number; position: number; figure: string; label: string; source: string; source_url: string }
export interface Ref {
  id: number; category: string; title: string; authors: string; year: number | null; source: string; summary: string;
  relevance: string; url: string; document_path: string; stage_id: number | null;
}
export interface Member { id: number; position: number; full_name: string; role: string; bio: string; contribution: string; photo_path: string }
export interface GalleryItem { id: number; position: number; category: string; caption: string; image_path: string; stage_id: number | null }
export interface Lesson { id: number; kind: string; body: string; position: number }

export interface SiteData {
  /** false = Supabase not configured or unreachable; sample defaults are shown. */
  live: boolean;
  s: Record<'home' | 'problem' | 'screening' | 'selected_need' | 'innovation' | 'about' | 'contact', Doc>;
  stages: Stage[]; needs: Need[]; gaps: Gap[]; evidence: Evidence[]; refs: Ref[];
  team: Member[]; gallery: GalleryItem[]; lessons: Lesson[];
}
