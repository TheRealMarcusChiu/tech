// scripts/lib/article-store.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeFrontmatter, buildMarkdown } from './article-store.mjs';
import { parseFrontmatter, stripFrontmatter } from './manifest.mjs';

test('serializeFrontmatter emits parseable, ordered YAML-ish block', () => {
  const fm = { draft: true, title: 'Hello "World"', tags: ['a', 'b'], img: 'assets/cover.png', date: '2026-06-11' };
  const block = serializeFrontmatter(fm);
  assert.ok(block.startsWith('---\n'));
  assert.ok(block.endsWith('\n---'));
  const parsed = parseFrontmatter(block + '\n\nbody\n');
  assert.equal(parsed.draft, 'true');
  assert.equal(parsed.title, 'Hello "World"');
  assert.deepEqual(parsed.tags, ['a', 'b']);
  assert.equal(parsed.img, 'assets/cover.png');
  assert.equal(parsed.date, '2026-06-11');
});

test('serializeFrontmatter round-trips titles with both quote kinds losslessly', () => {
  for (const title of ['say "hi"', "both ' and \" quotes", '"leads', 'trails"', "It's fine"]) {
    const block = serializeFrontmatter({ draft: false, title, tags: [], img: '', date: '2026-01-01' });
    assert.equal(parseFrontmatter(block + '\n\nb\n').title, title);
  }
});

test('serializeFrontmatter omits img when empty', () => {
  const block = serializeFrontmatter({ draft: false, title: 'T', tags: [], img: '', date: '2026-01-01' });
  assert.ok(!/img:/.test(block));
  assert.match(block, /tags: \[\]/);
});

test('buildMarkdown joins frontmatter and body with a blank line and trailing newline', () => {
  const md = buildMarkdown({ draft: true, title: 'T', tags: [], img: '', date: '2026-01-01' }, '  \n\nBody text\n\n');
  assert.match(md, /---\n\nBody text\n$/);
  assert.equal(stripFrontmatter(md), 'Body text\n');
});
