'use strict';

// Deployment transport only: restore non-executable assets from one public,
// immutable GitHub commit. Application source is uploaded directly to Vercel.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const FONT = Object.freeze({
  file: 'assets/noto-sans-runic-runic-400-normal.woff2',
  bytes: 6588,
  sha256: '1df38d3d5d4724f8b495e8df062843889c5d60d011f50d7d3c3b4e1376edef36'
});
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function validateManifest(manifest) {
  if (!Array.isArray(manifest.assets) || manifest.assets.length !== 105) {
    throw new Error('Expected exactly 105 canonical image assets');
  }
  const seen = new Set();
  const assets = manifest.assets.map(asset => {
    if (!/^assets\/[a-zA-Z0-9_-]+\.(webp|png|svg)$/.test(asset.file || '') || seen.has(asset.file)) {
      throw new Error('Invalid or duplicate canonical asset path');
    }
    if (!/^[a-f0-9]{64}$/.test(asset.sha256 || '') ||
        !Number.isSafeInteger(asset.bytes) || asset.bytes < 1 || asset.bytes > MAX_FILE_BYTES) {
      throw new Error(`Invalid asset size or SHA-256: ${asset.file}`);
    }
    seen.add(asset.file);
    return { file: asset.file, bytes: asset.bytes, sha256: asset.sha256 };
  });
  assets.push(FONT);
  if (assets.reduce((sum, asset) => sum + asset.bytes, 0) > MAX_TOTAL_BYTES) {
    throw new Error('Asset manifest exceeds the total download budget');
  }
  return assets;
}

async function existingValid(filename, asset) {
  let stat;
  try { stat = await fs.lstat(filename); }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Asset is not a regular file: ${asset.file}`);
  if (stat.size !== asset.bytes) return false;
  return sha256(await fs.readFile(filename)) === asset.sha256;
}

async function fetchReleaseAssets({ root = ROOT, commit, fetchImpl = globalThis.fetch } = {}) {
  if (typeof commit !== 'string' || !/^[a-f0-9]{40}$/.test(commit)) {
    throw new Error('Pass an immutable 40-character lowercase Git commit with --commit');
  }
  const assets = validateManifest(JSON.parse(await fs.readFile(path.join(root, 'ASSET_MANIFEST.json'), 'utf8')));
  const assetsDir = path.join(root, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });
  const dirStat = await fs.lstat(assetsDir);
  if (!dirStat.isDirectory() || dirStat.isSymbolicLink()) throw new Error('Assets directory must not be a symlink');
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(new Error('Asset download exceeded 120 seconds')), 120000);
  deadline.unref();
  let next = 0;
  let verifiedLocal = 0;
  let downloaded = 0;
  let receivedBytes = 0;
  let failure;

  async function restore(asset) {
    const filename = path.join(root, asset.file);
    if (await existingValid(filename, asset)) { verifiedLocal++; return; }
    const url = new URL(`https://raw.githubusercontent.com/TianrenCachan/Marevys/${commit}/${asset.file}`);
    // Redirects are rejected so the fixed public origin cannot lead elsewhere.
    const response = await fetchImpl(url.href, {
      method: 'GET', redirect: 'error', credentials: 'omit',
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    });
    if (!response.ok || !response.body) throw new Error(`Asset download failed (${response.status}): ${asset.file}`);
    const contentLength = response.headers.get('content-length');
    if (contentLength !== null && Number(contentLength) !== asset.bytes) {
      await response.body.cancel();
      throw new Error(`Asset content length mismatch: ${asset.file}`);
    }
    const reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        receivedBytes += value.byteLength;
        if (length > asset.bytes || length > MAX_FILE_BYTES || receivedBytes > MAX_TOTAL_BYTES) {
          throw new Error(`Asset download exceeds the byte budget: ${asset.file}`);
        }
        chunks.push(Buffer.from(value));
      }
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    } finally { reader.releaseLock(); }
    const bytes = Buffer.concat(chunks);
    if (bytes.length !== asset.bytes || sha256(bytes) !== asset.sha256) {
      throw new Error(`Asset SHA-256 or size mismatch: ${asset.file}`);
    }
    // Only verified bytes reach disk, and an interrupted download cannot replace a file.
    const temporary = `${filename}.download-${crypto.randomUUID()}`;
    try {
      await fs.writeFile(temporary, bytes, { flag: 'wx' });
      await fs.rename(temporary, filename);
    } finally { await fs.rm(temporary, { force: true }); }
    downloaded++;
  }

  async function worker() {
    while (!controller.signal.aborted && next < assets.length) {
      const asset = assets[next++];
      try { await restore(asset); }
      catch (error) {
        failure ||= error;
        controller.abort(error);
      }
    }
  }
  try {
    await Promise.all(Array.from({ length: 6 }, worker));
    if (failure) throw failure;
    if (controller.signal.aborted) throw controller.signal.reason;
    return { commit, verifiedLocal, downloaded, total: assets.length, receivedBytes };
  } finally { clearTimeout(deadline); }
}

module.exports = { fetchReleaseAssets, validateManifest };

if (require.main === module) {
  const args = process.argv.slice(2);
  const commit = args.length === 2 && args[0] === '--commit' ? args[1] : undefined;
  fetchReleaseAssets({ commit }).then(result => {
    process.stdout.write(`Verified ${result.total} pinned assets; downloaded ${result.downloaded}, reused ${result.verifiedLocal}. Commit: ${result.commit}\n`);
  }).catch(error => {
    process.stderr.write(`Asset preparation failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
