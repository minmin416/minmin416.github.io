import { test, expect } from '@playwright/test';
import { Liquid } from 'liquidjs';
import { readFile, writeFile, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const engine = new Liquid();
engine.registerFilter('date_to_xmlschema', value => new Date(value).toISOString());
const template = (await readFile('writing/index.html', 'utf8')).replace(/^---\n[\s\S]*?\n---\n/, '');
const search = await readFile('writing/search.js', 'utf8');
async function render(page, posts = [], withScript = true) {
  const html = await engine.parseAndRender(template, { site: { posts } });
  await page.setContent(html.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '').replace(/<link[^>]*rel="stylesheet"[^>]*>/g, ''));
  await page.addStyleTag({ content: await readFile('writing/style.css', 'utf8') });
  if (withScript) await page.addScriptTag({ content: search });
  return html;
}
const post = overrides => ({ title: 'PUBLIC TEST TITLE', date: '2026-10-20', content: '본문 검색 Café design', url: '/writing/test/', path: '_posts/test.md', published: true, visibility: 'public', ...overrides });

test('empty public writing is honest and usable', async ({ page }) => {
  await render(page);
  await expect(page.getByText('No posts published yet.')).toBeVisible();
  await expect(page.locator('#search-status')).toHaveText('0 published posts.');
  await page.locator('#writing-search').fill('anything');
  await expect(page.locator('#search-status')).toHaveText('0 of 0 published posts found.');
  await expect(page.locator('#search-empty')).toBeHidden();
});

test('public and published filtering precedes search; search is local, safe, reversible', async ({ page }) => {
  const html = await render(page, [post({}), post({ title: 'SECOND', content: 'Another topic', url: '/writing/second/' }), post({ visibility: 'private', content: 'NEVER_INCLUDE_PRIVATE' }), post({ published: false, content: 'NEVER_INCLUDE_DRAFT' })]);
  expect(html).not.toContain('NEVER_INCLUDE_');
  await expect(page.locator('[data-post]')).toHaveCount(2);
  const input = page.locator('#writing-search');
  for (const query of ['public', '본문', '검색 café', '2026-10-20', 'ＰＵＢＬＩＣ']) {
    await input.fill(query);
    await expect(page.locator('[data-post]:visible')).toHaveCount(query === '2026-10-20' ? 2 : 1);
  }
  let requests = 0;
  page.on('request', () => requests++);
  await input.fill('<img src=x onerror=alert(1)>');
  await expect(page.locator('[data-post]:visible')).toHaveCount(0);
  await expect(page.locator('#search-empty')).toBeVisible();
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');
  await expect(page.locator('[data-post]:visible')).toHaveCount(2);
  await expect(page.locator('#search-empty')).toBeHidden();
  expect(requests).toBe(0);
  await input.fill('nothing');
  await input.fill('');
  await expect(page.locator('[data-post]:visible')).toHaveCount(2);
});

test('no JavaScript preserves links and public content; 320px fits', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await render(page, [post({ title: '<img src=x onerror=alert(1)>', content: '<script>bad()</script> safe text' })], false);
  await expect(page.locator('.search')).toBeHidden();
  await expect(page.locator('[data-post] a').first()).toBeVisible();
  await expect(page.locator('[data-post] img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('optimizer preserves semantics, bundles JavaScript, refuses maps', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'riverplo-build-'));
  try {
    await mkdir(path.join(dir, 'writing'));
    await writeFile(path.join(dir, 'index.html'), '<!doctype html><html><head><script type="application/ld+json">{"@type":"Organization","name":"Riverplo"}</script><style>main { color: #ffffff; }</style></head><body><main aria-label="Home"><h1>Riverplo</h1><a href="/feed.xml">RSS</a></main><script>const answer = 1 + 2;</script></body></html>');
    await writeFile(path.join(dir, 'writing/search.js'), search);
    await writeFile(path.join(dir, 'writing/style.css'), await readFile('writing/style.css'));
    execFileSync(process.execPath, ['tools/optimize.mjs', dir]);
    const result = await readFile(path.join(dir, 'index.html'), 'utf8');
    expect(result).toContain('aria-label="Home"');
    expect(result).toContain('application/ld+json');
    expect(result).toContain('href="/feed.xml"');
    expect(result).not.toContain('sourceMappingURL');
    expect((await readFile(path.join(dir, 'writing/search.js'), 'utf8')).length).toBeLessThan(search.length);
    await writeFile(path.join(dir, 'leak.js.map'), '{}');
    expect(() => execFileSync(process.execPath, ['tools/optimize.mjs', dir], { stdio: 'pipe' })).toThrow();
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('optimized home retains no-scroll XP/Vista and night/day controls', async ({ page }) => {
  const root = await mkdtemp(path.join(tmpdir(), 'riverplo-home-'));
  try {
    for (const file of ['index.html', 'night.html']) await writeFile(path.join(root, file), await readFile(file));
    execFileSync(process.execPath, ['tools/optimize.mjs', root]);
    for (const file of ['index.html', 'night.html']) {
      await page.goto('about:blank');
      await page.setContent(await readFile(path.join(root, file), 'utf8'));
      for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 667, height: 375 }]) {
        await page.setViewportSize(size);
        await expect(page.getByRole('heading', { name: 'Riverplo' })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const button = page.locator('#theme-switch');
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'false');
      }
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
