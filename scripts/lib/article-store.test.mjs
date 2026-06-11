// scripts/lib/article-store.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeFrontmatter, buildMarkdown } from './article-store.mjs';
import { dirDate, nextFreeDir } from './article-store.mjs';
import { parseFrontmatter, stripFrontmatter } from './manifest.mjs';
import { mkdtemp, mkdir as mkdirp, writeFile as wf } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join as pj } from 'node:path';
import { listArticles, readArticle, allTags, listDirNames } from './article-store.mjs';

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

test('dirDate extracts the YYYY-MM-DD prefix', () => {
  assert.equal(dirDate('2026-05-18'), '2026-05-18');
  assert.equal(dirDate('2026-05-18-2'), '2026-05-18');
  assert.equal(dirDate('nope'), '');
});

test('nextFreeDir returns the base date when free', () => {
  assert.equal(nextFreeDir('2026-05-18', new Set()), '2026-05-18');
});

test('nextFreeDir suffixes when the base (and suffixes) are taken', () => {
  assert.equal(nextFreeDir('2026-05-18', new Set(['2026-05-18'])), '2026-05-18-2');
  assert.equal(nextFreeDir('2026-05-18', new Set(['2026-05-18', '2026-05-18-2'])), '2026-05-18-3');
});

async function fixture() {
  const root = await mkdtemp(pj(tmpdir(), 'admin-store-'));
  const arts = pj(root, 'articles');
  await mkdirp(pj(arts, '2026-05-18'), { recursive: true });
  await wf(pj(arts, '2026-05-18', 'index.md'),
    '---\ndraft: false\ntitle: "Alpha"\ntags: ["x", "y"]\nimg: \'assets/cover.png\'\ndate: 2026-05-18\n---\n\nBody A\n');
  await mkdirp(pj(arts, '2026-05-18-2', 'assets'), { recursive: true });
  await wf(pj(arts, '2026-05-18-2', 'index.md'),
    '---\ndraft: true\ntitle: "Beta"\ntags: ["y", "z"]\ndate: 2026-05-18\n---\n\nBody B\n');
  await wf(pj(arts, '2026-05-18-2', 'assets', '1.png'), 'x');
  return arts;
}

test('listArticles returns all posts incl. drafts, newest first', async () => {
  const arts = await fixture();
  const list = await listArticles(arts);
  assert.equal(list.length, 2);
  const beta = list.find((a) => a.dir === '2026-05-18-2');
  assert.equal(beta.draft, true);
  assert.deepEqual(beta.tags, ['y', 'z']);
  const alpha = list.find((a) => a.dir === '2026-05-18');
  assert.equal(alpha.imgUrl, 'articles/2026-05-18/assets/cover.png');
});

test('readArticle returns raw text and asset filenames', async () => {
  const arts = await fixture();
  const a = await readArticle(arts, '2026-05-18-2');
  assert.match(a.raw, /title: "Beta"/);
  assert.deepEqual(a.assets, ['1.png']);
});

test('allTags returns the sorted union across drafts and non-drafts', async () => {
  const arts = await fixture();
  assert.deepEqual(await allTags(arts), ['x', 'y', 'z']);
});

test('listDirNames returns folder names containing index.md', async () => {
  const arts = await fixture();
  assert.deepEqual((await listDirNames(arts)).sort(), ['2026-05-18', '2026-05-18-2']);
});
