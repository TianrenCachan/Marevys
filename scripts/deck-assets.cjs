'use strict';

// Separate from the preserved product-art catalogue: these assets belong to
// the digital deck selector and must not replace physical product imagery.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const ATLAS_FILES = {
  deckCuteAtlas: 'assets/decks/deck-cute-atlas.webp',
  deckFairytaleAtlas: 'assets/decks/deck-fairytale-atlas.webp',
  deckRealisticAtlas: 'assets/decks/deck-realistic-atlas.webp',
  deckChristmasAtlas: 'assets/decks/deck-christmas-atlas.webp'
};

function deckAssetFiles() {
  const files = {};
  // Production is independent of the PNG source archive.
  const hasWebAsset = relative => fs.existsSync(path.join(ROOT, relative)) && fs.statSync(path.join(ROOT, relative)).size > 0;
  for (let n = 0; n < 78; n++) {
    const suffix = String(n).padStart(2, '0');
    files['tarotClassic' + suffix] = 'assets/tarotClassic' + suffix + '.webp';
  }
  for (const [key, relative] of Object.entries(ATLAS_FILES)) {
    if (hasWebAsset(relative)) files[key] = relative;
  }
  for (const style of ['cute', 'fairytale', 'realistic', 'christmas']) {
    for (let sheet = 0; sheet < 4; sheet++) {
      const relative = `assets/decks/${style}-sheet-${sheet}.webp`;
      if (hasWebAsset(relative)) {
        files['deck' + style[0].toUpperCase() + style.slice(1) + 'Sheet' + sheet] = relative;
      }
    }
  }
  return files;
}

module.exports = { deckAssetFiles, ATLAS_FILES };
