'use strict';
// Evaluate only our checked-in reference scripts. No request data enters this VM.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function generateCanonical() {
  const context = vm.createContext({ window: { MAREVYS_TEXT: [] } }, { codeGeneration: { strings: false, wasm: false } });
  for (const file of ['data.js', 'i18n-runes.js', 'oracle-data.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8'), context, { filename: file, timeout: 1000 });
  }
  const w = context.window;
  const o = w.MAREVYS_ORACLE_DATA;
  return JSON.parse(JSON.stringify({
    version: 1,
    runes: w.MAREVYS_DATA.R.map(r => ({
      symbol: r[0], name: r[1], themes: r[5],
      localized: { en: r.slice(2, 5), ...w.MAREVYS_RUNES[r[1]] }
    })),
    tarot: o.tarot.cards.map(({ id, number, roman, key, glyph, name, principle, caution, action, energyTags }) =>
      ({ id, number, roman, key, glyph, name, principle, caution, action, energyTags })),
    hexagrams: o.hexagrams.map(({ id, number, name, principle, caution, action, energyTags }) =>
      ({ id, number, name, principle, caution, action, energyTags })),
    trigramOrder: o.trigramOrder, trigrams: o.trigrams, kingWenMatrix: o.kingWenMatrix
  }));
}

if (require.main === module) {
  const output = generateCanonical();
  fs.writeFileSync(path.join(__dirname, 'canonical-data.json'), JSON.stringify(output, null, 2) + '\n');
  console.log(`Canonical references: ${output.runes.length} runes, ${output.tarot.length} cards, ${output.hexagrams.length} hexagrams.`);
}
module.exports = { generateCanonical };
