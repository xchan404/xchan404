// generate.mjs: one file that builds the whole animated profile (SVGs, README.md, workflow). Node 20+, no dependencies.
// Run:  node generate.mjs     (optional: GH_TOKEN=... enables the contribution graph)
import { writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const CFG = {
  user: process.env.GH_USER || 'xchan404',
  tagline: 'Software engineer building systems',            // shown when your GitHub bio is empty
  intro: 'Computer Science (Software Engineering) at Alamein International University. Open to internships, open-source collaboration, and systems engineering roles.',
  links: [['LinkedIn', 'https://www.linkedin.com/in/mohamed-soliman-aa3b26287/']],
  currently: [['KETA', 'kernel memory forensics research on Android ARM64'], ['UniHub', 'verified campus marketplace'], ['Genesis', 'distributed P2P framework']],
  maxLangs: 6,
  maxReposPerLang: 6,
};
const TOKEN = process.env.GH_TOKEN || '';
const ROOT = new URL('./', import.meta.url);
const HEAD = { Accept: 'application/vnd.github+json', 'User-Agent': 'profile-readme-generator', ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }) };

export const THEMES = {
  anime: { bg: '#14122b', panel: '#1f1b44', ink: '#f6f1ff', mute: '#bdb6e3', line: '#f6f1ff', a: '#ff7eb6', b: '#5ee7ff', cut: 16,
    sky: ['#0f0c29', '#1a1445', '#2b1d5c', '#4a2a73', '#7a3a85'],
    lv: ['#2a2560', '#6b3a78', '#a8498f', '#ff7eb6', '#ffd1e6'], bars: ['#ff7eb6', '#5ee7ff', '#ffd166', '#a78bfa', '#7ee081', '#ff9f68'], fx: true, round: false },
  neutral: { bg: '#ffffff', panel: '#f4f4f1', ink: '#1b1b1b', mute: '#545454', line: '#c9c9c4', a: '#2f4bc4', b: '#2f4bc4', cut: 0,
    lv: ['#e6e6e1', '#c3cdf2', '#8fa3e6', '#5870d3', '#2f4bc4'], bars: ['#2f4bc4', '#5870d3', '#8fa3e6', '#6b7280', '#9ca3af', '#c3cdf2'], fx: false, round: true },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FONT_D = `'Arial Black','Segoe UI Black',Impact,sans-serif`;
const FONT_B = `system-ui,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;
const n = (v) => Number(v).toLocaleString('en-US');
const rng = (s) => () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const css = (t, extra = '') =>
  `text{font-family:${FONT_B}}.d{font-family:${FONT_D};font-style:italic}` +
  `.snap{transform-box:fill-box;transform-origin:center;animation:snap ${t.fx ? 0.6 : 0.3}s cubic-bezier(.2,.9,.3,1.2) both}` +
  `@keyframes snap{from{opacity:0;transform:translateY(16px) scale(.97)}}${extra}` +
  `@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;
const svg = (w, h, title, desc, style, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">` +
  `<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc><style>${style}</style>${body}</svg>`;
// cut-corner polygon (top-right and bottom-left corners sliced), the shape language of the whole profile
const poly = (x, y, w, h, c) => `${x},${y} ${x + w - c},${y} ${x + w},${y + c} ${x + w},${y + h} ${x + c},${y + h} ${x},${y + h - c}`;
const panel = (t, x, y, w, h, c = t.cut) =>
  (t.fx ? `<polygon points="${poly(x + 6, y + 6, w, h, c)}" fill="${t.a}"/>` : '') +
  `<polygon points="${poly(x, y, w, h, c)}" fill="${t.panel}" stroke="${t.line}" stroke-width="2" stroke-linejoin="round"/>`;

/* ---------------- components ---------------- */
function scene(t) {
  const r = rng(7), Y = [0, 70, 120, 165, 205], Hh = [70, 50, 45, 40, 130];
  let s = t.sky.map((c, i) => `<rect y="${Y[i]}" width="900" height="${Hh[i]}" fill="${c}"/>`).join('');
  for (let i = 0; i < 38; i++)
    s += `<circle class="tw" style="animation-duration:${(2 + r() * 3).toFixed(1)}s;animation-delay:-${(r() * 4).toFixed(1)}s" cx="${(r() * 900).toFixed(0)}" cy="${(r() * 170).toFixed(0)}" r="${(0.8 + r() * 1.3).toFixed(1)}" fill="#fff"/>`;
  s += `<g class="moon"><circle cx="812" cy="92" r="52" fill="none" stroke="#ffd166" stroke-opacity=".3" stroke-width="3"/>` +
    `<circle cx="812" cy="92" r="38" fill="#fff3d6"/><circle cx="802" cy="83" r="7" fill="#f0dcb8"/><circle cx="824" cy="101" r="4" fill="#f0dcb8"/></g>`;
  for (let x = 0; x < 900; ) { const w = 18 + r() * 26, h = 34 + r() * 56; s += `<rect x="${x.toFixed(0)}" y="${(330 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#2a1f5e"/>`; x += w + 2; }
  let wins = '';
  for (let x = -10; x < 900; ) {
    const w = 30 + r() * 40, h = 44 + r() * 58, top = 330 - h;
    s += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#14102e"/>`;
    if (r() < 0.3) s += `<rect x="${(x + w / 2).toFixed(0)}" y="${(top - 16).toFixed(0)}" width="2" height="16" fill="#14102e"/>`;
    for (let cx = x + 6; cx < x + w - 10; cx += 11) for (let cy = top + 8; cy < 322; cy += 14)
      if (r() < 0.2) wins += `<rect class="win" style="animation-duration:${(4 + r() * 5).toFixed(1)}s;animation-delay:-${(r() * 6).toFixed(1)}s" x="${cx.toFixed(0)}" y="${cy.toFixed(0)}" width="5" height="7" fill="#ffd166"/>`;
    x += w + 3;
  }
  let petals = '';
  for (let i = 0; i < 12; i++) {
    const x = 30 + ((i * 197) % 840), drift = (i % 2 ? 1 : -1) * (30 + i * 6);
    petals += `<path class="petal" style="--x:${drift}px;animation-duration:${9 + ((i * 7) % 8)}s;animation-delay:-${(i * 5) % 14}s" d="M${x} -20q12 8 0 20q-12-12 0-20z"/>`;
  }
  return s + wins + `<g fill="${t.a}" opacity=".85">${petals}</g>`;
}

export function header(t, d) {
  const fs = Math.max(30, Math.min(48, Math.floor(500 / (d.name.length * 0.62))));
  const frame = poly(48, 60, 170, 170, 20);
  const letter = `<text class="d" x="133" y="170" font-size="90" font-weight="900" text-anchor="middle" fill="${t.bg}">${esc(d.name[0] || '?')}</text>`;
  const img = d.avatar ? `<image href="${d.avatar}" x="48" y="60" width="170" height="170" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice"/>` : `<polygon points="${frame}" fill="${t.a}"/>${letter}`;
  if (!t.fx) {
    const body = `<rect width="900" height="330" fill="${t.bg}"/>` + panel(t, 2, 2, 886, 300, 0) +
      `<clipPath id="av"><circle cx="133" cy="152" r="80"/></clipPath>` + (d.avatar ? `<image href="${d.avatar}" x="53" y="72" width="160" height="160" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice"/>` : `<circle cx="133" cy="152" r="80" fill="${t.a}"/>`) +
      `<circle cx="133" cy="152" r="80" fill="none" stroke="${t.a}" stroke-width="4"/>` +
      `<text class="d" x="256" y="160" font-size="${fs}" font-weight="900" fill="${t.ink}">${esc(d.name)}</text>` +
      `<text x="258" y="200" font-size="22" fill="${t.b}">@${esc(d.login)}</text><text x="258" y="238" font-size="18" fill="${t.mute}">${esc((d.bio || CFG.tagline).slice(0, 70))}</text>`;
    return svg(900, 330, `${d.name} on GitHub`, `Profile header for ${d.name}, @${d.login}`, css(t), body);
  }
  const hp = '3,3 863,3 887,27 887,317 27,317 3,293';
  const extra = `.tw{animation:tw 3s ease-in-out infinite}@keyframes tw{50%{opacity:.25}}` +
    `.win{animation:blink 6s linear infinite}@keyframes blink{0%,86%,100%{opacity:1}90%{opacity:.15}}` +
    `.moon{transform-box:fill-box;transform-origin:center;animation:breathe 7s ease-in-out infinite}@keyframes breathe{50%{transform:scale(1.04)}}` +
    `.petal{transform-box:fill-box;transform-origin:center;animation:fall 10s linear infinite}@keyframes fall{from{transform:translate(0,0) rotate(0)}to{transform:translate(var(--x),360px) rotate(540deg)}}` +
    `.name{animation:slide .7s steps(8,end) .15s both}@keyframes slide{from{opacity:0;transform:translateX(-36px)}}` +
    `.rule{transform-box:fill-box;transform-origin:left center;animation:grow .6s cubic-bezier(.2,.8,.3,1) .7s both}@keyframes grow{from{transform:scaleX(0)}}`;
  const body = `<clipPath id="hp"><polygon points="${hp}"/></clipPath><clipPath id="av"><polygon points="${frame}"/></clipPath>` +
    `<polygon points="${hp}" transform="translate(7 7)" fill="${t.a}"/><g clip-path="url(#hp)">${scene(t)}</g>` +
    `<polygon points="${hp}" fill="none" stroke="${t.line}" stroke-width="3" stroke-linejoin="round"/>` +
    `<g class="snap"><polygon points="${frame}" transform="translate(8 8)" fill="${t.b}"/>${img}<polygon points="${frame}" fill="none" stroke="${t.a}" stroke-width="4" stroke-linejoin="round"/></g>` +
    `<g class="name"><text class="d" x="260" y="126" font-size="${fs}" font-weight="900" fill="none" stroke="${t.a}" stroke-width="2" transform="translate(4 4)">${esc(d.name)}</text>` +
    `<text class="d" x="260" y="126" font-size="${fs}" font-weight="900" fill="${t.ink}">${esc(d.name)}</text></g>` +
    `<polygon class="rule" points="262,140 392,140 384,148 254,148" fill="${t.a}"/>` +
    `<text x="262" y="176" font-size="22" font-weight="700" fill="${t.b}">@${esc(d.login)}</text>` +
    `<text x="262" y="210" font-size="18" fill="#efe6ff">${esc((d.bio || CFG.tagline).slice(0, 70))}</text>`;
  return svg(900, 330, `${d.name} on GitHub`, `Night city scene with moon and falling sakura petals. Profile header for ${d.name}, @${d.login}`, css(t, extra), body);
}

export function banner(t, text) {
  const body = panel(t, 2, 4, 886, 44, t.fx ? 14 : 0) +
    (t.fx ? `<polygon points="2,4 20,4 8,48 2,48" fill="${t.a}"/><polygon points="26,4 34,4 22,48 14,48" fill="${t.b}" opacity=".9"/>` : `<rect x="2" y="4" width="6" height="44" fill="${t.a}"/>`) +
    `<text class="d" x="${t.fx ? 54 : 24}" y="35" font-size="22" font-weight="900" fill="${t.ink}">${esc(text)}</text>`;
  return svg(900, 56, text, text, css(t), body);
}

export function stats(t, d) {
  const tiles = d.stats.map((s, i) => {
    const x = 2 + i * 229;
    return `<g class="snap" style="animation-delay:${(0.2 + i * 0.08).toFixed(2)}s">${panel(t, x, 4, 205, 130)}` +
      `<polygon points="${x + 18},22 ${x + 62},22 ${x + 56},28 ${x + 18},28" fill="${t.a}"/>` +
      `<text x="${x + 18}" y="58" font-size="15" fill="${t.mute}">${esc(s.k)}</text>` +
      `<text class="d" x="${x + 18}" y="108" font-size="46" font-weight="900" fill="${t.ink}">${n(s.v)}</text></g>`;
  }).join('');
  return svg(900, 150, 'GitHub numbers', d.stats.map((s) => `${n(s.v)} ${s.k.toLowerCase()}`).join(', '), css(t), tiles);
}

export function languages(t, d) {
  const rows = d.langs.slice(0, CFG.maxLangs), tot = d.langs.reduce((s, [, v]) => s + v, 0) || 1, H = 36 + Math.max(rows.length, 1) * 38;
  const extra = `.bar{transform-box:fill-box;transform-origin:left center;animation:grow .9s cubic-bezier(.2,.8,.3,1) both}@keyframes grow{from{transform:scaleX(0)}}`;
  const sk = (x, y, w) => `${x + 6},${y} ${x + w + 6},${y} ${x + w},${y + 14} ${x},${y + 14}`;
  const items = rows.length ? rows.map(([name, bytes], i) => {
    const pct = (bytes / tot) * 100, y = 36 + i * 38, w = Math.max(6, (670 * pct) / 100);
    return `<text x="28" y="${y}" font-size="16" fill="${t.ink}">${esc(name)}</text><text x="178" y="${y}" font-size="16" text-anchor="end" fill="${t.mute}">${pct.toFixed(1)}%</text>` +
      `<polygon points="${sk(196, y - 13, 670)}" fill="${t.bg}" stroke="${t.line}" stroke-opacity=".35"/>` +
      `<polygon class="bar" style="animation-delay:${(0.2 + i * 0.1).toFixed(2)}s" points="${sk(196, y - 13, w)}" fill="${t.bars[i % t.bars.length]}"/>`;
  }).join('') : `<text x="28" y="40" font-size="16" fill="${t.mute}">No language data yet.</text>`;
  return svg(900, H + 10, 'Top languages', rows.map(([k, v]) => `${k} ${((v / tot) * 100).toFixed(1)}%`).join(', '), css(t, extra), panel(t, 2, 2, 886, H - 6) + items);
}

export function contrib(t, cal) {
  if (!cal) return svg(900, 90, 'Contribution graph unavailable', 'Needs an API token', css(t), panel(t, 2, 2, 886, 74) + `<text x="28" y="46" font-size="16" fill="${t.mute}">Contribution graph appears when the Action runs with a token (see setup notes).</text>`);
  const weeks = cal.weeks.slice(-53), max = Math.max(1, ...weeks.flatMap((w) => w.contributionDays.map((x) => x.contributionCount)));
  const lvl = (c) => (c === 0 ? 0 : Math.min(4, Math.ceil((4 * c) / max))), rx = t.round ? 3 : 0;
  const cols = weeks.map((w, i) => `<g class="pop" style="animation-delay:${(i * 0.025).toFixed(3)}s">` + w.contributionDays.map((day) =>
    `<rect x="${26 + i * 16}" y="${56 + new Date(day.date).getUTCDay() * 16}" width="13" height="13" rx="${rx}" fill="${t.lv[lvl(day.contributionCount)]}"><title>${esc(day.date)}: ${day.contributionCount}</title></rect>`).join('') + '</g>').join('');
  const legend = `<text x="640" y="196" font-size="13" fill="${t.mute}">Less</text>` + t.lv.map((c, i) => `<rect x="${676 + i * 18}" y="185" width="13" height="13" rx="${rx}" fill="${c}"/>`).join('') + `<text x="772" y="196" font-size="13" fill="${t.mute}">More</text>`;
  const extra = `.pop{transform-box:fill-box;transform-origin:center;animation:pop .45s ease-out both}@keyframes pop{from{opacity:0;transform:translateY(6px)}}`;
  const total = `${n(cal.totalContributions)} contributions in the last year`;
  return svg(900, 214, total, total, css(t, extra), panel(t, 2, 2, 886, 200) + `<text class="d" x="26" y="38" font-size="20" font-weight="900" fill="${t.ink}">${total}</text>` + cols + legend);
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

const WORKFLOW = [
  'name: Update profile', 'on:', "  schedule: [{ cron: '17 3 * * *' }]", '  workflow_dispatch:', '  push:', '    branches: [main]', "    paths: ['generate.mjs']",
  'permissions:', '  contents: write', 'concurrency: { group: profile, cancel-in-progress: true }', 'jobs:', '  build:', '    runs-on: ubuntu-latest', '    steps:',
  '      - uses: actions/checkout@v4', '      - uses: actions/setup-node@v4', '        with: { node-version: 20 }', '      - run: node generate.mjs', '        env:',
  '          GH_USER: ${{ github.repository_owner }}', '          GH_TOKEN: ${{ secrets.PROFILE_TOKEN || secrets.GITHUB_TOKEN }}', '      - name: Commit changes', '        run: |',
  '          git config user.name "github-actions[bot]"', '          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
  '          git add README.md assets', '          git diff --cached --quiet || (git commit -m "chore: refresh profile" && git push)', '',
].join('\n');

async function main() {
  const user = await rest(`/users/${CFG.user}`);
  const repos = (await rest(`/users/${CFG.user}/repos?per_page=100&sort=pushed&type=owner`)).filter((r) => !r.fork);
  repos.sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at));
  const [langs, cal, av] = await Promise.all([langBytes(repos), calendar(), avatar(user.avatar_url)]);
  const sum = (k) => repos.reduce((s, r) => s + r[k], 0);
  const d = { name: user.name || user.login, login: user.login, bio: user.bio, avatar: av, langs,
    stats: [{ k: 'Repositories', v: user.public_repos }, { k: 'Stars earned', v: sum('stargazers_count') }, { k: 'Forks', v: sum('forks_count') }, { k: 'Followers', v: user.followers }] };
  const B = { numbers: 'Numbers', languages: 'Languages', contrib: 'Contributions', building: 'Currently building', projects: 'Projects by language' };
  await mkdir(new URL('assets/', ROOT), { recursive: true });
  await mkdir(new URL('.github/workflows/', ROOT), { recursive: true });
  for (const [name, t] of Object.entries(THEMES)) {
    const out = { header: header(t, d), stats: stats(t, d), languages: languages(t, d), contrib: contrib(t, cal) };
    for (const [k, v] of Object.entries(B)) out[`banner-${k}`] = banner(t, v);
    for (const [k, v] of Object.entries(out)) await writeFile(new URL(`assets/${name}-${k}.svg`, ROOT), v);
  }
  const tot = langs.reduce((s, [, v]) => s + v, 0) || 1;
  const pic = (k, alt) => `<picture>\n  <source media="(prefers-color-scheme: light)" srcset="assets/neutral-${k}.svg">\n  <img src="assets/anime-${k}.svg" width="100%" alt="${esc(alt)}">\n</picture>`;
  const h2 = (k) => `<h2>${pic(`banner-${k}`, B[k])}</h2>`;
  const md = [
    `<div align="center">\n\n${pic('header', `${d.name}, @${d.login}`)}\n\n</div>`, CFG.intro, CFG.links.map(([a, u]) => `[${a}](${u})`).join(' | '),
    h2('numbers'), pic('stats', 'GitHub numbers: ' + d.stats.map((s) => `${n(s.v)} ${s.k.toLowerCase()}`).join(', ')),
    h2('languages'), pic('languages', 'Top languages by code size: ' + (langs.slice(0, CFG.maxLangs).map(([k, v]) => `${k} ${((v / tot) * 100).toFixed(1)}%`).join(', ') || 'none yet')),
    h2('contrib'), pic('contrib', cal ? `${n(cal.totalContributions)} contributions in the last year` : 'Contribution graph not available yet'),
    h2('building'), CFG.currently.map(([a, b]) => `- **${a}**: ${b}`).join('\n'),
    h2('projects'), 'Open a language to see its repositories.', reposBlock(repos),
    `<sub>Updated ${new Date().toISOString().slice(0, 10)} by a scheduled GitHub Action. Animations stop when your system asks for reduced motion.</sub>`,
  ].join('\n\n') + '\n';
  await writeFile(new URL('README.md', ROOT), md);
  await writeFile(new URL('.github/workflows/update.yml', ROOT), WORKFLOW);
  console.log(`done: ${repos.length} repos, ${langs.length} languages, calendar=${!!cal}, avatar=${!!av}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e); process.exit(1); });
