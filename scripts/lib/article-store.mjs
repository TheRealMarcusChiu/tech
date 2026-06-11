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
  const t2 = String(title || '');
  lines.push("title: " + (t2.includes("'") ? '"' + t2 + '"' : "'" + t2 + "'"));
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
