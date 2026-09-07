const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const ctx={window:{}};vm.createContext(ctx);
const sourceFiles=['data.js','experience-data.js','oracle-data.js','i18n.js','i18n-runes.js','i18n-house.js','i18n-flow.js','i18n-experience.js','i18n-oracles.js','i18n-rc15.js','i18n-rc16-gate.js','i18n-rc16.js','i18n-rc17.js','i18n-rc18.js','i18n-rc19.js','core.js','oracle.js','app.js'];
for(const file of sourceFiles.slice(0,-2))vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),ctx,{filename:file});
const w=ctx.window,C=w.MarevysCore,D=w.MAREVYS_DATA,E=w.MAREVYS_EXPERIENCE,tr=C.makeTranslator(w.MAREVYS_TEXT);
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
test('Every translation row has English, French and Chinese',()=>{for(const row of w.MAREVYS_TEXT){assert.equal(row.length,3);for(const item of row)assert.equal(typeof item,'string');}});
test('English source strings round-trip exactly',()=>{for(const row of w.MAREVYS_TEXT)assert.equal(tr.t(row[0],'en'),row[0]);});
test('French and Chinese use the dictionary',()=>{for(const lang of ['fr','zh'])for(const row of w.MAREVYS_TEXT)assert.equal(tr.t(row[0],lang),tr.rows.get(C.normalize(row[0]))[lang]);});
test('All interpolation parameters are preserved in translations',()=>{
 const tokens=s=>(s.match(/\{\w+\}/g)||[]).sort().join();
 for(const [en,fr,zh] of w.MAREVYS_TEXT){assert.equal(tokens(en),tokens(fr),en);assert.equal(tokens(en),tokens(zh),en);}
});
test('Case variations and compound product materials translate',()=>{assert.equal(tr.t('Readings','fr'),'Lectures');assert.equal(tr.t('TEA · JOURNAL · PAPER','zh'),'茶 · 手记 · 纸');});
test('French context detection handles accents and career questions',()=>{assert.equal(C.context('Quelle décision dois-je prendre ?',''),'DECISION');assert.equal(C.context('Comment évolue ma carrière ?',''),'WORK');assert.equal(C.context('Ma relation de couple',''),'RELATIONSHIP');});
test('Chinese, English and French work context detection agree',()=>{assert.equal(C.context('我的工作发展如何',''),'WORK');assert.equal(C.context('How is my career going?',''),'WORK');for(const keyword of ['合作','项目','客户','团队','公司','合伙','合同'])assert.equal(C.context(`这个${keyword}接下来如何推进？`,''),'WORK',keyword);for(const question of ['Should this client contract continue?','Ce projet de collaboration mérite-t-il de continuer ?'])assert.equal(C.context(question,''),'WORK',question);});
test('A stable focus ID wins over translated words or ambiguous question content',()=>{assert.equal(C.context('My work relationship','WORK'),'WORK');assert.equal(C.context('事业','NO QUESTION'),'OPEN READING');});
test('Language changes preserve picks, mode, focus, input and saved IDs',()=>{const state={lang:'en',picked:[2,6,23],mode:'THREE RUNES',focus:'WORK',question:'我的问题',reflection:'Je réfléchis.',savedId:17};const original=JSON.stringify({...state,lang:undefined});for(const lang of ['fr','zh','en']){assert(C.changeLanguage(state,lang));assert.equal(state.lang,lang);assert.equal(JSON.stringify({...state,lang:undefined}),original);}assert.equal(C.changeLanguage(state,'de'),false);assert.equal(state.lang,'en');});
test('All 24 runes have complete FR/ZH title, meaning and shadow text',()=>{assert.equal(D.R.length,24);for(const r of D.R)for(const lang of ['fr','zh'])assert.equal(w.MAREVYS_RUNES[r[1]][lang].length,3);});
test('All 24 rune title strings are translated',()=>{for(const r of D.R)assert(tr.has(r[2]),r[1]);});
test('Every rune theme has a translation',()=>{for(const r of D.R)for(const theme of r[5])assert(tr.has(theme),theme);});
test('All eight path names and descriptions are translated',()=>{assert.equal(D.PATHS.length,8);for(const p of D.PATHS){assert(tr.has(p.name));assert(tr.has(p.desc));}});
test('All eight rituals are fully translated',()=>{for(const r of Object.values(D.PATH_RITUALS))for(const s of Object.values(r))assert(tr.has(s),s);});
test('All commerce suggestions have localized descriptions and material notes',()=>{for(const items of Object.values(D.PATH_COMMERCE))for(const x of items){assert(tr.has(x.line),x.line);assert(tr.has(x.meta),x.meta);}});
test('All maison descriptions and item details are translated',()=>{for(const d of Object.values(D.MAISON_DATA)){assert(tr.has(d.intro),d.intro);for(const item of d.items||[])for(const s of item.slice(1))assert(tr.has(s),s);}});
test('All product descriptions and specification lines are translated',()=>{for(const p of Object.values(D.PRODUCTS)){assert(tr.has(p.desc),p.desc);for(const line of p.meta.split('\n'))assert(tr.has(line),line);}});
test('Known single rune mapping stays unchanged',()=>{assert.equal(C.pathFromRunes(['OTHALA'],D.RUNE_PATH_WEIGHTS),'GROUND');assert.equal(C.pathFromRunes(['ALGIZ'],D.RUNE_PATH_WEIGHTS),'PROTECT');assert.equal(C.pathFromRunes(['ISA'],D.RUNE_PATH_WEIGHTS),'REST');});
test('Three-rune mapping uses the original position weights',()=>{assert.equal(C.pathFromRunes(['DAGAZ','RAIDHO','OTHALA'],D.RUNE_PATH_WEIGHTS),'MOVE');});
test('Path scoring is independent of display language for all 24 runes',()=>{for(const r of D.R){const baseline=C.pathFromRunes([r[1]],D.RUNE_PATH_WEIGHTS);for(const lang of ['en','fr','zh']){tr.t(r[2],lang);assert.equal(C.pathFromRunes([r[1]],D.RUNE_PATH_WEIGHTS),baseline);}}});
test('Daily rune stays stable within a local calendar day',()=>{assert.equal(C.dailyIndex(new Date(2026,8,1,1),24),C.dailyIndex(new Date(2026,8,1,23),24));});
test('Storage preserves language, reading and bag values',()=>{const map=new Map(),s=C.createStore({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)});s.write('lang','zh');assert.equal(s.read('lang','en'),'zh');s.write('bag',['EAU 01']);assert.equal(s.read('bag',[])[0],'EAU 01');});
test('Blocked storage degrades to session memory without crashing',()=>{const s=C.createStore({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});assert.equal(s.read('x','en'),'en');assert.equal(s.write('x','fr'),false);assert.equal(s.read('x','en'),'fr');assert(s.failed);});
test('Legacy plain-string consent is retained',()=>{const s=C.createStore({getItem:()=> 'accepted',setItem:()=>{}});assert.equal(s.read('consent',''),'accepted');});
test('Malformed saved JSON cannot crash initialization',()=>{const s=C.createStore({getItem:()=>'{broken',setItem:()=>{}});assert.equal(s.read('history',[]).length,0);});
test('Legacy saved records keep user text and stable rune identifiers',()=>{const input=[{date:'2026-09-01',question:'工作 & amour <script>',reflection:'我想保留原文',runes:[{n:'FEHU',s:'bad',themes:['injected']}]}];const data=C.cleanReadings(input,D.R);assert.equal(data[0].question,input[0].question);assert.equal(data[0].reflection,input[0].reflection);assert.equal(data[0].runes[0].s,'ᚠ');assert.equal(data[0].runes[0].themes[0],'resources');});
test('User HTML is escaped',()=>{assert.equal(C.escape('<script>"&\''),'&lt;script&gt;&quot;&amp;&#39;');});
test('All application scripts parse',()=>{for(const f of fs.readdirSync(path.join(root,'src')).filter(x=>x.endsWith('.js')))new vm.Script(fs.readFileSync(path.join(root,'src',f),'utf8'),{filename:f});});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('Final delivered HTML inline scripts parse successfully',()=>{
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 assert.equal(scripts.length,1);
 scripts.forEach((match,i)=>new vm.Script(match[1],{filename:'final-bundle-'+i+'.js'}));
});
test('Bundled JavaScript preserves every source byte including double-dollar selectors',()=>{
 const joined=sourceFiles.map(f=>fs.readFileSync(path.join(root,'src',f),'utf8').replace(/<\/script/gi,'<\\/script')).join('\n');
 assert(html.includes(joined),'HTML replacement modified JavaScript source');
});
test('Complete HTML contains one embedded copy of each RC19 asset and the Runic font',()=>{assert.equal((html.match(/data:image\/webp;base64,/g)||[]).length,104);assert.equal((html.match(/data:image\/png;base64,/g)||[]).length,1);assert.equal((html.match(/data:font\/woff2;base64,/g)||[]).length,1);});
const embeddedAssets=JSON.parse(html.match(/window\.MAREVYS_ASSETS = (\{[^\n]+\});/)[1]);
test('RC19 style and source layers are present in the delivered bundle',()=>{
 assert.equal(Object.keys(embeddedAssets).length,105);assert(html.includes('/* RC19 — tactile reading surfaces, a clearer commerce reveal and one-action flow. */'));assert(html.includes("font-family:'Marevys Runic'"));
 assert(html.includes('.experience-v19 #s4 .stone-inscription'));assert(html.includes('.experience-v19 .ritual-bookmarks'));assert(html.includes('var(--reading-record-image)'));
 assert(html.includes(fs.readFileSync(path.join(root,'src/rc19.css'),'utf8')));
 assert(html.includes(fs.readFileSync(path.join(root,'src/i18n-rc19.js'),'utf8')));
});
test('RC19 build targets a matching complete embedded output',()=>{
 const build=fs.readFileSync(path.join(root,'build.cjs'),'utf8'),output=path.join(root,'..','MAREVYS_PARIS_RC19_Complete_Embedded.html');
 assert(build.includes("version:'RC19'"));assert(build.includes("'../MAREVYS_PARIS_RC19_Complete_Embedded.html'"));
 assert(fs.existsSync(output));assert(fs.readFileSync(output).equals(fs.readFileSync(path.join(root,'index.html'))));
});
test('All embedded image bytes match the delivered final assets',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'ASSET_MANIFEST.json'),'utf8'));
 assert.equal(manifest.version,'RC19');assert.equal(manifest.assets.length,105);
 assert.equal(Object.keys(embeddedAssets).length,manifest.assets.length);
 for(const asset of manifest.assets){
  const data=embeddedAssets[asset.key];assert(data,asset.key);
  const bytes=Buffer.from(data.slice(data.indexOf(',')+1),'base64');
  assert(bytes.equals(fs.readFileSync(path.join(root,asset.file))),asset.file);
  assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.file);
 }
});
test('Every non-logo photograph has one semantic purpose and unique source bytes',()=>{
 const template=fs.readFileSync(path.join(root,'src/template.html'),'utf8');
 const rc19=fs.readFileSync(path.join(root,'src/rc19.css'),'utf8');
 const staticKeys=[...template.matchAll(/data-image="([^"]+)"/g)].map(match=>match[1]).filter(key=>key!=='logo');
 assert.equal(staticKeys.length,7);assert.equal(new Set(staticKeys).size,staticKeys.length);
 const productKeys=E.products.map(product=>product.image),ritualKeys=Object.values(E.ritualPlans).map(plan=>plan.image),matchKeys=E.products.map(product=>product.matchImage),bookmarkKeys=E.products.map(product=>product.ritualImage);
 assert.equal(productKeys.length,12);assert.equal(new Set(productKeys).size,12);assert(E.products.every(product=>!Object.hasOwn(product,'crop')));
 assert.equal(ritualKeys.length,8);assert.equal(new Set(ritualKeys).size,8);
 assert.equal(matchKeys.length,12);assert.equal(new Set(matchKeys).size,12);assert.equal(matchKeys.filter(key=>productKeys.includes(key)||ritualKeys.includes(key)||bookmarkKeys.includes(key)).length,0);
 assert.equal(bookmarkKeys.length,12);assert.equal(new Set(bookmarkKeys).size,12);assert.equal(bookmarkKeys.filter(key=>productKeys.includes(key)||ritualKeys.includes(key)).length,0);
 const tarotKeys=Array.from({length:22},(_,number)=>'tarot'+String(number).padStart(2,'0'));
 const physicalKeys=[...Array.from({length:24},(_,number)=>'runeStoneBack'+(number+1)),'tarotBack','runeReadingSurface','tarotReadingSurface','ichingReadingSurface'];
 const semantic=['hero','ichingReading',...tarotKeys,...staticKeys,...productKeys,...ritualKeys,...physicalKeys,'readingRecordReturn01',...matchKeys,...bookmarkKeys];
 assert.equal(semantic.length,104);assert.equal(new Set(semantic).size,104);
 assert(!Object.hasOwn(embeddedAssets,'tarotReading'));
 for(const key of tarotKeys)assert(embeddedAssets[key],key);
 assert.deepEqual([...new Set(semantic)].sort(),Object.keys(embeddedAssets).filter(key=>key!=='logo').sort());
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'ASSET_MANIFEST.json'),'utf8')),content=manifest.assets.filter(asset=>asset.key!=='logo');
 assert.equal(new Set(content.map(asset=>asset.sha256)).size,104,'no duplicated or renamed content image bytes');
 for(const key of physicalKeys)assert(embeddedAssets[key],key);
 assert(rc19.includes('.experience-v19 .ritual-bookmark>img'));
 assert(rc19.includes("feTurbulence type='fractalNoise'"));assert(rc19.includes('var(--tarot-reading-surface)'));assert(rc19.includes('var(--reading-record-image)'));
});
test('Branding follows the latest per-product choices and the approved mark has transparency',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'ASSET_MANIFEST.json'),'utf8'));
 const choices={parfum:'parfum-minimal-label.webp',journal:'journal-subtle.webp',object:'object-branded.webp',ritual:'ritual-small-label.webp',runes:'runes.webp',tea:'tea.webp',oracle:'oracle.webp',yi:'yi.webp'};
 for(const [key,file] of Object.entries(choices))assert(manifest.assets.some(a=>a.key===key&&a.file==='assets/'+file),key);
 assert(embeddedAssets.logo.startsWith('data:image/png;base64,'));
 const png=Buffer.from(embeddedAssets.logo.split(',')[1],'base64');assert.equal(png[25],6);
});
test('Standalone makes no external code or asset requests',()=>{assert(!/<script[^>]+src=/.test(html));assert(!/<link[^>]+href=["']https?:/.test(html));assert(!/src=["']assets\//.test(html));assert(!/url\(["']?assets\//.test(html));});
test('Template has all three language options and mobile support',()=>{assert(html.includes('value="en"'));assert(html.includes('value="fr"'));assert(html.includes('value="zh"'));assert(html.includes('max-width:640px'));assert(html.includes('prefers-reduced-motion'));});
test('Homepage system photographs remain unbranded and every catalogue master is the same 4:5 format',()=>{
 const originals={runes:'37d84323ecb4f63eb09406a5c6d90b2cc21f2673efa631a33a95ae9d281235ff',oracle:'1eb06efee4e6dc0becbf8b14ec75df9bd0568d3d57515d7f5f806daca52b0bb3',yi:'76f7b00f642e012cd9205c79ab1e53bb2ba689cc893ffda483c92dca20c41d27'};
 for(const [key,hash] of Object.entries(originals))assert.equal(require('node:crypto').createHash('sha256').update(Buffer.from(embeddedAssets[key].split(',')[1],'base64')).digest('hex'),hash,key);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'ASSET_MANIFEST.json'),'utf8'));
 for(const key of E.products.map(product=>product.image)){
   const asset=manifest.assets.find(item=>item.key===key);assert(asset,key);assert.equal(asset.width,1024,key);assert.equal(asset.height,1280,key);
 }
});
const inventory=JSON.parse(require('node:child_process').execFileSync('python',['tests/inspect_html.py'],{cwd:root,input:fs.readFileSync(path.join(root,'src/template.html'),'utf8'),encoding:'utf8'}));
test('HTML nesting and closing tags are balanced',()=>{assert.equal(inventory.errors.length,0,JSON.stringify(inventory.errors));assert.equal(inventory.unclosed.length,0);});
test('Every HTML ID is unique',()=>{assert.equal(new Set(inventory.ids).size,inventory.ids.length);});
const productNames=new Set([...Object.keys(D.PRODUCTS),...Object.values(D.MAISON_DATA).flatMap(d=>(d.items||[]).map(i=>i[0])),...Object.values(D.PATH_COMMERCE).flatMap(items=>items.map(i=>i.name))]);
const exempt=s=>!/[a-zA-Z]/.test(s)||/^MARÉVYS(?: PARIS)?$|^PARIS$|^©/.test(s)||productNames.has(s)||D.R.some(r=>r[1]===s);
const missing=[...new Set([...inventory.text,...inventory.attributes].filter(s=>!exempt(s)&&!tr.has(s)))];
test('Every static visible string and descriptive attribute is translated',()=>assert.equal(missing.length,0,JSON.stringify(missing,null,2)));
test('Every inline handler has an exported implementation',()=>{
 const handlersSource=['app.js','oracle.js'].map(file=>fs.readFileSync(path.join(root,'src',file),'utf8')).join('\n');
 const exports=[...handlersSource.matchAll(/Object.assign\(window,\{([\s\S]*?)\}\);/g)].map(match=>match[1]).join('\n');
 for(const h of inventory.handlers){for(const m of h.matchAll(/\b([a-zA-Z]+)\(/g)){if(['getElementById','scrollIntoView'].includes(m[1]))continue;assert(new RegExp('\\b'+m[1]+'\\b').test(exports),m[1]);}}
});
test('Every legal paragraph and heading is localized',()=>{for(const d of Object.values(D.LEGAL_COPY)){const parts=d.body.matchAll(/>([^<>]+)</g);for(const [,s] of parts)if(s.trim())assert(tr.has(s.trim()),s);}});
test('No legacy runtime inference or undefined context map remains',()=>{const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');assert(!app.includes('CONTEXT_COPY'));assert(!app.includes('MutationObserver'));});
const template=fs.readFileSync(path.join(root,'src/template.html'),'utf8');
const appSource=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
test('Homepage explains all three readings and the collection without a large overlaid logo',()=>{
 const hero=template.match(/<section class="hero"[^>]*>([\s\S]*?)<\/section>/)[1];
 assert(!hero.includes('data-image="logo"'));assert(!html.includes('hero-seal'));assert(!html.includes('hero-brand-mark'));
 assert(hero.includes('What lies beneath.'));assert(hero.includes('Choose a reading'));assert(!hero.includes('Explore the collection'));assert(embeddedAssets.hero);
});
test('All five top-left brand marks are native home links',()=>{
 const links=[...template.matchAll(/<a class="brand-identity brand-home"[^>]*>/g)];
 assert.equal(links.length,5);
 for(const [link] of links){assert(link.includes('href="#main-content"'));assert(link.includes('onclick="goHome(event)"'));assert(link.includes('aria-label="Return to home"'));}
});
test('Home links have trilingual accessible names and participate in the dialog focus trap',()=>{
 assert.equal(tr.t('Return to home','en'),'Return to home');assert.equal(tr.t('Return to home','fr'),'Retour à l’accueil');assert.equal(tr.t('Return to home','zh'),'返回首页');
 assert(appSource.includes("querySelectorAll('a[href],button:not(:disabled)"));assert(html.includes('a:focus-visible'));
});
// Small DOM doubles exercise the actual navigation functions. This is not a browser/rendering test.
function navigationHarness(lang,ids){
 const calls={prevented:0,cancelled:[],scrolls:[],focused:null};
 function element(id,classes=[]){
  const tokens=new Set(classes),attrs=new Map();
  return {id,style:{},value:'',classList:{add:n=>tokens.add(n),remove:n=>tokens.delete(n),contains:n=>tokens.has(n),toggle(n,force){const on=force===undefined?!tokens.has(n):force;on?tokens.add(n):tokens.delete(n);return on;}},
   setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),getAttribute:k=>attrs.get(k),focus:()=>{calls.focused=id;}};
 }
 const body=element('body',ids.length?['has-layer']:[]);body.style.overflow=ids.length?'hidden':'';
 const nodes={'#mobileMenu':element('mobileMenu',['open']),'.menu-toggle':element('menu-toggle'),'.overlay-language':element('language'),'nav .brand-home':element('home-link'),'#question':element('question'),'#reflection':element('reflection')};
 nodes['.menu-toggle'].setAttribute('aria-expanded','true');nodes['#question'].value='保留我的问题';nodes['#reflection'].value='Garder ma réflexion.';
 const opened=ids.map(id=>{const el=element(id,['open']);el.setAttribute('aria-modal','true');return el;});
 const layers=opened.map(el=>({el,previous:null}));
 const state={lang,mode:'THREE RUNES',focus:'WORK',picked:[2,6,23],stage:4,drawn:true,sessionId:18,savedId:17,bag:['EAU 01','STONE 24'],maison:'PARFUMS',product:'EAU 01',strategy:{kind:'ritual'},legal:'privacy',checkout:true};
 const ctx={$:selector=>{assert(nodes[selector],selector);return nodes[selector];},$$:()=>[nodes['#mobileMenu']],document:{body},layers,state,go:{timer:2468},clearTimeout:id=>calls.cancelled.push(id),window:{scrollTo:options=>calls.scrolls.push(options),location:{reload(){throw Error('Home must not reload the page');}}}};
 const sync=appSource.slice(appSource.indexOf('  function syncLayers(){'),appSource.indexOf('  function openLayer(id){'));
 const home=appSource.slice(appSource.indexOf('  function closeMobileMenu(){'),appSource.indexOf('  function chooseLanguage(lang){'));
 assert(sync&&home);vm.createContext(ctx);vm.runInContext(sync+'\n'+home,ctx);
 return {ctx,state,layers,opened,nodes,body,calls,click:()=>ctx.goHome({preventDefault(){calls.prevented++;}})};
}
test('Home closes the complete layer stack, mobile menu and pending reading transition',()=>{
 const h=navigationHarness('zh',['reading','pathDrawer','maisonDrawer','productModal','bagModal','accountModal','legalDrawer','strategyOverlay']);h.click();
 assert.equal(h.layers.length,0);for(const el of h.opened){assert(!el.classList.contains('open'));assert.equal(el.getAttribute('aria-modal'),undefined);}
 assert.equal(h.body.style.overflow,'');assert(!h.body.classList.contains('has-layer'));assert.equal(h.nodes['.overlay-language'].hidden,true);
 assert(!h.nodes['#mobileMenu'].classList.contains('open'));assert.equal(h.nodes['.menu-toggle'].getAttribute('aria-expanded'),'false');assert.deepEqual(h.calls.cancelled,[2468]);
 for(const key of ['maison','product','strategy','legal'])assert.equal(h.state[key],null);assert.equal(h.state.checkout,false);
});
test('Home preserves language, wishlist, rune choices and typed input in all three languages',()=>{
 const keys=['lang','mode','focus','picked','stage','drawn','sessionId','savedId','bag'];
 for(const lang of ['en','fr','zh']){
  const h=navigationHarness(lang,['reading','maisonDrawer']);const snapshot=JSON.stringify(keys.map(k=>h.state[k]));h.click();
  assert.equal(JSON.stringify(keys.map(k=>h.state[k])),snapshot);assert.equal(h.nodes['#question'].value,'保留我的问题');assert.equal(h.nodes['#reflection'].value,'Garder ma réflexion.');
  assert.equal(h.calls.prevented,1);assert.equal(h.calls.focused,'home-link');assert.equal(h.calls.scrolls[0].top,0);assert.equal(h.calls.scrolls[0].left,0);
 }
});
test('Returning home is safe and repeatable with no active layer or event argument',()=>{
 const h=navigationHarness('fr',[]);h.ctx.goHome();h.ctx.goHome();h.click();assert.equal(h.calls.scrolls.length,3);assert.equal(h.layers.length,0);assert.equal(h.state.lang,'fr');
});
test('Selected rectangular perfume preserves approved canonical bytes and branding',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'ASSET_MANIFEST.json'),'utf8'));
 const canonical=manifest.assets.find(asset=>asset.key==='parfum');
 assert(canonical);assert.equal(canonical.file,'assets/parfum-minimal-label.webp');
 assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,canonical.file))).digest('hex'),canonical.sha256);
 assert.equal(canonical.sha256,'a9cbb32baddb63e9b3a29bcab6524bf322556ff86c169dd55b24b00ee211d9d2');
 assert.match(canonical.branding,/minimal ivory rectangular-label/);
 const masterPath=path.join(root,'source-images/parfum-minimal-label.png');
 if(!fs.existsSync(masterPath)){
  console.log('SKIP archival master comparison: lean deployment repository excludes source-images; canonical image bytes and branding were verified.');
  return;
 }
 const selected=fs.readFileSync(masterPath);
 assert(selected.equals(fs.readFileSync(path.join(root,'alternatives/parfum-minimal-label.png'))));
 const prompts=JSON.parse(fs.readFileSync(path.join(root,'IMAGE_PROMPTS.json'),'utf8'));
 assert.equal(prompts.assets.find(a=>a.name==='parfum').reusedExistingImage,true);
 assert(prompts.assets.find(a=>a.name==='ritual').prompt.includes('Change ONLY the branding treatment'));
});
console.log(`\n${count} tests passed; ${tr.rows.size} unique translation keys.`);
