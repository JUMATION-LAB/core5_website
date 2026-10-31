import '../styles/site.css';
import { loadSite } from '../lib/data';
import { sb } from '../lib/supabase';
import { NAV } from '../lib/constants';
import * as V from './views';
import { $, $$, E, T, MD, str, lines, safeUrl } from './util';
import { fileUrl } from '../lib/supabase';
import type { SiteData } from '../lib/types';

const views: Record<string, (d: SiteData) => string> = {
  home: V.home, problem: V.problem, needs: V.needs, innovation: V.innovation,
  process: V.process, research: V.research, team: V.team, contact: V.contact,
};
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

function mount(d: SiteData) {
  $('#nv').innerHTML = NAV.map(([id, l]) => `<a class="nl" href="#${id}">${l}</a>`).join('') + '<a class="btn" href="#process">Explore Our Journey</a>';
  $('#main').innerHTML = NAV.map(([id]) => `<div data-v="${id}" hidden>${views[id](d)}</div>`).join('');
  const c = d.s.contact;
  $('#ft').innerHTML = `<div class="w"><div class="fg"><div><a class="logo" href="#home"><b>CORE<span>5</span></b></a><p style="margin:10px 0 4px">Biomedical Engineering</p><p>Innovating Healthcare. Engineering Possibilities.</p></div><div><h4>Navigate</h4>${NAV.slice(0, 5).map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}</div><div><h4>Research</h4><a href="#research">Research library</a><a href="#needs">Needs Assessment</a><a href="#problem">The Problem</a></div><div><h4>Contact</h4><p>${E(str(c, 'email')) || 'Team email to be added'}</p><p>${E(str(d.s.about, 'institution') || str(c, 'institution')) || 'Institution to be added'}</p>${lines(str(c, 'socials')).map((l) => l.split('|').map((x) => x.trim())).filter((p) => safeUrl(p[1] || '')).map((p) => `<a href="${E(p[1])}" target="_blank" rel="noopener">${E(p[0])}</a>`).join('')}<a href="#contact">Contact form</a></div></div><p class="cp">© ${new Date().getFullYear()} CORE5. Academic project for Biomedical Engineering. Not a commercial medical device.</p></div>`;
  if (!d.live) $('#bn').innerHTML = '<div class="banner">Preview mode: the database is not connected, so sample content is shown.</div>';
}

function route() {
  const h = location.hash.slice(1);
  const id = NAV.some((n) => n[0] === h) ? h : 'home';
  $$('[data-v]').forEach((s) => (s.hidden = s.dataset.v !== id));
  $$<HTMLAnchorElement>('.nl').forEach((a) => a.classList.toggle('on', a.hash === '#' + id));
  document.title = (id === 'home' ? '' : NAV.find((n) => n[0] === id)![1] + ' · ') + 'CORE5 Biomedical Engineering';
  $('#nv').classList.remove('open');
  $('#mb').setAttribute('aria-expanded', 'false');
  scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

function countUp(el: HTMLElement) {
  const to = Number(el.dataset.to);
  if (RM) { el.textContent = String(to); return; }
  const t0 = performance.now();
  const f = (t: number) => { const k = Math.min(1, (t - t0) / 1000); el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}

function reveal() {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const t = e.target as HTMLElement;
    t.classList.add('in');
    $$('.num', t).forEach(countUp);
    io.unobserve(t);
  }), { threshold: 0.12 });
  $$('.rv').forEach((x) => io.observe(x));
}

function modal() {
  const dg = $<HTMLDialogElement>('#dg');
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const m = t.closest<HTMLElement>('[data-m]');
    if (m) { $('#dc').innerHTML = MD[m.dataset.m!]; dg.showModal(); }
    else if (t === dg || t.closest('.x')) dg.close();
  });
}

function needsTable(d: SiteData) {
  let q = '', f = '', s: 'number' | 'title' | 'area' | 'setting' = 'number', p = 0;
  const N = 10, box = $('#nt');
  const draw = () => {
    const r = d.needs.filter((x) => (!f || x.area === f) && `${x.title} ${x.area} ${x.setting}`.toLowerCase().includes(q))
      .sort((a, b) => (s === 'number' ? a.number - b.number : String(a[s]).localeCompare(String(b[s]), undefined, { numeric: true })));
    const pages = Math.max(1, Math.ceil(r.length / N));
    p = Math.min(p, pages - 1);
    box.innerHTML = r.slice(p * N, p * N + N).map((x) => `<div><button class="rh" aria-expanded="false"><b>${String(x.number).padStart(3, '0')}</b><span>${E(x.title)}</span><span>${E(x.area)}</span><span>${E(x.setting)}</span><span>${T(x.is_sample ? 'Sample data' : x.status)}</span></button><div class="rd" hidden>${x.description ? `<b>Description:</b> ${E(x.description)}` : '<span class="ph">No description yet.</span>'}</div></div>`).join('') || '<p class="ph" style="padding:20px 0">No needs match. Clear the search or filter.</p>';
    $('#pi').textContent = `Page ${p + 1} of ${pages} (${r.length} needs)`;
    ($('#pp') as HTMLButtonElement).disabled = p === 0;
    ($('#pn') as HTMLButtonElement).disabled = p >= pages - 1;
  };
  box.onclick = (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open));
    (b.nextElementSibling as HTMLElement).hidden = !open;
  };
  $('#q').oninput = (e) => { q = (e.target as HTMLInputElement).value.toLowerCase().trim(); p = 0; draw(); };
  $('#fa').onchange = (e) => { f = (e.target as HTMLSelectElement).value; p = 0; draw(); };
  $('#so').onchange = (e) => { s = (e.target as HTMLSelectElement).value as typeof s; draw(); };
  $('#pp').onclick = () => { p--; draw(); };
  $('#pn').onclick = () => { p++; draw(); };
  draw();
}

function library(d: SiteData) {
  let q = '', c = '', newest = true;
  const box = $('#rl');
  const draw = () => {
    const r = d.refs.filter((x) => (!c || x.category === c) && `${x.title} ${x.authors} ${x.summary}`.toLowerCase().includes(q))
      .sort((a, b) => (newest ? (b.year ?? 0) - (a.year ?? 0) : (a.year ?? 0) - (b.year ?? 0)));
    box.innerHTML = r.map((x) => {
      const doc = fileUrl('research-docs', x.document_path), link = safeUrl(x.url);
      return `<article class="rs"><small>${E(x.category)}</small><h3>${E(x.title)}</h3><small>${E(x.authors)}${x.year ? ` (${x.year})` : ''}. ${E(x.source)}.</small>${x.summary ? `<p>${E(x.summary)}</p>` : ''}${x.relevance ? `<p><b>Relevance to CORE5:</b> ${E(x.relevance)}</p>` : ''}${link ? `<a class="btn o" href="${E(link)}" target="_blank" rel="noopener">Open source</a>` : ''}${doc ? `<a class="btn o" href="${E(doc)}" target="_blank" rel="noopener">Open document</a>` : ''}</article>`;
    }).join('') || `<p class="ph" style="padding:20px 0">${d.refs.length ? 'No references match your search.' : 'No references have been added yet.'}</p>`;
  };
  $('#rq').oninput = (e) => { q = (e.target as HTMLInputElement).value.toLowerCase().trim(); draw(); };
  $('#rc').onchange = (e) => { c = (e.target as HTMLSelectElement).value; draw(); };
  $('#rs').onchange = (e) => { newest = (e.target as HTMLSelectElement).value === '1'; draw(); };
  draw();
}

function contactForm() {
  const f = $<HTMLFormElement>('#cf'), out = $('#fm'), btn = $<HTMLButtonElement>('#sb');
  const rules: Record<string, (v: string) => string> = {
    name: (v) => (v.trim().length < 2 ? 'Enter your name.' : ''),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
    subject: (v) => (v.trim().length < 3 ? 'Enter a subject of at least 3 characters.' : ''),
    message: (v) => (v.trim().length < 10 ? 'Write at least 10 characters.' : ''),
  };
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    out.innerHTML = '';
    let bad: HTMLInputElement | null = null;
    for (const k in rules) {
      const i = f.elements.namedItem(k) as HTMLInputElement;
      const m = rules[k](i.value);
      i.setAttribute('aria-invalid', String(!!m));
      (i.parentElement!.querySelector('.er') as HTMLElement).textContent = m;
      if (m && !bad) bad = i;
    }
    if (bad) { bad.focus(); return; }
    if ((f.elements.namedItem('website') as HTMLInputElement).value) return; // honeypot: bots fill this in
    if (!sb) { out.innerHTML = '<div class="msg bad">Message not sent. The database is not connected, so nothing was delivered.</div>'; return; }
    btn.disabled = true; btn.innerHTML = '<i class="sp"></i>Sending';
    const v = (k: string) => (f.elements.namedItem(k) as HTMLInputElement).value.trim();
    const { error } = await sb.from('contact_messages').insert({ name: v('name'), email: v('email'), subject: v('subject'), message: v('message') });
    btn.disabled = false; btn.textContent = 'Send message';
    if (error) {
      out.innerHTML = `<div class="msg bad">${error.message.includes('rate_limited') ? 'Too many messages from this address. Please try again later.' : 'Message not sent. Check your connection and try again.'}</div>`;
      return;
    }
    out.innerHTML = '<div class="msg ok">Message sent. The team will reply by email.</div>';
    f.reset();
  });
}

async function init() {
  const hide = () => $('#ld').classList.add('h');
  const fail = setTimeout(hide, 6000); // never leave the loader up if the network stalls
  const d = await loadSite();
  mount(d);
  route();
  addEventListener('hashchange', route);
  $('#mb').onclick = (e) => { const o = $('#nv').classList.toggle('open'); (e.currentTarget as HTMLElement).setAttribute('aria-expanded', String(o)); };
  const hd = $('#hd'), sc = () => hd.classList.toggle('sc', scrollY > 10);
  addEventListener('scroll', sc, { passive: true }); sc();
  reveal(); modal(); needsTable(d); library(d); contactForm();
  clearTimeout(fail); hide();
}
init();
