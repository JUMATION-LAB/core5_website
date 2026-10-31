export const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
/** Escape text before putting it into HTML. Every database value goes through this. */
export const E = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
/** Escaped text with line breaks, or a muted placeholder when empty. */
export const P = (t?: unknown, fallback = 'To be added by the team.') =>
  t ? E(t).replace(/\n/g, '<br>') : `<span class="ph">${fallback}</span>`;
export const pad = (n: number) => String(n).padStart(2, '0');
export const lines = (s: unknown) => String(s ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
export const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : '');
export const str = (o: Record<string, any> | undefined, k: string) => (o && o[k] != null ? String(o[k]) : '');
export const T = (s: string) => `<span class="tg ${s === 'Completed' ? 'd' : s === 'In progress' ? 'i' : ''}">${E(s)}</span>`;
/** Modal content registry: buttons carry data-m="key". */
export const MD: Record<string, string> = {};
export const reg = (k: string, h: string) => ((MD[k] = h), k);
/** Reveal helper: yields `rv" style="--i:N` so it can sit inside class="...". */
let ri = 0;
export const rv = () => `rv" style="--i:${ri++ % 5}`;
