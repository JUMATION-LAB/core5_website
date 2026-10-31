import '../styles/admin.css';
import { sb, fileUrl } from '../lib/supabase';
import { E } from '../site/util';
import { SETTINGS, COLLS, type Field, type Coll } from './schema';

type Row = Record<string, any>;
const app = document.getElementById('app')!;
const LIMIT: Record<string, number> = { 'public-media': 5 * 1024 * 1024, 'research-docs': 20 * 1024 * 1024 };
const ACCEPT: Record<string, string> = { 'public-media': 'image/jpeg,image/png,image/webp,image/avif', 'research-docs': 'application/pdf' };
let notice: { ok: boolean; text: string } | null = null;
const flash = (ok: boolean, text: string) => { notice = { ok, text }; };
const showNotice = () => { const n = notice; notice = null; return n ? `<div class="msg ${n.ok ? 'ok' : 'bad'}" role="status">${E(n.text)}</div>` : ''; };

/* ---------- auth ---------- */
function loginView(msg = '', recovery = false) {
  app.innerHTML = `<div class="login"><div class="logo">CORE<span>5</span> Admin</div><p class="muted" style="margin:6px 0 20px">Team members only.</p>${msg ? `<div class="msg bad">${E(msg)}</div>` : ''}${recovery
    ? `<form id="nf"><label>New password<input type="password" name="pw" minlength="10" autocomplete="new-password" required><small>At least 10 characters.</small></label><button class="btn">Set password</button></form>`
    : `<form id="lf"><label>Email<input type="email" name="email" autocomplete="username" required></label><label>Password<input type="password" name="pw" autocomplete="current-password" required></label><div class="row"><button class="btn">Sign in</button><button class="btn o" type="button" id="fp">Forgot password</button></div></form>`}</div>`;
  const form = (id: string) => document.getElementById(id) as HTMLFormElement | null;
  form('lf')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target as HTMLFormElement;
    const { error } = await sb!.auth.signInWithPassword({ email: (f.elements.namedItem('email') as HTMLInputElement).value.trim(), password: (f.elements.namedItem('pw') as HTMLInputElement).value });
    if (error) return loginView('Sign-in failed. Check your email and password.');
    start();
  });
  
  document.getElementById('fp')?.addEventListener('click', async () => {
    const email = (document.querySelector('#lf [name=email]') as HTMLInputElement).value.trim();
    if (!email) return loginView('Enter your email first, then choose Forgot password.');
    await sb!.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/admin/' });
    loginView('If that address has an account, a reset link is on its way.');
  });
  form('nf')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = ((e.target as HTMLFormElement).elements.namedItem('pw') as HTMLInputElement).value;
    const { error } = await sb!.auth.updateUser({ password: pw });
    if (error) return loginView(error.message, true);
    flash(true, 'Password updated.'); start();
  });
}

async function start() {
  const { data: s } = await sb!.auth.getSession();
  if (!s.session) return loginView();
  const { data: ok } = await sb!.rpc('is_admin');
  if (ok !== true) { await sb!.auth.signOut(); return loginView('This account is not on the CORE5 admin list. Ask an existing admin to add it.'); }
  render();
}

/* ---------- shell ---------- */
function shell(active: string, body: string) {
  const link = (h: string, l: string) => `<a href="#/${h}" class="${active === h ? 'on' : ''}">${E(l)}</a>`;
  app.innerHTML = `<div class="layout"><aside><div class="logo">CORE<span>5</span> Admin</div><h4>Site content</h4>${SETTINGS.map((x) => link('s/' + x.key, x.title)).join('')}<h4>Project data</h4>${COLLS.map((x) => link('c/' + x.key, x.title)).join('')}<h4>Inbox</h4>${link('messages', 'Contact messages')}<a class="out" href="/" target="_blank" rel="noopener">View public site</a><a href="#" id="so">Sign out</a></aside><main>${showNotice()}${body}</main></div>`;
  document.getElementById('so')!.onclick = async (e) => { e.preventDefault(); await sb!.auth.signOut(); loginView(); };
}

/* ---------- form engine ---------- */
function fieldHtml(f: Field, v: unknown): string {
  const help = f.help ? `<small>${E(f.help)}</small>` : '';
  const req = f.req ? ' required' : '';
  switch (f.type) {
    case 'bool': return `<label class="chk"><input type="checkbox" name="${f.k}" ${v ? 'checked' : ''}><span>${E(f.label)}${help}</span></label>`;
    case 'textarea': return `<label>${E(f.label)}${help}<textarea name="${f.k}"${req}>${E(v ?? '')}</textarea></label>`;
    case 'number': return `<label>${E(f.label)}${help}<input type="number" name="${f.k}" value="${E(v ?? '')}"${req}></label>`;
    case 'url': return `<label>${E(f.label)}${help}<input type="url" name="${f.k}" value="${E(v ?? '')}" placeholder="https://"${req}></label>`;
    case 'select': return `<label>${E(f.label)}${help}<select name="${f.k}">${(f.options ?? []).map((o) => { const [val, lab] = typeof o === 'string' ? [o, o] : o; return `<option value="${E(val)}" ${val === v ? 'selected' : ''}>${E(lab)}</option>`; }).join('')}</select></label>`;
    case 'file': {
      const cur = v ? String(v) : '';
      const url = fileUrl(f.bucket!, cur);
      return `<div class="file"><label>${E(f.label)}${help}<input type="file" name="${f.k}" accept="${ACCEPT[f.bucket!]}"></label>${cur ? `${f.bucket === 'public-media' ? `<img src="${E(url)}" alt="">` : ''}<a href="${E(url)}" target="_blank" rel="noopener">Current file</a><label class="chk" style="margin-top:8px"><input type="checkbox" name="${f.k}__remove"><span>Remove current file</span></label>` : ''}</div>`;
    }
    default: return `<label>${E(f.label)}${help}<input type="text" name="${f.k}" value="${E(v ?? '')}"${req}></label>`;
  }
}

async function upload(bucket: string, folder: string, file: File): Promise<string> {
  if (file.size > LIMIT[bucket]) throw new Error(`${file.name} is larger than ${LIMIT[bucket] / 1048576} MB.`);
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60);
  const path = `${folder}/${Date.now()}-${safe}`;
  const { error } = await sb!.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

async function readForm(form: HTMLFormElement, fields: Field[], old: Row, folder: string): Promise<Row> {
  const out: Row = {};
  for (const f of fields) {
    const el = form.elements.namedItem(f.k) as HTMLInputElement;
    if (f.type === 'bool') out[f.k] = el.checked;
    else if (f.type === 'number') out[f.k] = el.value === '' ? null : Number(el.value);
    else if (f.type === 'file') {
      const file = el.files?.[0];
      const rm = (form.elements.namedItem(f.k + '__remove') as HTMLInputElement | null)?.checked;
      out[f.k] = file ? await upload(f.bucket!, folder, file) : rm ? '' : old[f.k] ?? '';
    } else out[f.k] = el.value.trim();
  }
  return out;
}

const busy = (form: HTMLFormElement, on: boolean) => { const b = form.querySelector('button.btn') as HTMLButtonElement; b.disabled = on; b.textContent = on ? 'Saving…' : 'Save changes'; };

/* ---------- site content documents ---------- */
async function settingsView(key: string) {
  const def = SETTINGS.find((s) => s.key === key);
  if (!def) return shell('', '<p>Not found.</p>');
  const { data } = await sb!.from('site_settings').select('value').eq('key', key).maybeSingle();
  const old: Row = data?.value ?? {};
  shell('s/' + key, `<h1>${E(def.title)}</h1><p class="sub">${E(def.note ?? 'Changes appear on the public site as soon as you save.')}</p><form id="f" class="card">${def.fields.map((f) => fieldHtml(f, old[f.k])).join('')}<button class="btn">Save changes</button></form>`);
  const form = document.getElementById('f') as HTMLFormElement;
  form.onsubmit = async (e) => {
    e.preventDefault(); busy(form, true);
    try {
      const value = { ...old, ...(await readForm(form, def.fields, old, 'settings')) };
      const { error } = await sb!.from('site_settings').upsert({ key, value }, { onConflict: 'key' });
      if (error) throw error;
      flash(true, 'Saved. The public site now shows this content.');
    } catch (err) { flash(false, (err as Error).message); }
    settingsView(key);
  };
}

/* ---------- table collections ---------- */
const cell = (v: unknown) => (v === true ? '✓' : v === false || v == null || v === '' ? '' : E(String(v).length > 70 ? String(v).slice(0, 70) + '…' : v));

async function collView(c: Coll, id?: string): Promise<void> {
  if (id) return editView(c, id);
  let q = sb!.from(c.table).select('*');
  for (const o of c.order) q = q.order(o, { ascending: o !== 'year', nullsFirst: false });
  const { data, error } = await q;
  if (error) { flash(false, error.message); }
  const rows: Row[] = data ?? [];
  const label = (k: string) => c.fields.find((f) => f.k === k)?.label ?? k;
  const extra = c.key === 'needs' ? needsTools() : '';
  shell('c/' + c.key, `<div class="bar"><div><h1>${E(c.title)}</h1><p class="sub">${E(c.note ?? '')}</p></div><div><a class="btn" href="#/c/${c.key}/new">Add new</a></div></div>${extra}<div class="wrap"><table><thead><tr>${c.cols.map((k) => `<th>${E(label(k))}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r) => `<tr>${c.cols.map((k) => `<td>${cell(r[k])}</td>`).join('')}<td class="act"><a class="btn o" href="#/c/${c.key}/${r.id}">Edit</a> <button class="btn d" data-del="${r.id}">Delete</button></td></tr>`).join('') || `<tr><td colspan="${c.cols.length + 1}" class="muted">Nothing here yet.</td></tr>`}</tbody></table></div>`);
  document.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) => (b.onclick = async () => {
    if (!confirm('Delete this entry permanently?')) return;
    const row = rows.find((r) => String(r.id) === b.dataset.del)!;
    const { error: er } = await sb!.from(c.table).delete().eq('id', row.id);
    if (er) flash(false, er.message);
    else {
      flash(true, 'Deleted.');
      for (const f of c.fields) if (f.type === 'file' && row[f.k]) await sb!.storage.from(f.bucket!).remove([row[f.k]]); // best effort
    }
    collView(c);
  }));
  if (c.key === 'needs') wireNeedsTools();
}

async function editView(c: Coll, id: string): Promise<void> {
  let old: Row = {};
  if (id !== 'new') {
    const { data, error } = await sb!.from(c.table).select('*').eq('id', id).single();
    if (error || !data) { flash(false, 'That entry could not be found.'); return collView(c); }
    old = data;
  } else {
    for (const f of c.fields) if (f.k === 'is_published') old[f.k] = true;
    if (c.key === 'needs') { const { data } = await sb!.from('needs').select('number').order('number', { ascending: false }).limit(1); old.number = ((data?.[0]?.number as number) ?? 0) + 1; }
  }
  shell('c/' + c.key, `<h1>${id === 'new' ? 'Add' : 'Edit'}: ${E(c.title)}</h1><p class="sub"><a href="#/c/${c.key}">Back to list</a></p><form id="f" class="card">${c.fields.map((f) => fieldHtml(f, old[f.k])).join('')}<div class="row"><button class="btn">Save changes</button><a class="btn o" href="#/c/${c.key}">Cancel</a></div></form>`);
  const form = document.getElementById('f') as HTMLFormElement;
  form.onsubmit = async (e) => {
    e.preventDefault(); busy(form, true);
    try {
      const row = await readForm(form, c.fields, old, c.table);
      if (c.key === 'needs' && row.is_sample === undefined) row.is_sample = false;
      const { error } = id === 'new' ? await sb!.from(c.table).insert(row) : await sb!.from(c.table).update(row).eq('id', id);
      if (error) throw new Error(error.message.includes('duplicate') ? 'That number is already used. Choose another.' : error.message);
      flash(true, 'Saved.'); location.hash = `#/c/${c.key}`;
    } catch (err) { flash(false, (err as Error).message); busy(form, false); form.insertAdjacentHTML('afterbegin', showNotice()); }
  };
}

/* ---------- needs: CSV import and sample cleanup ---------- */
const needsTools = () => `<div class="card"><h3 style="margin-bottom:6px">Bulk import</h3><p class="muted" style="margin-bottom:10px">Paste rows as CSV: <code>number,title,area,setting,description</code>. Existing numbers are updated. A header row is allowed.</p><textarea id="csv" placeholder="1,Need title,Cardiology,Referral hospital,Description"></textarea><div class="row"><button class="btn" id="imp">Import rows</button><button class="btn d" id="rmsample">Remove all sample needs</button></div></div>`;

function parseCsv(t: string): string[][] {
  const rows: string[][] = []; let r: string[] = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { r.push(c); c = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(c); rows.push(r); r = []; c = ''; }
    else c += ch;
  }
  if (c || r.length) { r.push(c); rows.push(r); }
  return rows.filter((x) => x.some((y) => y.trim()));
}

function wireNeedsTools() {
  const c = COLLS.find((x) => x.key === 'needs')!;
  document.getElementById('imp')!.onclick = async () => {
    const rows = parseCsv((document.getElementById('csv') as HTMLTextAreaElement).value).filter((r) => /^\d+$/.test(r[0].trim()));
    if (!rows.length) { flash(false, 'No valid rows found. Each row must start with a number.'); return collView(c); }
    const payload = rows.map((r) => ({ number: Number(r[0]), title: (r[1] ?? '').trim() || `Need ${r[0]}`, area: (r[2] ?? '').trim(), setting: (r[3] ?? '').trim(), description: (r[4] ?? '').trim(), status: 'Identified', is_sample: false }));
    const { error } = await sb!.from('needs').upsert(payload, { onConflict: 'number' });
    flash(!error, error ? error.message : `Imported ${payload.length} needs.`); collView(c);
  };
  document.getElementById('rmsample')!.onclick = async () => {
    if (!confirm('Delete every need marked as sample data?')) return;
    const { error } = await sb!.from('needs').delete().eq('is_sample', true);
    flash(!error, error ? error.message : 'Sample needs removed.'); collView(c);
  };
}

/* ---------- messages ---------- */
async function messagesView() {
  const { data, error } = await sb!.from('contact_messages').select('*').order('created_at', { ascending: false });
  if (error) flash(false, error.message);
  const rows: Row[] = data ?? [];
  shell('messages', `<h1>Contact messages</h1><p class="sub">Messages sent through the public contact form. Only admins can read them.</p>${rows.map((m) => `<details class="card"><summary><b>${E(m.subject)}</b> ${m.is_read ? '' : '<span class="tag">New</span>'}<br><span class="muted">${E(m.name)} · ${E(m.email)} · ${new Date(m.created_at).toLocaleString()}</span></summary><p style="margin:14px 0;white-space:pre-wrap">${E(m.message)}</p><div class="row"><a class="btn" href="mailto:${E(m.email)}?subject=${encodeURIComponent('Re: ' + m.subject)}">Reply by email</a><button class="btn o" data-read="${m.id}" data-v="${!m.is_read}">${m.is_read ? 'Mark unread' : 'Mark read'}</button><button class="btn d" data-rm="${m.id}">Delete</button></div></details>`).join('') || '<p class="muted">No messages yet.</p>'}`);
  document.querySelectorAll<HTMLButtonElement>('[data-read]').forEach((b) => (b.onclick = async () => { await sb!.from('contact_messages').update({ is_read: b.dataset.v === 'true' }).eq('id', b.dataset.read!); messagesView(); }));
  document.querySelectorAll<HTMLButtonElement>('[data-rm]').forEach((b) => (b.onclick = async () => { if (confirm('Delete this message?')) { await sb!.from('contact_messages').delete().eq('id', b.dataset.rm!); messagesView(); } }));
}

/* ---------- router ---------- */
async function render() {
  const [, kind, key, id] = location.hash.replace(/^#/, '').split('/');
  if (kind === 's') return settingsView(key);
  if (kind === 'c') { const c = COLLS.find((x) => x.key === key); if (c) return collView(c, id); }
  if (kind === 'messages') return messagesView();
  shell('', `<h1>CORE5 dashboard</h1><p class="sub">Choose what to edit from the menu. Everything you save appears on the public website straight away.</p>${showNotice()}<div class="card"><b>Suggested order</b><ol style="margin:8px 0 0 20px"><li>Contact details and Supervision, so the footer and contact page are complete.</li><li>Healthcare needs: import your real list, then remove the sample needs.</li><li>Team profiles with photographs.</li><li>Project stages: set each status to match real progress.</li></ol></div>`);
}

if (!sb) {
  app.innerHTML = '<div class="login"><div class="logo">CORE<span>5</span> Admin</div><div class="msg bad" style="margin-top:16px">Supabase is not configured. Copy .env.example to .env and add your project URL and publishable key.</div></div>';
} else {
  sb.auth.onAuthStateChange((ev) => { if (ev === 'PASSWORD_RECOVERY') loginView('', true); });
  addEventListener('hashchange', () => { sb!.auth.getSession().then(({ data }) => { if (data.session && !document.querySelector('.login')) render(); }); });
  start();
}
