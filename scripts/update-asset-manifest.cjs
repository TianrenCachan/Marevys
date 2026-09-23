const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const previous=JSON.parse(fs.readFileSync(path.join(root,'ASSET_MANIFEST.json'),'utf8'));
const previousByKey=new Map(previous.assets.map(asset=>[asset.key,asset]));

const files={
  hero:'hero-water.webp',logo:'marevys-mark-approved.png',parfum:'parfum-minimal-label.webp',runes:'runes.webp',tea:'tea.webp',path:'path.webp',oracle:'oracle.webp',ritual:'ritual-small-label.webp',journal:'journal-subtle.webp',object:'object-branded.webp',yi:'yi.webp',ichingReading:'i-ching-interpretation-v2.webp',ritualObjects:'ritual-objects.webp',ritualEveryday:'ritual-everyday.webp',aboutHouse:'about-house.webp',productStone24:'product-stone24.webp',productPulse01:'product-pulse01.webp',productMedallion01:'product-medallion01.webp',productEmber01:'product-ember01.webp',productCloth01:'product-cloth01.webp',productArcana22:'product-arcana22.webp',productCoin64:'product-coin64.webp',ritualGround:'ritual-ground.webp',ritualOpen:'ritual-open.webp',ritualProsper:'ritual-prosper.webp',ritualClear:'ritual-clear.webp',ritualMove:'ritual-move.webp',ritualRest:'ritual-rest.webp',ritualProtect:'ritual-protect.webp',ritualCreate:'ritual-create.webp',
  runeStoneBack1:'rune-stone-back-01.webp',runeStoneBack2:'rune-stone-back-02.webp',runeStoneBack3:'rune-stone-back-03.webp',runeStoneBack4:'rune-stone-back-04.webp',tarotBack:'tarot-card-back-arcana22.webp',runeReadingSurface:'reading-surface-rune-v2.webp',tarotReadingSurface:'reading-surface-tarot-v2.webp',ichingReadingSurface:'reading-surface-iching.webp',readingRecordReturn01:'reading-record-return01.webp',
  matchEau01:'match-eau01.webp',matchVeil01:'match-veil01.webp',matchSpecimen01:'match-specimen01.webp',matchReturn01:'match-return01.webp',matchStone24:'match-stone24.webp',matchGround01:'match-ground01.webp',matchPulse01:'match-pulse01.webp',matchMedallion01:'match-medallion01.webp',matchEmber01:'match-ember01.webp',matchCloth01:'match-cloth01.webp',matchArcana22:'match-arcana22.webp',matchCoin64:'match-coin64.webp',
  bookmarkEau01:'bookmark-eau01.webp',bookmarkVeil01:'bookmark-veil01.webp',bookmarkSpecimen01:'bookmark-specimen01.webp',bookmarkReturn01:'bookmark-return01.webp',bookmarkStone24:'bookmark-stone24.webp',bookmarkGround01:'bookmark-ground01.webp',bookmarkPulse01:'bookmark-pulse01.webp',bookmarkMedallion01:'bookmark-medallion01.webp',bookmarkEmber01:'bookmark-ember01.webp',bookmarkCloth01:'bookmark-cloth01.webp',bookmarkArcana22:'bookmark-arcana22.webp',bookmarkCoin64:'bookmark-coin64.webp'
};
for(let number=5;number<=24;number++)files['runeStoneBack'+number]='rune-stone-back-'+String(number).padStart(2,'0')+'.webp';
for(let number=0;number<=21;number++)files['tarot'+String(number).padStart(2,'0')]='tarot-'+String(number).padStart(2,'0')+'.webp';
for(let number=22;number<=77;number++)files['tarotOriginal'+String(number).padStart(2,'0')]='tarot-original-'+String(number).padStart(2,'0')+'.webp';

const descriptions={
  ichingReading:'Indoor still life with exactly three square-hole bronze coins, blank handmade xuan paper, inkstone and brush; no fixed hexagram, text, seal or logo',
  productStone24:'Complete hand-finished basalt rune set with natural linen pouch and restrained bronze-filled carvings; no product logo',
  productArcana22:'ARCANA 22 product composition built from the exact official lunar back and six exact Major Arcana face artworks; no logo',
  productCoin64:'Exactly three matching square-hole bronze I Ching coins with an unbranded natural-linen pouch',
  runeStoneBack1:'Blank irregular matte basalt stone back used for blind selection; no glyph or logo',
  runeStoneBack2:'Blank irregular matte basalt stone back used for blind selection; no glyph or logo',
  runeStoneBack3:'Blank irregular matte basalt stone back used for blind selection; no glyph or logo',
  runeStoneBack4:'Blank irregular matte basalt stone back used for blind selection; no glyph or logo',
  tarotBack:'Official ARCANA 22 lunar card back used by the physical product, blind draw and reveal animation',
  runeReadingSurface:'Crisp front-facing basalt tablet texture reserved for the Rune interpretation manuscript',
  tarotReadingSurface:'Fine navy-gold card stock reserved for the Tarot interpretation manuscript',
  ichingReadingSurface:'Warm xuan-paper surface reserved for the I Ching interpretation manuscript',
  readingRecordReturn01:'Open RETURN 01 notebook reserved for the saved-reading page',
  matchEau01:'Independent 4:5 identification portrait for EAU 01 on the private-match page',
  matchVeil01:'Independent 4:5 identification portrait for VEIL 01 on the private-match page',
  matchSpecimen01:'Independent 4:5 identification portrait for SPECIMEN 01 on the private-match page',
  matchReturn01:'Independent 4:5 identification portrait for RETURN 01 on the private-match page',
  matchStone24:'Independent 4:5 identification portrait for STONE 24 on the private-match page',
  matchGround01:'Independent 4:5 identification portrait for GROUND 01 on the private-match page',
  matchPulse01:'Independent 4:5 identification portrait for PULSE 01 on the private-match page',
  matchMedallion01:'Independent 4:5 identification portrait for MEDALLION 01 on the private-match page',
  matchEmber01:'Independent 4:5 identification portrait for EMBER 01 on the private-match page',
  matchCloth01:'Independent 4:5 identification portrait for CLOTH 01 on the private-match page',
  matchArcana22:'Independent 4:5 identification portrait for ARCANA 22 on the private-match page',
  matchCoin64:'Independent 4:5 identification portrait for COIN 64 on the private-match page',
  bookmarkEau01:'Independent 2:3 ritual-bookmark scene for EAU 01 with a restrained approved label',
  bookmarkVeil01:'Independent 2:3 ritual-bookmark scene for VEIL 01 with a restrained approved label',
  bookmarkSpecimen01:'Independent 2:3 ritual-bookmark scene for SPECIMEN 01',
  bookmarkReturn01:'Independent 2:3 ritual-bookmark scene for RETURN 01 with a small natural debossed mark',
  bookmarkStone24:'Independent 2:3 ritual-bookmark scene for unbranded natural basalt STONE 24',
  bookmarkGround01:'Independent 2:3 ritual-bookmark scene for an unbranded GROUND 01 tea bowl',
  bookmarkPulse01:'Independent 2:3 ritual-bookmark scene for PULSE 01',
  bookmarkMedallion01:'Independent 2:3 ritual-bookmark scene for MEDALLION 01',
  bookmarkEmber01:'Independent 2:3 ritual-bookmark scene for EMBER 01',
  bookmarkCloth01:'Independent 2:3 ritual-bookmark scene for unbranded CLOTH 01 linen',
  bookmarkArcana22:'Independent 2:3 ritual-bookmark scene using the ARCANA 22 lunar back design',
  bookmarkCoin64:'Independent 2:3 ritual-bookmark scene with exactly three unbranded square-hole COIN 64 pieces',
};
for(let number=5;number<=24;number++)descriptions['runeStoneBack'+number]='Independent blank natural basalt stone '+String(number).padStart(2,'0')+' used once in the 24-stone blind selection; no glyph, text or logo';
for(let number=0;number<=21;number++)descriptions['tarot'+String(number).padStart(2,'0')]=`Independent Major Arcana face ${String(number).padStart(2,'0')} in the MARÉVYS mineral-watercolour product language; no title, numeral or logo`;
for(let number=22;number<=77;number++)descriptions['tarotOriginal'+String(number).padStart(2,'0')]=`Original MARÉVYS minor illustration ${number}, commissioned in the existing mineral-watercolour style; digital preview art, no book scan`;

function masterFor(key,file){
  if(key.startsWith('tarotOriginal'))return undefined;
  if(key==='productArcana22')return 'source-images/product-arcana22-exact.png';
  const direct=`source-images/${file.replace('.webp','.png')}`;
  if(fs.existsSync(path.join(root,direct)))return direct;
  if(key.startsWith('tarot'))return `source-images/tarot/${file.replace('.webp','.png')}`;
  return previousByKey.get(key)?.master;
}
function inspect(key,file){
  const absolute=path.join(root,'assets',file);
  const bytes=fs.readFileSync(absolute);
  if(!bytes.length)throw new Error(`Empty asset: ${file}`);
  const [width,height,channels]=execFileSync('identify',['-format','%w\t%h\t%[channels]',absolute],{encoding:'utf8'}).split('\t');
  const prior=previousByKey.get(key)||{};
  const master=masterFor(key,file);
  const asset={
    ...prior,
    key,
    file:`assets/${file}`,
    width:Number(width),
    height:Number(height),
    format:path.extname(file).slice(1),
    hasAlpha:/a/i.test(channels),
    bytes:bytes.length,
    sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    branding:descriptions[key]||prior.branding||'Independent unbranded content image with one assigned semantic purpose',
    embedded:true,
    sourcePreserved:Boolean(master||prior.sourcePreserved)
  };
  if(key.startsWith('tarotOriginal')){asset.sourcePreserved=true;asset.sourceRecorded=true;asset.provenance={method:'AI-generated original artwork',manifest:'THIRD_PARTY_LICENSES/MAREVYS_ARTWORK_PROVENANCE.json'};asset.encoding='WebP exported from one original atlas cell for website display';delete asset.master;return asset;}
  if(master)asset.master=master;
  if(['parfum','ritual','object','journal','tea','productStone24','productPulse01','productMedallion01','productEmber01','productCloth01','productCoin64'].includes(key))asset.encoding='WebP quality 90, normalized to one 4:5 catalogue composition';
  else if(key==='productArcana22')asset.encoding='WebP quality 90 from a 4:5 product composition using the exact official card faces and card back';
  else if(key==='ichingReading'||key.startsWith('runeStoneBack')||key==='tarotBack'||key.endsWith('ReadingSurface')||key.startsWith('tarot')||key.startsWith('bookmark')||key.startsWith('match')||key==='readingRecordReturn01')asset.encoding='WebP from the complete PNG master';
  return asset;
}

const manifest={
  version:'RC22',
  assetBaseline:'RC22 restores the unchanged 22 original MARÉVYS watercolour majors and lunar back and adds 56 original minor illustrations. No classic deck scans are shipped. Existing product and archived-reading assets remain.',
  experienceArchitecture:'EXPERIENCE_ARCHITECTURE.json',
  languages:['en','fr','zh-Hans'],
  completeHtml:'index.html',
  allImagesEmbedded:true,
  logoReference:'brand/approved-logo-board.png',
  decisions:{
    ...previous.decisions,
    runeInterpretation:'The former photographic rune inset is removed. The selected rune and full interpretation are rendered as crisp incised type on one CSS-built basalt tablet.',
    tarotFaces:'All 78 active faces use the MARÉVYS original watercolour visual direction; the 22 original majors remain byte-for-byte unchanged.',
    tarotProductConsistency:'ARCANA 22 catalogue imagery shows the preserved original 22-card design and lunar back. New minor images extend the same direction as digital artwork.',
    tarotProvenance:'Original generated artwork only; books inform interpretive methods, not visual assets. See THIRD_PARTY_LICENSES/MAREVYS_ARTWORK_PROVENANCE.json.',
    catalogueFormat:'All twelve single-product catalogue photographs are delivered at the same 1024 × 1280 (4:5) format and fill the same image frame.',
    readingMaterials:'Rune interpretation uses crisp incised basalt, Tarot uses fine navy-gold card stock and I Ching uses warm xuan paper; none stretches a landscape photograph over a long page.',
    iching:'The reading scene uses exactly three square-hole bronze coins beside blank xuan paper so it never contradicts the dynamically cast hexagram; the catalogue uses a separate three-coin product composition.',
    oneImageOnePurpose:'Every non-logo photograph has one named semantic purpose; homepage, catalogue, matched-set, ritual-bookmark, record scenes and all 24 blind-selection rune stones do not recycle the same photograph.',
    matchPortraits:'Each of the twelve products has a separate 4:5 identification portrait on the private-match page so a reader can see exactly what every named object is.',
    ritualBookmarks:'Each of the twelve products has a separate 2:3 image made for the stage-six bookmark sequence; no catalogue image or matched-set crop is reused.',
    recordSurface:'The saved-reading page uses one dedicated open RETURN 01 notebook scene and keeps the reader’s note on the paper surface.',
    noLargeImageSlicing:'Original majors stay unchanged. The 56 distinct minor scenes are authored as four aligned suit atlases and exported cell-by-cell for the website; not print-ready masters.',
    newNoLogoProducts:'STONE 24, CLOTH 01, ARCANA 22 and COIN 64 remain unbranded; rune stones, energy stones, tea bowls, Tarot cards and I Ching coins carry no logo.'
  },
  assets:Object.entries(files).map(([key,file])=>inspect(key,file))
};

fs.writeFileSync(path.join(root,'ASSET_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({version:manifest.version,assets:manifest.assets.length,content:manifest.assets.length-1}));
