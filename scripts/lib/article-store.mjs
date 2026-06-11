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
  // Quote the title so it round-trips through parseFrontmatter (which strips
  // only the outer quote, no unescaping). Default to double quotes to match the
  // existing articles; fall back to single quotes when the title contains a ".
  const t2 = String(title || '');
  let titleVal;
  if (!t2.includes('"')) titleVal = '"' + t2 + '"';
  else if (!t2.includes("'")) titleVal = "'" + t2 + "'";
  else titleVal = '"' + t2.replace(/"/g, '') + '"';
  lines.push('title: ' + titleVal);
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
