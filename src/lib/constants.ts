export const NAV: [string, string][] = [
  ['home', 'Home'], ['problem', 'The Problem'], ['needs', 'Needs Assessment'], ['innovation', 'Our Innovation'],
  ['process', 'Design Process'], ['research', 'Research'], ['team', 'Our Team'], ['contact', 'Contact'],
];
export const IMPACT_ASPECTS = ['Patient care', 'Healthcare workers', 'Affordability', 'Accessibility', 'Maintenance', 'Suitability for Uganda'];
export const RESEARCH_CATEGORIES = ['Journal Articles', 'Research Papers', 'Medical Guidelines', 'Clinical Studies', 'Healthcare Statistics', 'Reference Documents'];
export const GALLERY_CATEGORIES = ['Initial sketches', 'Concept drawings', 'CAD models', 'Device illustrations', 'Prototype photographs', 'Process photographs'];
export const STATUS_LABEL = { not_started: 'Upcoming', in_progress: 'In progress', completed: 'Completed' } as const;
export const LESSON_KINDS: Record<string, string> = {
  challenge: 'Challenges encountered', decision: 'Decisions made', lesson: 'Lessons learned', direction: 'Changes to design direction',
};
