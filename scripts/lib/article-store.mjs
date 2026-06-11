// scripts/lib/article-store.mjs
// Filesystem operations for articles, on top of scripts/lib/manifest.mjs.
import { readdir, readFile, writeFile, mkdir, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter, isTrue, isAbsUrl } from './manifest.mjs';

// Build the frontmatter block (no trailing newline). Key order matches the
// existing articles: draft, title, tags, img (optional), date.
export function serializeFrontmatter({ draft, title, tags, img, date }) {
  const t = Array.isArray(tags) ? tags : [];
  const lines = ['---'];
  lines.push('draft: ' + (isTrue(draft) ? 'true' : 'false'));
  // Wrap the title in double quotes (matching the existing articles). This
  // round-trips losslessly through parseFrontmatter, which strips only the
  // outermost quote pair and never unescapes inner characters — so inner quotes
  // of either kind survive verbatim. (Titles are single-line, so no escaping is
  // needed beyond that.)
  lines.push('title: "' + String(title || '') + '"');
  lines.push('tags: [' + t.map((x) => JSON.stringify(String(x))).join(', ') + ']');
  if (img) lines.push("img: '" + String(img) + "'");
  lines.push('date: ' + String(date || ''));
  lines.push('---');
  return lines.join('\n');
}

export function buildMarkdown(fm, body) {
  const clean = String(body || '').replace(/^\s*\n+/, '').replace(/\s+$/, '');
  return serializeFrontmatter(fm) + '\n\n' + clean + '\n';
}

export function dirDate(dir) {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(dir || ''));
  return m ? m[1] : '';
}

// Pick the first free folder name for a date: base, then base-2, base-3, …
export function nextFreeDir(date, takenSet) {
  if (!takenSet.has(date)) return date;
  let n = 2;
  while (takenSet.has(date + '-' + n)) n++;
  return date + '-' + n;
}

// Folder names directly under articlesDir that contain an index.md.
export async function listDirNames(articlesDir) {
  let entries;
  try { entries = await readdir(articlesDir, { withFileTypes: true }); }
  catch { return []; }
  const names = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    try { await stat(join(articlesDir, e.name, 'index.md')); names.push(e.name); }
    catch { /* no index.md — skip */ }
  }
  return names;
}

function imgUrlFor(dir, img) {
  if (!img) return '';
  return isAbsUrl(img) ? img : 'articles/' + dir + '/' + String(img).replace(/^\.\//, '');
}

export async function listArticles(articlesDir) {
  const dirs = await listDirNames(articlesDir);
  const out = [];
  for (const dir of dirs) {
    const raw = await readFile(join(articlesDir, dir, 'index.md'), 'utf8');
    const fm = parseFrontmatter(raw);
    const tags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];
    out.push({
      dir,
      title: fm.title || dir,
      date: fm.date || dirDate(dir),
      tags,
      draft: isTrue(fm.draft),
      img: fm.img || '',
      imgUrl: imgUrlFor(dir, fm.img || ''),
    });
  }
  out.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  return out;
}

export async function readArticle(articlesDir, dir) {
  const raw = await readFile(join(articlesDir, dir, 'index.md'), 'utf8');
  let assets = [];
  try {
    assets = (await readdir(join(articlesDir, dir, 'assets'), { withFileTypes: true }))
      .filter((e) => e.isFile()).map((e) => e.name);
  } catch { /* no assets dir */ }
  return { dir, raw, assets };
}

export async function allTags(articlesDir) {
  const set = new Set();
  for (const a of await listArticles(articlesDir)) a.tags.forEach((t) => set.add(t));
  return [...set].sort((a, b) => a.localeCompare(b));
}
