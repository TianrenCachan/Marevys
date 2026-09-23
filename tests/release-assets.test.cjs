'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { fetchReleaseAssets, validateManifest } = require('../scripts/fetch-release-assets.cjs');
const root = path.resolve(__dirname, '..');
const commit = 'a'.repeat(40);

test('rejects mutable references before any file or network access', async () => {
  for (const value of ['main', '', '../main', 'a'.repeat(39), 'A'.repeat(40)]) {
    await assert.rejects(fetchReleaseAssets({ root: '/nonexistent', commit: value }), /immutable/);
  }
});

test('reuses all valid release assets without making a network request', async () => {
  const result = await fetchReleaseAssets({ root, commit, fetchImpl() { throw new Error('Unexpected network request'); } });
  assert.equal(result.verifiedLocal, 162);
  assert.equal(result.downloaded, 0);
  assert.equal(result.receivedBytes, 0);
});

test('rejects unsafe paths and invalid sizes before downloading', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'ASSET_MANIFEST.json'), 'utf8'));
  for (const file of ['assets/../secret.png', 'assets/script.js', 'https://example.com/image.webp']) {
    const copy = structuredClone(manifest);
    copy.assets[0].file = file;
    assert.throws(() => validateManifest(copy), /asset path/);
  }
  manifest.assets[0].bytes = 5 * 1024 * 1024;
  assert.throws(() => validateManifest(manifest), /size/);
});

test('rejects tampered download and leaves existing file intact', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'marevys-assets-test-'));
  try {
    await fs.mkdir(path.join(temporary, 'assets'));
    const good = Buffer.from('verified-image');
    const bad = Buffer.from('tampered-image');
    const manifest = { assets: Array.from({ length: 161 }, (_, i) => ({
      file: `assets/test-${i}.webp`, bytes: good.length,
      sha256: crypto.createHash('sha256').update(good).digest('hex')
    })) };
    await fs.writeFile(path.join(temporary, 'ASSET_MANIFEST.json'), JSON.stringify(manifest));
    for (const asset of manifest.assets) await fs.writeFile(path.join(temporary, asset.file), good);
    await fs.writeFile(path.join(temporary, manifest.assets[0].file), bad);
    await fs.copyFile(path.join(root, 'assets/noto-sans-runic-runic-400-normal.woff2'),
      path.join(temporary, 'assets/noto-sans-runic-runic-400-normal.woff2'));
    let calls = 0;
    await assert.rejects(fetchReleaseAssets({ root: temporary, commit, fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, `https://raw.githubusercontent.com/TianrenCachan/Marevys/${commit}/assets/test-0.webp`);
      assert.equal(options.redirect, 'error');
      return new Response(bad);
    } }), /SHA-256/);
    assert.equal(calls, 1);
    assert.deepEqual(await fs.readFile(path.join(temporary, manifest.assets[0].file)), bad);
    assert.equal((await fs.readdir(path.join(temporary, 'assets'))).some(name => name.includes('.download-')), false);
  } finally { await fs.rm(temporary, { recursive: true, force: true }); }
});
