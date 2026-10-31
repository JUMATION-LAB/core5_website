import { ART } from './art';
import { E, P, T, pad, lines, safeUrl, str, reg, rv } from './util';
import { fileUrl } from '../lib/supabase';
import { IMPACT_ASPECTS, LESSON_KINDS, RESEARCH_CATEGORIES, STATUS_LABEL } from '../lib/constants';
import type { SiteData } from '../lib/types';

type View = (d: SiteData) => string;

const pg = (l: string, t: string, p: string) => `<section class="pg"><div class="w"><span class="lb">${l}</span><h1>${t}</h1><p class="lead">${p}</p></div></section>`;
const sec = (l: string, t: string, b: string, c = '') => `<section class="s ${c}"><div class="w"><div class="${rv()}"><span class="lb">${l}</span><h2>${t}</h2></div>${b}</div></section>`;
const kv = (rows: [string, string][]) => `<dl class="kv">${rows.map(([k, v]) => `<div class="${rv()}"><dt>${E(k)}</dt><dd>${P(v)}</dd></div>`).join('')}</dl>`;
const pair = (doc: Record<string, any>, map: [string, string][]) => map.map(([label, key]) => [label, str(doc, key)] as [string, string]);

export const home: View = (d) => {
  const h = d.s.home;
  const title = str(h, 'hero_title') || 'Reimagining Healthcare Through Biomedical Innovation.';
  const words = title.split(' ');
  const heading = `${E(words.slice(0, -2).join(' '))} <em>${E(words.slice(-2).join(' '))}</em>`;
  const text = str(h, 'hero_text') || 'We are CORE5, a team of five biomedical design students exploring unmet healthcare needs, researching challenges and developing innovative approaches to improve healthcare.';
  const img = fileUrl('public-media', str(h, 'hero_image'));
  const journey = d.stages.filter((s) => s.kind === 'journey');
  const cur = journey.find((s) => s.status === 'in_progress') || journey.find((s) => s.status === 'not_started') || journey[journey.length - 1];
  const stats = [1, 2, 3, 4].map((i) => [Number(h[`stat${i}_value`]) || 0, str(h, `stat${i}_label`)] as const).filter((s) => s[1]);
  const principles = [
    ['Human-Centred Design', 'Every decision starts with the people who deliver and receive care.'],
    ['Evidence-Based Innovation', 'Claims are tied to sources. Nothing is stated as fact without a reference.'],
    ['Accessible Healthcare Technology', 'We judge ideas by whether they could work in resource-limited settings, including across Uganda.'],
  ];
  return `<section class="hero"><div class="w hg"><div><span class="lb">Biomedical Engineering</span><h1>${heading}</h1><p class="lead">${E(text)}</p><div class="bt"><a class="btn" href="#process">Explore Our Journey</a><a class="btn o" href="#team">Meet CORE5</a></div>${cur ? `<span class="cur"><i></i>Current stage: ${pad(journey.indexOf(cur) + 1)} ${E(cur.title)}</span>` : ''}</div><div class="art">${img ? `<img class="hero-img" src="${E(img)}" alt="CORE5 biomedical design work" width="800" height="600">` : ART}</div></div></section>`
    + sec('The Biodesign process', 'Our Innovation Journey', `<div class="jr">${journey.map((s, i) => `<div class="jc ${s.status === 'completed' ? 'd' : s.status === 'in_progress' ? 'i' : ''} ${rv()}"><b>${pad(i + 1)}</b><h3>${E(s.title)}</h3><p>${E(s.description)}</p>${T(STATUS_LABEL[s.status])}</div>`).join('')}</div>`)
    + `<section class="s alt"><div class="w"><div class="sts ${rv()}">${stats.map((s) => `<div><span class="num" data-to="${s[0]}">0</span><span>${E(s[1])}</span></div>`).join('')}</div></div></section>`
    + `<section class="s"><div class="w ft"><div class="${rv()}"><span class="lb">Our approach</span><h2>${E(str(h, 'featured_title') || 'Understanding the Problem Before Designing the Solution.')}</h2></div><div class="${rv()}"><p>${E(str(h, 'featured_text') || 'CORE5 believes effective biomedical innovation starts with understanding real healthcare needs rather than immediately designing a device. Every need we record is screened and justified before a concept is drawn.')}</p><p style="margin:20px 0"><a class="btn" href="#needs">See the Needs Assessment</a></p></div></div></section>`
    + sec('Why CORE5?', 'Three principles guide our work.', `<div class="wy">${principles.map((w, i) => `<div class="${rv()}"><b>${i + 1}</b><h3>${w[0]}</h3><p>${w[1]}</p></div>`).join('')}</div>`, 'alt');
};

export const problem: View = (d) => {
  const p = d.s.problem;
  const stake = lines(str(p, 'stakeholders'));
  return pg('The Problem', 'The healthcare challenge we are investigating.', 'This page fills in as research progresses. Nothing here counts as a finding until it carries a reference.')
    + sec('Overview', 'Healthcare challenge overview', kv(pair(p, [['Background of the problem', 'background'], ['Why it matters', 'why_matters'], ['Where it occurs', 'where_occurs'], ['Who is affected', 'who_affected'], ['Healthcare professionals involved', 'professionals'], ['Current approaches to management', 'current_approaches']])))
    + `<section class="s alt"><div class="w stm ${rv()}"><span class="lb">Problem statement</span><blockquote>${P(str(p, 'statement'), 'The team’s final problem statement will appear here once it is confirmed.')}</blockquote></div></section>`
    + sec('Stakeholders', 'Who is affected?', `<div class="chs ${rv()}">${stake.length ? stake.map((s) => `<span class="ch">${E(s)}</span>`).join('') : P('', 'Stakeholders will be listed once the problem is confirmed.')}</div>`)
    + sec('Evidence', 'Research evidence', `<div class="${rv()}">${d.evidence.length ? d.evidence.map((e) => `<div class="ev"><b>${E(e.figure)}</b><span>${E(e.label)}<br><small>Source: ${safeUrl(e.source_url) ? `<a href="${E(e.source_url)}" target="_blank" rel="noopener"><u>${E(e.source)}</u></a>` : E(e.source)}</small></span></div>`).join('') : P('', 'No statistics, studies or charts have been entered. Add each with its source and link.')}</div>`, 'alt')
    + sec('Landscape', 'Existing solutions and gaps', `<div class="gr th"><span>Existing approach</span><span>Advantages</span><span>Limitations</span><span>Unmet needs</span></div>${(d.gaps.length ? d.gaps : [{ approach: '', advantages: '', limitations: '', unmet_needs: '' }]).map((g) => `<div class="gr ${rv()}">${([['Existing approach', g.approach], ['Advantages', g.advantages], ['Limitations', g.limitations], ['Unmet needs', g.unmet_needs]] as const).map(([h, v]) => `<div data-l="${h}">${P(v)}</div>`).join('')}</div>`).join('')}`);
};

export const needs: View = (d) => {
  const areas = [...new Set(d.needs.map((n) => n.area).filter(Boolean))].sort();
  const crit = lines(str(d.s.screening, 'criteria')).map((l) => l.split('|').map((x) => x.trim()));
  const short = d.needs.filter((n) => n.shortlisted).sort((a, b) => (a.shortlist_rank ?? 99) - (b.shortlist_rank ?? 99));
  const sel = d.s.selected_need;
  const confirmed = sel.confirmed === true;
  const selRows: [string, string][] = confirmed ? pair(sel, [['Final need statement', 'statement'], ['Why the team selected it', 'why'], ['Evidence supporting the selection', 'evidence'], ['Identified stakeholders', 'stakeholders'], ['Potential impact', 'impact'], ['Questions requiring further investigation', 'questions']]) : ['Final need statement', 'Why the team selected it', 'Evidence supporting the selection', 'Identified stakeholders', 'Potential impact', 'Questions requiring further investigation'].map((k) => [k, ''] as [string, string]);
  const sample = d.needs.some((n) => n.is_sample);
  return pg('Needs Assessment', 'From one hundred needs to one.', 'The needs-identification and screening record for our Biodesign process.')
    + sec('A. Needs identification', 'What is a healthcare need?', `<p class="lead ${rv()}">A healthcare need is a specific, observed gap between what patients or clinicians require and what current practice delivers. Biodesign starts by identifying many needs and screening them rigorously, because a well-defined need, not a clever device, is the foundation of a worthwhile innovation.</p>`)
    + sec('B. Initial needs', 'Browse every need we recorded', `<div class="ctl"><input id="q" type="search" placeholder="Search needs" aria-label="Search needs"><select id="fa" aria-label="Filter by healthcare area"><option value="">All areas</option>${areas.map((a) => `<option>${E(a)}</option>`).join('')}</select><select id="so" aria-label="Sort"><option value="number">Sort by number</option><option value="title">Sort by need</option><option value="area">Sort by area</option><option value="setting">Sort by setting</option></select></div>${sample ? '<p class="note">Sample data is shown. Replace it from the admin dashboard.</p>' : ''}<div class="rh th"><b>No.</b><span>Healthcare need</span><span>Area</span><span>Setting</span><span>Status</span></div><div id="nt"></div><div class="pgn"><button class="btn o" id="pp">Previous</button><span id="pi"></span><button class="btn o" id="pn">Next</button></div>`, 'alt')
    + sec('C. Screening methodology', 'How we screened the needs', `<div class="fw">${[['100', 'Initial needs'], ['Screen', `Apply ${crit.length || 'our'} criteria`], ['10', 'Shortlisted needs'], ['Rate', 'Compare finalists'], ['1', 'Selected need']].map((f) => `<div class="fs ${rv()}"><b>${f[0]}</b><span>${f[1]}</span></div>`).join('<i class="ar"></i>')}</div><div class="cr">${crit.map((c) => `<div class="${rv()}"><b>${E(c[0])}</b><span>${E(c[1] || '')}</span></div>`).join('') || P('', 'Screening criteria have not been added yet.')}</div>`)
    + sec('D. Shortlist', 'The shortlisted needs', short.length ? `<div>${short.map((n, i) => `<button class="sl ${rv()}" data-m="${reg('s' + n.id, `<span class="lb">Shortlisted need ${pad(i + 1)}</span><h3>${E(n.title)}</h3><p><b>Area:</b> ${P(n.area, 'Not set')}</p><p><b>Screening outcome:</b> ${P(n.screening_outcome, 'To be recorded.')}</p><p><b>Description:</b> ${P(n.description)}</p><p><b>Research notes:</b> ${P(n.research_notes)}</p>`)}"><b>${pad(i + 1)}</b><span>${E(n.title)}</span><span>${E(n.area)}</span>${T(n.screening_outcome || 'Shortlisted')}</button>`).join('')}</div>` : `<p class="ph">The shortlist has not been confirmed yet.</p>`, 'alt')
    + `<section class="s"><div class="w"><div class="sel ${rv()}"><span class="lb">E. Primary need selection</span><h2>Our Selected Healthcare Need</h2>${confirmed ? T('Confirmed') : T('Not yet confirmed')}${kv(selRows)}</div></div></section>`;
};

export const innovation: View = (d) => {
  const n = d.s.innovation;
  const tiles = d.gallery.length
    ? d.gallery.map((g) => { const u = fileUrl('public-media', g.image_path); return `<button class="gi has ${rv()}" data-m="${reg('g' + g.id, `<span class="lb">${E(g.category)}</span><img src="${E(u)}" alt="${E(g.caption || g.category)}"><p>${P(g.caption, '')}</p>`)}"><img src="${E(u)}" alt="${E(g.caption || g.category)}" loading="lazy"><small>${E(g.caption || g.category)}</small></button>`; }).join('')
    : ['Initial sketches', 'Concept drawings', 'CAD models', 'Device illustrations', 'Prototype photographs'].map((g) => `<div class="gi ${rv()}" style="cursor:default"><b>${g}</b><small>No image yet</small></div>`).join('');
  return pg('Our Innovation', 'The innovation, as it develops.', 'We document the work at its true stage. Proposed benefits are kept separate from benefits that have been demonstrated.')
    + sec('Overview', 'Innovation overview', kv(pair(n, [['Proposed innovation name', 'name'], ['Healthcare need addressed', 'need'], ['Intended purpose', 'purpose'], ['Target users', 'users'], ['Expected healthcare setting', 'setting']])))
    + sec('Mechanism', 'How it works', kv(pair(n, [['Working principle', 'working_principle'], ['Technical explanation', 'technical'], ['Main components', 'components'], ['System diagram', 'diagram_note']])), 'alt')
    + sec('Gallery', 'Visual design gallery', `<div class="gl">${tiles}</div>`)
    + sec('Potential impact', 'Proposed versus demonstrated', `<div class="im th"><span>Area</span><span>Proposed</span><span>Demonstrated</span></div>${IMPACT_ASPECTS.map((a, i) => `<div class="im ${rv()}"><b data-l="Area">${a}</b><div data-l="Proposed">${P(str(n, `impact_${i + 1}_proposed`))}</div><div data-l="Demonstrated">${P(str(n, `impact_${i + 1}_demonstrated`), 'Not yet demonstrated.')}</div></div>`).join('')}`, 'alt');
};

export const process: View = (d) => {
  const st = d.stages.filter((s) => s.kind === 'process');
  const item = (s: (typeof st)[number], i: number) => {
    const photos = d.gallery.filter((g) => g.stage_id === s.id);
    const docs = d.refs.filter((r) => r.stage_id === s.id);
    return `<div class="ti ${s.status !== 'not_started' ? 'i' : ''} ${rv()}"><b>${pad(i + 1)}</b><h3>${E(s.title)}</h3><p>${E(s.period) || '<span class="ph">Period to be added</span>'}</p><p>${s.description ? E(s.description) : ''}</p>${photos.length ? `<div class="thumbs">${photos.map((g) => `<button data-m="${reg('p' + g.id, `<img src="${E(fileUrl('public-media', g.image_path))}" alt="${E(g.caption || s.title)}"><p>${P(g.caption, '')}</p>`)}" aria-label="View photo"><img src="${E(fileUrl('public-media', g.image_path))}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}${docs.length ? `<p class="dl">${docs.map((r) => { const u = fileUrl('research-docs', r.document_path) || safeUrl(r.url); return u ? `<a href="${E(u)}" target="_blank" rel="noopener">${E(r.title)}</a>` : E(r.title); }).join('<br>')}</p>` : ''}${T(STATUS_LABEL[s.status])}</div>`;
  };
  const groups = Object.entries(LESSON_KINDS).map(([k, label]) => [label, d.lessons.filter((l) => l.kind === k)] as const);
  return pg('Design Process', 'Our development journey.', 'Each stage records what we did, when, and the documents behind it.')
    + sec('Timeline', 'Eight stages from discovery to testing', `<div class="tl">${st.map(item).join('')}</div>`)
    + sec('Reflection', 'Challenges and lessons learned', `<div class="ls">${groups.map(([label, ls]) => `<div class="${rv()}"><h3>${label}</h3>${ls.length ? ls.map((l) => `<p>${P(l.body)}</p>`).join('') : `<p>${P('')}</p>`}</div>`).join('')}</div>`, 'alt');
};

export const research: View = () => pg('Research', 'The CORE5 research library.', 'Every source the project relies on, in one place. Entries are added only with a verifiable citation.')
  + `<section class="s"><div class="w"><div class="ctl"><input id="rq" type="search" placeholder="Search title, author or summary" aria-label="Search references"><select id="rc" aria-label="Category"><option value="">All categories</option>${RESEARCH_CATEGORIES.map((c) => `<option>${c}</option>`).join('')}</select><select id="rs" aria-label="Sort"><option value="1">Newest first</option><option value="0">Oldest first</option></select></div><div id="rl"></div></div></section>`;

export const team: View = (d) => pg('Our Team', 'Meet the Minds Behind CORE5.', 'Five biomedical design students working together on Biomedical Engineering.')
  + `<section class="s"><div class="w tm">${d.team.map((m, i) => { const u = fileUrl('public-media', m.photo_path); return `<article class="${rv()}"><div class="av ${u ? 'photo' : ''}">${u ? `<img src="${E(u)}" alt="${E(m.full_name)}" loading="lazy">` : pad(i + 1)}</div><h3>${E(m.full_name)}</h3><p class="${m.role ? '' : 'ph'}">${E(m.role) || 'Role to be confirmed'}</p><p>${P(m.bio, 'Short biography to be added.')}</p><p><b>Contribution:</b> ${P(m.contribution)}</p></article>`; }).join('')}</div></section>`
  + sec('Academic context', 'Supervision and institution', kv(pair(d.s.about, [['Project supervisor', 'supervisor'], ['Academic institution', 'institution'], ['Department', 'department'], ['Collaborators and mentors', 'collaborators']])), 'alt');

export const contact: View = (d) => {
  const c = d.s.contact;
  const socials = lines(str(c, 'socials')).map((l) => l.split('|').map((x) => x.trim())).filter((p) => safeUrl(p[1] || ''));
  return pg('Contact', 'Get in touch with CORE5.', 'Send the team a message, or reach us through the details beside the form.')
    + `<section class="s"><div class="w ct"><form class="f ${rv()}" id="cf" novalidate>${[['name', 'Name', 'text'], ['email', 'Email address', 'email'], ['subject', 'Subject', 'text']].map(([k, l, t]) => `<label>${l}<input name="${k}" type="${t}" autocomplete="${k}" maxlength="${k === 'subject' ? 200 : 254}"><span class="er"></span></label>`).join('')}<label>Message<textarea name="message" rows="5" maxlength="5000"></textarea><span class="er"></span></label><input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="btn" id="sb" type="submit">Send message</button><div id="fm" role="status"></div></form><div class="${rv()}"><dl class="kv" style="grid-template-columns:1fr"><div><dt>Team email</dt><dd>${P(str(c, 'email'))}</dd></div><div><dt>Institution</dt><dd>${P(str(c, 'institution'))}</dd></div><div><dt>Social media</dt><dd>${socials.length ? socials.map((s) => `<a href="${E(s[1])}" target="_blank" rel="noopener"><u>${E(s[0])}</u></a>`).join(' · ') : P('')}</dd></div></dl></div></div></section>`;
};
