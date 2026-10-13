// Generates animated SVGs + README.md for a GitHub profile repo. Zero dependencies, Node 20+.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const CFG = {
  user: process.env.GH_USER || 'xchan404',
  tagline: 'Software engineer building systems',   // used when your GitHub bio is empty
  maxLangs: 6,
  maxReposPerLang: 6,
};
const TOKEN = process.env.GH_TOKEN || '';
const ROOT = new URL('../', import.meta.url);
const HEAD = { Accept: 'application/vnd.github+json', 'User-Agent': 'profile-readme-generator',
  ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }) };

/* ---------------- themes ---------------- */
export const THEMES = {
  anime: { bg: '#14122b', panel: '#1f1b44', ink: '#f6f1ff', mute: '#bdb6e3', line: '#f6f1ff', a: '#ff7eb6', b: '#5ee7ff',
    lv: ['#2a2560', '#6b3a78', '#a8498f', '#ff7eb6', '#ffd1e6'], bars: ['#ff7eb6', '#5ee7ff', '#ffd166', '#a78bfa', '#7ee081', '#ff9f68'],
    shadow: true, fx: true, round: false },
  neutral: { bg: '#ffffff', panel: '#f4f4f1', ink: '#1b1b1b', mute: '#545454', line: '#c9c9c4', a: '#2f4bc4', b: '#2f4bc4',
    lv: ['#e6e6e1', '#c3cdf2', '#8fa3e6', '#5870d3', '#2f4bc4'], bars: ['#2f4bc4', '#5870d3', '#8fa3e6', '#6b7280', '#9ca3af', '#c3cdf2'],
    shadow: false, fx: false, round: true },
};

/* ---------------- svg helpers ---------------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FONT_D = `'Arial Black','Segoe UI Black',Impact,sans-serif`;
const FONT_B = `system-ui,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;
const n = (v) => Number(v).toLocaleString('en-US');
const css = (t, extra = '') =>
  `text{font-family:${FONT_B}}.d{font-family:${FONT_D};font-style:italic}` +
  `.snap{transform-box:fill-box;transform-origin:center;animation:snap ${t.fx ? 0.6 : 0.3}s cubic-bezier(.2,.9,.3,1.2) both}` +
  `@keyframes snap{from{opacity:0;transform:translateY(16px) scale(.97)}}${extra}` +
  `@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;
const svg = (w, h, title, desc, style, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">` +
  `<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc><style>${style}</style>${body}</svg>`;
const panel = (t, x, y, w, h) =>
  (t.shadow ? `<rect x="${x + 6}" y="${y + 6}" width="${w}" height="${h}" fill="${t.a}"/>` : '') +
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${t.panel}" stroke="${t.line}" stroke-width="2"/>`;

/* ---------------- components ---------------- */
export function header(t, d) {
  const cx = 450, cy = 150;
  let fx = '';
  if (t.fx) {
    let rays = '', petals = '';
    for (let i = 0; i < 30; i++) {
      const a = (i * 12 * Math.PI) / 180, b = ((i * 12 + 4) * Math.PI) / 180, R = 800;
      rays += `<path d="M${cx} ${cy}L${(cx + R * Math.cos(a)).toFixed(1)} ${(cy + R * Math.sin(a)).toFixed(1)}L${(cx + R * Math.cos(b)).toFixed(1)} ${(cy + R * Math.sin(b)).toFixed(1)}Z"/>`;
    }
    for (let i = 0; i < 12; i++) {
      const x = 30 + ((i * 197) % 840), drift = (i % 2 ? 1 : -1) * (30 + i * 6);
      petals += `<path class="petal" style="--x:${drift}px;animation-duration:${9 + ((i * 7) % 8)}s;animation-delay:-${(i * 5) % 14}s" d="M${x} -20q12 8 0 20q-12-12 0-20z"/>`;
    }
    fx = `<clipPath id="pc"><rect x="2" y="2" width="886" height="286"/></clipPath>` +
      `<g clip-path="url(#pc)"><g class="rays" fill="${t.b}" opacity=".13">${rays}</g><g fill="${t.a}" opacity=".8">${petals}</g></g>`;
  }
  const av = d.avatar
    ? `<clipPath id="av">${t.round ? '<circle cx="150" cy="150" r="80"/>' : '<rect x="70" y="70" width="160" height="160"/>'}</clipPath>` +
      (t.shadow ? `<rect x="80" y="80" width="160" height="160" fill="${t.b}"/>` : '') +
      `<image href="${d.avatar}" x="70" y="70" width="160" height="160" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice"/>` +
      (t.round ? `<circle cx="150" cy="150" r="80" fill="none" stroke="${t.a}" stroke-width="4"/>` : `<rect x="70" y="70" width="160" height="160" fill="none" stroke="${t.a}" stroke-width="4"/>`)
    : (t.shadow ? `<rect x="80" y="80" width="160" height="160" fill="${t.b}"/>` : '') +
      (t.round ? `<circle cx="150" cy="150" r="80" fill="${t.a}"/>` : `<rect x="70" y="70" width="160" height="160" fill="${t.a}" stroke="${t.line}" stroke-width="4"/>`) +
      `<text class="d" x="150" y="180" font-size="90" font-weight="900" text-anchor="middle" fill="${t.bg}">${esc(d.name[0] || '?')}</text>`;
  const fs = Math.max(30, Math.min(54, Math.floor(560 / (d.name.length * 0.62))));
  const extra = `.petal{transform-box:fill-box;transform-origin:center;animation:fall 10s linear infinite}` +
    `@keyframes fall{from{transform:translate(0,0) rotate(0)}to{transform:translate(var(--x),340px) rotate(540deg)}}` +
    `.rays{transform-origin:${cx}px ${cy}px;transform-box:view-box;animation:spin 90s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}` +
    `.name{animation:slide .7s steps(8,end) .15s both}@keyframes slide{from{opacity:0;transform:translateX(-36px)}}`;
  const body = `<rect width="900" height="300" fill="${t.bg}"/>` + panel(t, 2, 2, 886, 286) + fx +
    `<g class="snap">${av}</g>` +
    `<text class="d name" x="270" y="150" font-size="${fs}" font-weight="900" fill="${t.ink}">${esc(d.name)}</text>` +
    `<text x="272" y="190" font-size="22" fill="${t.b}">@${esc(d.login)}</text>` +
    `<text x="272" y="228" font-size="18" fill="${t.mute}">${esc((d.bio || CFG.tagline).slice(0, 70))}</text>`;
  return svg(900, 300, `${d.name} on GitHub`, `Profile header for ${d.name}, @${d.login}`, css(t, extra), body);
}

export function stats(t, d) {
  const tiles = d.stats.map((s, i) => {
    const x = 2 + i * 229;
    return `<g class="snap" style="animation-delay:${(0.2 + i * 0.08).toFixed(2)}s">${panel(t, x, 4, 205, 130)}` +
      `<text x="${x + 18}" y="44" font-size="15" fill="${t.mute}">${esc(s.k)}</text>` +
      `<text class="d" x="${x + 18}" y="104" font-size="46" font-weight="900" fill="${t.ink}">${n(s.v)}</text></g>`;
  }).join('');
  return svg(900, 150, 'GitHub numbers', d.stats.map((s) => `${n(s.v)} ${s.k.toLowerCase()}`).join(', '), css(t), tiles);
}

export function languages(t, d) {
  const rows = d.langs.slice(0, CFG.maxLangs);
  const tot = d.langs.reduce((s, [, v]) => s + v, 0) || 1;
  const H = 36 + Math.max(rows.length, 1) * 38;
  const extra = `.bar{transform-box:fill-box;transform-origin:left center;animation:grow .9s cubic-bezier(.2,.8,.3,1) both}@keyframes grow{from{transform:scaleX(0)}}`;
  const items = rows.length ? rows.map(([name, bytes], i) => {
    const pct = (bytes / tot) * 100, y = 36 + i * 38;
    return `<text x="24" y="${y}" font-size="16" fill="${t.ink}">${esc(name)}</text>` +
      `<text x="176" y="${y}" font-size="16" text-anchor="end" fill="${t.mute}">${pct.toFixed(1)}%</text>` +
      `<rect x="196" y="${y - 13}" width="676" height="14" fill="${t.bg}" stroke="${t.line}" stroke-opacity=".35"/>` +
      `<rect class="bar" style="animation-delay:${(0.2 + i * 0.1).toFixed(2)}s" x="196" y="${y - 13}" width="${Math.max(4, (676 * pct) / 100).toFixed(1)}" height="14" fill="${t.bars[i % t.bars.length]}"/>`;
  }).join('') : `<text x="24" y="40" font-size="16" fill="${t.mute}">No language data yet.</text>`;
  return svg(900, H + 10, 'Top languages', rows.map(([k, v]) => `${k} ${((v / tot) * 100).toFixed(1)}%`).join(', '), css(t, extra), panel(t, 2, 2, 886, H - 6) + items);
}

export function contrib(t, cal) {
  if (!cal) {
    return svg(900, 90, 'Contribution graph unavailable', 'Needs an API token to load', css(t),
      panel(t, 2, 2, 886, 74) + `<text x="24" y="46" font-size="16" fill="${t.mute}">Contribution graph appears after the Action runs with a token (see README setup).</text>`);
  }
  const weeks = cal.weeks.slice(-53);
  const max = Math.max(1, ...weeks.flatMap((w) => w.contributionDays.map((x) => x.contributionCount)));
  const lvl = (c) => (c === 0 ? 0 : Math.min(4, Math.ceil((4 * c) / max)));
  const rx = t.round ? 3 : 0;
  const cols = weeks.map((w, i) => `<g class="pop" style="animation-delay:${(i * 0.025).toFixed(3)}s">` +
    w.contributionDays.map((day) => `<rect x="${26 + i * 16}" y="${56 + new Date(day.date).getUTCDay() * 16}" width="13" height="13" rx="${rx}" fill="${t.lv[lvl(day.contributionCount)]}"><title>${esc(day.date)}: ${day.contributionCount}</title></rect>`).join('') + '</g>').join('');
  const legend = `<text x="640" y="196" font-size="13" fill="${t.mute}">Less</text>` +
    t.lv.map((c, i) => `<rect x="${676 + i * 18}" y="185" width="13" height="13" rx="${rx}" fill="${c}"/>`).join('') +
    `<text x="772" y="196" font-size="13" fill="${t.mute}">More</text>`;
  const extra = `.pop{transform-box:fill-box;transform-origin:center;animation:pop .45s ease-out both}@keyframes pop{from{opacity:0;transform:translateY(6px)}}`;
  const total = `${n(cal.totalContributions)} contributions in the last year`;
  return svg(900, 214, total, total, css(t, extra),
    panel(t, 2, 2, 886, 200) + `<text class="d" x="26" y="38" font-size="20" font-weight="900" fill="${t.ink}">${total}</text>` + cols + legend);
}

/* ---------------- data ---------------- */
const rest = async (p) => {
  const r = await fetch('https://api.github.com' + p, { headers: HEAD });
  if (!r.ok) throw new Error(`${p} -> ${r.status}`);
  return r.json();
};
async function calendar() {
  if (!TOKEN) return null;
  try {
    const query = 'query($u:String!){user(login:$u){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}';
    const r = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { ...HEAD, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { u: CFG.user } }) });
    return (await r.json())?.data?.user?.contributionsCollection?.contributionCalendar ?? null;
  } catch { return null; }
}
async function avatar(url) {
  try {
    const r = await fetch(url + (url.includes('?') ? '&' : '?') + 's=240');
    if (!r.ok) return null;
    return `data:${r.headers.get('content-type') || 'image/png'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
  } catch { return null; }
}
async function langBytes(repos) {
  const tot = {};
  await Promise.all(repos.slice(0, 40).map(async (r) => {
    try { for (const [k, v] of Object.entries(await rest(`/repos/${r.full_name}/languages`))) tot[k] = (tot[k] || 0) + v; } catch { /* skip */ }
  }));
  return Object.entries(tot).sort((a, b) => b[1] - a[1]);
}
function reposBlock(repos) {
  const by = {};
  repos.forEach((r) => (by[r.language || 'Other'] ||= []).push(r));
  return Object.entries(by).sort((a, b) => b[1].length - a[1].length).map(([lang, rs]) =>
    `<details>\n<summary><b>${esc(lang)}</b> (${rs.length})</summary>\n\n` +
    rs.slice(0, CFG.maxReposPerLang).map((r) => `- [**${r.name}**](${r.html_url}): ${esc(r.description || 'No description')} (${r.stargazers_count} stars, ${r.forks_count} forks)`).join('\n') +
    '\n\n</details>').join('\n\n');
}

async function main() {
  const user = await rest(`/users/${CFG.user}`);
  const repos = (await rest(`/users/${CFG.user}/repos?per_page=100&sort=pushed&type=owner`)).filter((r) => !r.fork);
  repos.sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at));
  const [langs, cal, av] = await Promise.all([langBytes(repos), calendar(), avatar(user.avatar_url)]);
  const sum = (k) => repos.reduce((s, r) => s + r[k], 0);
  const d = { name: user.name || user.login, login: user.login, bio: user.bio, avatar: av, langs,
    stats: [{ k: 'Repositories', v: user.public_repos }, { k: 'Stars earned', v: sum('stargazers_count') },
      { k: 'Forks', v: sum('forks_count') }, { k: 'Followers', v: user.followers }] };
  await mkdir(new URL('assets/', ROOT), { recursive: true });
  for (const [name, t] of Object.entries(THEMES)) {
    await writeFile(new URL(`assets/${name}-header.svg`, ROOT), header(t, d));
    await writeFile(new URL(`assets/${name}-stats.svg`, ROOT), stats(t, d));
    await writeFile(new URL(`assets/${name}-languages.svg`, ROOT), languages(t, d));
    await writeFile(new URL(`assets/${name}-contrib.svg`, ROOT), contrib(t, cal));
  }
  const tot = langs.reduce((s, [, v]) => s + v, 0) || 1;
  const map = {
    USER: user.login, DATE: new Date().toISOString().slice(0, 10), REPOS: reposBlock(repos),
    HEADER_ALT: `${d.name}, @${d.login}`,
    STATS_ALT: 'GitHub numbers: ' + d.stats.map((s) => `${n(s.v)} ${s.k.toLowerCase()}`).join(', '),
    LANG_ALT: 'Top languages by code size: ' + (langs.slice(0, CFG.maxLangs).map(([k, v]) => `${k} ${((v / tot) * 100).toFixed(1)}%`).join(', ') || 'none yet'),
    CONTRIB_ALT: cal ? `${n(cal.totalContributions)} contributions in the last year` : 'Contribution graph not available yet',
  };
  let md = await readFile(new URL('README.template.md', ROOT), 'utf8');
  for (const [k, v] of Object.entries(map)) md = md.split(`{{${k}}}`).join(v);
  await writeFile(new URL('README.md', ROOT), md);
  console.log(`done: ${repos.length} repos, ${langs.length} languages, calendar=${!!cal}, avatar=${!!av}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e); process.exit(1); });
