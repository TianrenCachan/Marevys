'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { buildWeb, SCRIPT_SOURCES, STYLE_SOURCES } = require('./build-web.cjs');
const root = path.resolve(__dirname, '..');

test('online build preserves approved content, assets and dependency order without embedded photographs', t => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'marevys-web-test-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const result = buildWeb({ outputDir: path.join(scratch, 'dist') });
  const read = url => fs.readFileSync(path.join(result.outputDir, url.replace(/^\//, '')));
  const html = read('/index.html').toString();
  const css = read(result.cssUrl).toString();
  const application = read(result.scriptUrl).toString();
  const runtime = read(result.bootstrapUrl).toString();
  const offlineBuild = fs.readFileSync(path.join(root, 'build.cjs'), 'utf8');

  // Catch accidental omission/reordering when the approved offline source list changes.
  const offlineScripts = vm.runInNewContext(offlineBuild.match(/const sources=(\[[^;]+\]);/)[1]);
  const offlineStyles = vm.runInNewContext(offlineBuild.match(/\.\.\.(\['base\.css'[^\]]+\])\.map/)[1]);
  assert.deepEqual(SCRIPT_SOURCES, Array.from(offlineScripts));
  assert.deepEqual(STYLE_SOURCES, Array.from(offlineStyles));
  assert.equal(application, SCRIPT_SOURCES.map(file => fs.readFileSync(path.join(root, 'src', file), 'utf8')).join('\n'));
  assert.doesNotThrow(() => new vm.Script(application));
  assert.match(application, /\$\$=s=>\[\.\.\.document\.querySelectorAll\(s\)\]/);

  const scriptTags = [...html.matchAll(/<script\b([^>]*)><\/script>/g)];
  assert.equal(scriptTags.length, 2);
  assert.ok(scriptTags.every(match => /\bdefer\b/.test(match[1])));
  assert.ok(scriptTags[0][1].includes(result.bootstrapUrl));
  assert.ok(scriptTags[1][1].includes(result.scriptUrl));
  const context = { window: {} };
  vm.runInNewContext(runtime, context);
  assert.equal(context.window.MAREVYS_AI_ENDPOINT, '/api/reading');
  assert.equal(Object.keys(context.window.MAREVYS_ASSETS).length, 183);
  assert.equal(context.window.MAREVYS_BUILD_VERSION, 'RC21');
  assert.equal(context.window.MAREVYS_TAROT_CARDS.length, 78);
  for(const card of context.window.MAREVYS_TAROT_CARDS){
    assert.ok(context.window.MAREVYS_ASSETS[card.imageKey]);
    assert.deepEqual(Object.keys(card).sort(),['id','imageKey','name','number','rank','reversed','suit','upright']);
    for(const lang of ['en','fr','zh'])assert.ok(card.name[lang]&&card.upright[lang]&&card.reversed[lang]);
  }
  assert.doesNotMatch(runtime, /"(?:sourceRefs|editorialStatus|chunks|fullText|pageText)"\s*:/);

  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'ASSET_MANIFEST.json'), 'utf8'));
  for (const asset of manifest.assets) {
    const output = read(context.window.MAREVYS_ASSETS[asset.key]);
    assert.deepEqual(output, fs.readFileSync(path.join(root, asset.file)), `${asset.key} preserves its original bytes`);
  }
  for (const [, url] of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) assert.ok(read(url).length, url);
  for (const [, url] of css.matchAll(/url\("(\/assets\/[^\"]+)"\)/g)) assert.ok(read(url).length, url);
  for (const [, key, tail] of html.matchAll(/<img\b[^>]*data-image="([^"]+)"([^>]*)>/g)) {
    assert.ok(tail.includes(context.window.MAREVYS_ASSETS[key]), key);
    assert.ok(tail.includes(`loading="${key === 'logo' ? 'eager' : 'lazy'}"`), key);
  }
  assert.match(css, /font-family:'Marevys Runic'/);
  assert.ok(read(result.fontUrl).length > 1000);
  assert.match(read(result.fontLicenseUrl).toString(), /SIL OPEN FONT LICENSE/);
  assert.match(read(result.artCreditsUrl).toString(), /Pamela Colman Smith/);
  assert.equal(JSON.parse(read(result.artProvenanceUrl).toString()).cardCount,78);
  assert.match(read(result.astronomyLicenseUrl).toString(), /MIT License/);
  assert.doesNotMatch(html + css + runtime, /data:(?:image|font)\/|source-images\//i);
  assert.ok(result.htmlBytes < 60000, 'the online entry point stays small');
  assert.deepEqual(fs.readdirSync(result.outputDir).sort(), ['assets', 'index.html']);
  assert.ok(fs.readdirSync(path.join(result.outputDir, 'assets')).every(name => /\.[a-f0-9]{12}\.(?:js|css|webp|png|svg|woff2|txt)$/.test(name)));

  // Repeat builds must retain identical cache keys for unchanged files.
  const snapshot = () => Object.fromEntries(['index.html', ...fs.readdirSync(path.join(result.outputDir, 'assets')).map(name => `assets/${name}`)].map(file =>
    [file, crypto.createHash('sha256').update(read('/' + file)).digest('hex')]));
  const first = snapshot();
  buildWeb({ outputDir: result.outputDir });
  assert.deepEqual(snapshot(), first);
});
