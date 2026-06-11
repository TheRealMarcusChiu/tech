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
