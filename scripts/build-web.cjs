'use strict';

// Online counterpart to build.cjs. The offline build remains self-contained.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
// Preserve the dependency and cascade order of the approved offline build.
const SCRIPT_SOURCES = [
  'data.js', 'experience-data.js', 'oracle-data.js', 'i18n.js',
  'i18n-runes.js', 'i18n-house.js', 'i18n-flow.js', 'i18n-experience.js',
  'i18n-oracles.js', 'i18n-rc15.js', 'i18n-rc16-gate.js', 'i18n-rc16.js',
  'i18n-rc17.js', 'i18n-rc18.js', 'i18n-rc19.js', 'core.js', 'oracle.js', 'app.js',
  'astrology-studio.js', 'reading-studio.js'
];
const STYLE_SOURCES = [
  'base.css', 'refinement.css', 'experience.css', 'oracle.css', 'rc15.css',
  'rc16-gate.css', 'rc16.css', 'rc17.css', 'rc18.css', 'rc19.css',
  'astrology-studio.css', 'reading-studio.css'
];

function readPublicTarotCards() {
  const cards=JSON.parse(fs.readFileSync(path.join(ROOT,'server','tarot-cards.json'),'utf8'));
  if (!Array.isArray(cards)||cards.length!==78) throw new Error('Expected the complete 78-card tarot catalogue');
  const localized=value=>Object.fromEntries(['en','fr','zh'].map(locale=>{
    if (!value||typeof value[locale]!=='string'||!value[locale].trim()||value[locale].length>3000) throw new Error('Invalid public tarot translation');
    return [locale,value[locale]];
  }));
  // Deliberate allowlist: book excerpts, private corpus chunks, source paths and
  // internal review metadata must never enter the public application bundle.
  return cards.map((card,index)=>{
    if(card.id!==`TAROT_${String(index).padStart(2,'0')}`||card.number!==index||card.imageKey!==`tarotClassic${String(index).padStart(2,'0')}`)throw new Error('Tarot image/card ordering mismatch');
    return {id:card.id,number:card.number,suit:card.suit,rank:card.rank,name:localized(card.name),upright:localized(card.upright),reversed:localized(card.reversed),imageKey:card.imageKey};
  });
}
function serializePublicJson(value) {
  return JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
}

function digest(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function buildWeb({ outputDir = path.join(ROOT, 'dist') } = {}) {
  outputDir = path.resolve(outputDir);
  // Only replace an explicit build directory, never the project or its sources.
  if (path.basename(outputDir) !== 'dist') throw new Error('The output directory must be named dist');
  const stageDir = fs.mkdtempSync(path.join(path.dirname(outputDir), '.marevys-web-'));
  const emitted = new Map();
  const writeAsset = (name, input) => {
    const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
    const ext = path.extname(name);
    const filename = `${path.basename(name, ext)}.${digest(bytes).slice(0, 12)}${ext}`;
    const relative = `assets/${filename}`;
    if (!bytes.length) throw new Error(`Empty asset: ${name}`);
    fs.mkdirSync(path.join(stageDir, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(stageDir, relative), bytes);
    emitted.set(relative, bytes.length);
    return `/${relative}`;
  };

  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'ASSET_MANIFEST.json'), 'utf8'));
    const assetMap = {};
    const dimensions = new Map();
    for (const asset of manifest.assets) {
      if (!/^[A-Za-z][A-Za-z0-9]*$/.test(asset.key) || Object.hasOwn(assetMap, asset.key)) {
        throw new Error(`Invalid or duplicate asset key: ${asset.key}`);
      }
      // Only the canonical web asset is copied; masters and source directories are excluded.
      if (!/^assets\/[a-zA-Z0-9_-]+\.(webp|png|svg)$/.test(asset.file)) {
        throw new Error(`Invalid canonical asset path: ${asset.file}`);
      }
      const bytes = fs.readFileSync(path.join(ROOT, asset.file));
      if (asset.sha256 && digest(bytes) !== asset.sha256) {
        throw new Error(`Asset manifest is stale: ${asset.file}; run scripts/update-asset-manifest.cjs`);
      }
      assetMap[asset.key] = writeAsset(path.basename(asset.file), bytes);
      dimensions.set(asset.key, asset);
    }
    if (Object.keys(assetMap).length !== 183) throw new Error('Expected 105 preserved images plus 78 classic tarot faces');

    const artCreditsUrl=writeAsset('RWS_1909_ATTRIBUTION.txt',fs.readFileSync(path.join(ROOT,'THIRD_PARTY_LICENSES','RWS_1909_ATTRIBUTION.md')));
    const artProvenanceUrl=writeAsset('RWS_1909_PROVENANCE.txt',fs.readFileSync(path.join(ROOT,'THIRD_PARTY_LICENSES','RWS_1909_PROVENANCE.json')));
    const astronomyLicenseUrl=writeAsset('Astronomy_Engine_MIT.txt',fs.readFileSync(path.join(ROOT,'THIRD_PARTY_LICENSES','Astronomy_Engine_MIT.txt')));

    const fontUrl = writeAsset('noto-sans-runic-runic-400-normal.woff2',
      fs.readFileSync(path.join(ROOT, 'assets', 'noto-sans-runic-runic-400-normal.woff2')));
    const fontLicenseUrl = writeAsset('Noto_Sans_Runic_OFL.txt',
      fs.readFileSync(path.join(ROOT, 'THIRD_PARTY_LICENSES', 'Noto_Sans_Runic_OFL.txt')));
    const fontFace = `/* Runic font license: ${fontLicenseUrl} */\n@font-face{font-family:'Marevys Runic';font-style:normal;font-weight:400;font-display:block;src:url("${fontUrl}") format('woff2');unicode-range:U+16A0-16FF}`;
    // These defaults let the hero render before the deferred application finishes loading.
    const materialKeys = {
      '--hero-image': 'hero', '--rune-reading-surface': 'runeReadingSurface',
      '--tarot-reading-surface': 'tarotReadingSurface', '--iching-reading-surface': 'ichingReadingSurface',
      '--reading-record-image': 'readingRecordReturn01'
    };
    const materials = ':root{' + Object.entries(materialKeys)
      .map(([variable, key]) => `${variable}:url("${assetMap[key]}")`).join(';') + '}';
    let css = [fontFace, materials, ...STYLE_SOURCES.map(file =>
      fs.readFileSync(path.join(ROOT, 'src', file), 'utf8'))].join('\n');
    // Externalize the small procedural stone texture as well as all photographic assets.
    css = css.replace(/url\("data:image\/svg\+xml,([^\"]+)"\)/g, (_, encoded) =>
      `url("${writeAsset('stone-texture.svg', decodeURIComponent(encoded))}")`);
    if (/data:(?:image|font)\//i.test(css)) throw new Error('An inline image or font remains in the online styles');
    const cssUrl = writeAsset('marevys.css', css);

    const scripts = SCRIPT_SOURCES.map(file => {
      const source = fs.readFileSync(path.join(ROOT, 'src', file), 'utf8');
      new vm.Script(source, { filename: file });
      return source;
    }).join('\n');
    new vm.Script(scripts, { filename: 'marevys-online.js' });
    const bootstrap = `window.MAREVYS_ASSETS = ${serializePublicJson(assetMap)};\nwindow.MAREVYS_TAROT_CARDS = ${serializePublicJson(readPublicTarotCards())};\nwindow.MAREVYS_BUILD_VERSION = 'RC21';\nwindow.MAREVYS_AI_ENDPOINT = '/api/reading';\nwindow.MAREVYS_CREDITS = ${serializePublicJson({artCreditsUrl,artProvenanceUrl,astronomyLicenseUrl})};\n`;
    const bootstrapUrl = writeAsset('marevys-runtime.js', bootstrap);
    const scriptUrl = writeAsset('marevys-app.js', scripts);
    let html = fs.readFileSync(path.join(ROOT, 'src', 'template.html'), 'utf8');
    for (const marker of ['<!--STYLES-->', '<!--SCRIPTS-->']) {
      if (html.split(marker).length !== 2) throw new Error(`Expected exactly one ${marker} placeholder`);
    }
    html = html.replace(/<img\b[^>]*\bdata-image="([^"]+)"[^>]*>/g, (tag, key) => {
      const asset = dimensions.get(key);
      if (!asset) throw new Error(`Unknown template image: ${key}`);
      // Real src values permit native lazy loading even before JavaScript initializes.
      const clean = tag.replace(/\s(?:src|loading|decoding|width|height)="[^"]*"/g, '');
      return clean.replace(/>$/, () => ` src="${assetMap[key]}" width="${asset.width}" height="${asset.height}" loading="${key === 'logo' ? 'eager' : 'lazy'}" decoding="async">`);
    });
    // Replacement callbacks preserve literal $ characters in source text.
    html = html.replace('<!--STYLES-->', () =>
      `<link rel="preload" as="image" href="${assetMap.hero}" fetchpriority="high">\n<link rel="stylesheet" href="${cssUrl}">`)
      .replace('<!--SCRIPTS-->', () =>
        `<script defer src="${bootstrapUrl}"></script>\n<script defer src="${scriptUrl}"></script>`);
    if (/data:(?:image|font)\//i.test(html)) throw new Error('The online HTML must not embed images or fonts');
    fs.writeFileSync(path.join(stageDir, 'index.html'), html);
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.renameSync(stageDir, outputDir);
    return {
      outputDir, canonicalImages: Object.keys(assetMap).length,
      htmlBytes: Buffer.byteLength(html), cssBytes: Buffer.byteLength(css),
      applicationBytes: Buffer.byteLength(scripts), runtimeBytes: Buffer.byteLength(bootstrap),
      totalFiles: emitted.size + 1,
      totalBytes: Buffer.byteLength(html) + [...emitted.values()].reduce((sum, size) => sum + size, 0),
      assetMap, cssUrl, bootstrapUrl, scriptUrl, fontUrl, fontLicenseUrl,
      artCreditsUrl, artProvenanceUrl, astronomyLicenseUrl
    };
  } catch (error) {
    fs.rmSync(stageDir, { recursive: true, force: true });
    throw error;
  }
}

if (require.main === module) {
  const { assetMap, ...summary } = buildWeb();
  console.log(JSON.stringify(summary, null, 2));
}

module.exports = { buildWeb, SCRIPT_SOURCES, STYLE_SOURCES, readPublicTarotCards, serializePublicJson };
