const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=__dirname;
const sources=['data.js','experience-data.js','oracle-data.js','i18n.js','i18n-runes.js','i18n-house.js','i18n-flow.js','i18n-experience.js','i18n-oracles.js','i18n-rc15.js','i18n-rc16-gate.js','i18n-rc16.js','i18n-rc17.js','i18n-rc18.js','i18n-rc19.js','core.js','oracle.js','app.js'];
const runicFont=fs.readFileSync(path.join(root,'assets','noto-sans-runic-runic-400-normal.woff2')).toString('base64');
const runicFontFace=`@font-face{font-family:'Marevys Runic';font-style:normal;font-weight:400;font-display:block;src:url(data:font/woff2;base64,${runicFont}) format('woff2');unicode-range:U+16A0-16FF}`;
const css=[runicFontFace,...['base.css','refinement.css','experience.css','oracle.css','rc15.css','rc16-gate.css','rc16.css','rc17.css','rc18.css','rc19.css'].map(f=>fs.readFileSync(path.join(root,'src',f),'utf8'))].join('\n');
const scripts=sources.map(f=>{
 const text=fs.readFileSync(path.join(root,'src',f),'utf8');
 new vm.Script(text,{filename:f});
 return text.replace(/<\/script/gi,'<\\/script');
}).join('\n');
let template=fs.readFileSync(path.join(root,'src/template.html'),'utf8');
const files={
 hero:'hero-water.webp',logo:'marevys-mark-approved.png',parfum:'parfum-minimal-label.webp',runes:'runes.webp',tea:'tea.webp',path:'path.webp',oracle:'oracle.webp',ritual:'ritual-small-label.webp',journal:'journal-subtle.webp',object:'object-branded.webp',yi:'yi.webp',ichingReading:'i-ching-interpretation-v2.webp',ritualObjects:'ritual-objects.webp',
 ritualEveryday:'ritual-everyday.webp',aboutHouse:'about-house.webp',productStone24:'product-stone24.webp',productPulse01:'product-pulse01.webp',productMedallion01:'product-medallion01.webp',productEmber01:'product-ember01.webp',productCloth01:'product-cloth01.webp',productArcana22:'product-arcana22.webp',productCoin64:'product-coin64.webp',ritualGround:'ritual-ground.webp',ritualOpen:'ritual-open.webp',ritualProsper:'ritual-prosper.webp',ritualClear:'ritual-clear.webp',ritualMove:'ritual-move.webp',ritualRest:'ritual-rest.webp',ritualProtect:'ritual-protect.webp',ritualCreate:'ritual-create.webp',
 runeStoneBack1:'rune-stone-back-01.webp',runeStoneBack2:'rune-stone-back-02.webp',runeStoneBack3:'rune-stone-back-03.webp',runeStoneBack4:'rune-stone-back-04.webp',tarotBack:'tarot-card-back-arcana22.webp',runeReadingSurface:'reading-surface-rune-v2.webp',tarotReadingSurface:'reading-surface-tarot-v2.webp',ichingReadingSurface:'reading-surface-iching.webp',readingRecordReturn01:'reading-record-return01.webp',
 matchEau01:'match-eau01.webp',matchVeil01:'match-veil01.webp',matchSpecimen01:'match-specimen01.webp',matchReturn01:'match-return01.webp',matchStone24:'match-stone24.webp',matchGround01:'match-ground01.webp',matchPulse01:'match-pulse01.webp',matchMedallion01:'match-medallion01.webp',matchEmber01:'match-ember01.webp',matchCloth01:'match-cloth01.webp',matchArcana22:'match-arcana22.webp',matchCoin64:'match-coin64.webp',
 bookmarkEau01:'bookmark-eau01.webp',bookmarkVeil01:'bookmark-veil01.webp',bookmarkSpecimen01:'bookmark-specimen01.webp',bookmarkReturn01:'bookmark-return01.webp',bookmarkStone24:'bookmark-stone24.webp',bookmarkGround01:'bookmark-ground01.webp',bookmarkPulse01:'bookmark-pulse01.webp',bookmarkMedallion01:'bookmark-medallion01.webp',bookmarkEmber01:'bookmark-ember01.webp',bookmarkCloth01:'bookmark-cloth01.webp',bookmarkArcana22:'bookmark-arcana22.webp',bookmarkCoin64:'bookmark-coin64.webp'
};
for(let number=5;number<=24;number++)files['runeStoneBack'+number]='rune-stone-back-'+String(number).padStart(2,'0')+'.webp';
for(let number=0;number<=21;number++)files['tarot'+String(number).padStart(2,'0')]='tarot-'+String(number).padStart(2,'0')+'.webp';
const embedded={};
const mime={'.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
for(const [key,file] of Object.entries(files)){
 const bytes=fs.readFileSync(path.join(root,'assets',file));
 if(!bytes.length)throw new Error('Empty asset: '+file);
 if(!mime[path.extname(file)])throw new Error('Unknown image format: '+file);
 embedded[key]='data:'+mime[path.extname(file)]+';base64,'+bytes.toString('base64');
}
for(const [,key] of template.matchAll(/data-image="([^"]+)"/g))if(!files[key])throw new Error('Unknown image '+key);
function build(map){
 const assets='window.MAREVYS_ASSETS = '+JSON.stringify(map)+';';
 // Callbacks insert code literally. Replacement strings would interpret $$, $&, etc.
 return template.replace('<!--STYLES-->',()=>'<style>\n'+css+'\n</style>').replace('<!--SCRIPTS-->',()=>'<script>\n'+assets+'\n'+scripts+'\n</script>');
}
// Both delivered entry points are fully embedded; neither requires an assets folder at runtime.
const complete=build(embedded);
// Validate the actual delivered inline bundle, not just the separate source files.
const finalScripts=[...complete.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
if(finalScripts.length!==1)throw new Error('Expected one complete inline application bundle');
finalScripts.forEach((match,i)=>new vm.Script(match[1],{filename:'generated-inline-'+i+'.js'}));
if(!complete.includes(scripts))throw new Error('Source changed during HTML embedding');
fs.writeFileSync(path.join(root,'index.html'),complete);
fs.writeFileSync(path.join(root,'../MAREVYS_PARIS_RC19_Complete_Embedded.html'),complete);
console.log(JSON.stringify({version:'RC19',languages:['en','fr','zh-Hans'],readingSystems:['runes','tarot-major-arcana','i-ching'],embeddedAssets:Object.keys(files).length,finalBundleSyntax:'passed',completeBytes:Buffer.byteLength(complete)}));
