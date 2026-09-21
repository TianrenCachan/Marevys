(function () {
  'use strict';
  const C=window.MarevysCore,D=window.MAREVYS_DATA,E=window.MAREVYS_EXPERIENCE;
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const esc=C.escape, translator=C.makeTranslator(window.MAREVYS_TEXT);
  let storage;try{storage=window.localStorage}catch{storage=null;}
  const store=C.createStore(storage);
  const state={lang:store.read('marevys.language.v1','en'),mode:'ONE RUNE',focus:'',desiredOutcome:'',picked:[],stoneOrder:[],revealIndex:0,stage:0,drawn:false,
    interpretation:null,interpretationStatus:'idle',interpretationSource:'local',interpretationLang:null,interpretationRequest:0,energyMatch:null,ritualPlan:null,selectedProductIds:[],tracked:{},
    sessionId:Date.now(),savedId:null,maison:null,product:null,strategy:null,legal:null,checkout:false,exampleIndex:0,
    memberAccess:false,memberGateMode:'join',memberAccessMethod:null,
    bag:[...new Set(store.read('marevys.bag.v1',[]).filter(x=>typeof x==='string'&&x.trim()))]};
  const FLOW_STAGES=[0,2,3,4,5,6,7];
  if(!['en','fr','zh'].includes(state.lang))state.lang='en';
  const t=(key,params={})=>translator.t(key,state.lang,params);
  const locales={en:'en-GB',fr:'fr-FR',zh:'zh-CN'};
  const date=s=>{const d=new Date(s);return Number.isNaN(d.valueOf())?'':new Intl.DateTimeFormat(locales[state.lang],{year:'numeric',month:'short',day:'numeric'}).format(d)};
  const asset=k=>window.MAREVYS_ASSETS[k];
  const photo=(key,alt,cls='')=>`<img src="${asset(key)}" alt="${esc(t(alt))}" class="${cls}" loading="lazy" decoding="async">`;
  const translateNode=node=>{
    const raw=node.nodeValue,key=C.normalize(raw);
    if(key)node.nodeValue=raw.replace(raw.trim(),t(key));
  };
  function textNodes(root) {
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];let n;
    while((n=walker.nextNode())) {
      if(!n.parentElement?.closest('script,style,select,[data-user-content]')&&C.normalize(n.nodeValue))nodes.push(n);
    }
    return nodes;
  }
  function translateTree(root) {textNodes(root).forEach(translateNode);}
  const staticText=[],staticAttrs=[];
  function rememberStaticText() {
    textNodes(document.body).forEach(node=>staticText.push([node,node.nodeValue]));
    $$('[placeholder],[alt],[aria-label]').forEach(el=>{
      for(const attr of ['placeholder','alt','aria-label'])if(el.hasAttribute(attr))staticAttrs.push([el,attr,el.getAttribute(attr)]);
    });
  }
  function put(selector,markup){const el=$(selector);if(el){el.innerHTML=markup;translateTree(el);}}
  function set(selector,value){const el=$(selector);if(el)el.textContent=value;}
  function toast(key,params={}){
    const el=$('#toast');el.textContent=t(key,params);el.classList.add('visible');
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),4000);
  }
  function save(key,value){const ok=store.write(key,value);if(!ok)toast('Storage is unavailable. This session works, but changes may be lost when you close the page.');return ok;}
  function trackEvent(name,detail={}){
    if(typeof name!=='string'||!/^[a-z_]+$/.test(name))return;
    const clean={};
    for(const [key,value] of Object.entries(detail||{})){
      if(/question|text|prompt|answer/i.test(key))continue;
      if(['string','number','boolean'].includes(typeof value))clean[key]=typeof value==='string'?value.slice(0,80):value;
    }
    if(!Array.isArray(window.MAREVYS_ANALYTICS_EVENTS))window.MAREVYS_ANALYTICS_EVENTS=[];
    window.MAREVYS_ANALYTICS_EVENTS.push({name,at:new Date().toISOString(),sessionId:state.sessionId,stage:state.stage,detail:clean});
  }
  function trackOnce(name,detail={}){if(state.tracked[name])return;state.tracked[name]=true;trackEvent(name,detail);}
  const layers=[];
  function syncLayers(){
    document.body.style.overflow=layers.length?'hidden':'';
    document.body.classList.toggle('has-layer',layers.length>0);
    $('.overlay-language').hidden=!layers.length;
    layers.forEach((layer,i)=>{layer.el.style.zIndex=String(50+i*2);layer.el.inert=i<layers.length-1;layer.el.setAttribute('aria-modal',String(i===layers.length-1));});
    $$('body>nav,#mobileMenu,#main-content,body>footer,body>.skip-link').forEach(el=>el.inert=layers.length>0);
  }
  function openLayer(id){
    const el=$('#'+id);if(!el)return;
    closeMobileMenu();
    const existing=layers.findIndex(l=>l.el===el);
    if(existing>=0)layers.push(layers.splice(existing,1)[0]);else layers.push({el,previous:document.activeElement});
    el.classList.add('open');el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
    syncLayers();
    const focusEl=el.querySelector('.stage.active textarea,.close,button');if(focusEl)focusEl.focus({preventScroll:true});
  }
  function closeLayer(id){
    const i=layers.findIndex(l=>l.el.id===id);if(i<0)return;
    const [layer]=layers.splice(i,1);layer.el.classList.remove('open');layer.el.removeAttribute('aria-modal');layer.el.inert=false;syncLayers();
    const top=layers.at(-1)?.el;
    if(layer.previous?.isConnected&&(!top||top.contains(layer.previous)))layer.previous.focus({preventScroll:true});
    else top?.querySelector('.close,a[href],button')?.focus({preventScroll:true});
  }
  function toggleMenu(){const m=$('#mobileMenu');m.classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',String(m.classList.contains('open')));}
  function closeMobileMenu(){$('#mobileMenu').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');}
  function closeAllLayers(){
    clearTimeout(go.timer);
    // The global home/navigation actions bypass each overlay's close button, so
    // explicitly stop any hidden Oracle countdown or obsolete AI response.
    window.MarevysOracle?.cancelPendingOracleWork?.();
    window.MarevysStudio?.pause?.();
    // Leave every overlay without reloading or changing the user's saved/session data.
    for(const layer of layers.splice(0)){
      layer.el.classList.remove('open');layer.el.removeAttribute('aria-modal');layer.el.inert=false;
    }
    state.maison=null;state.product=null;state.strategy=null;state.legal=null;state.checkout=false;
    closeMobileMenu();syncLayers();
  }
  function goHome(event){
    event?.preventDefault();closeAllLayers();
    $('nav .brand-home')?.focus({preventScroll:true});
    window.scrollTo({top:0,left:0,behavior:'auto'});
  }
  function navigateSection(event,id){
    event?.preventDefault();const target=document.getElementById(id);if(!target)return;
    closeAllLayers();target.tabIndex=-1;target.focus({preventScroll:true});
    target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function chooseLanguage(lang){
    if(!C.changeLanguage(state,lang))return;
    store.write('marevys.language.v1',lang);applyLanguage();
  }
  function aiEndpoint(){
    const raw=typeof window.MAREVYS_AI_ENDPOINT==='string'?window.MAREVYS_AI_ENDPOINT.trim():'';
    if(!raw)return '';
    return (raw.startsWith('/')&&!raw.startsWith('//'))||/^https:\/\//i.test(raw)||/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\//i.test(raw)?raw:'';
  }
  const hasAiEndpoint=()=>Boolean(aiEndpoint());
  function renderQuestionPrivacy(){
    set('#questionPrivacy',t(hasAiEndpoint()?'Your question will be processed online for this AI-assisted interpretation. See Privacy for details.':'In this preview, your question stays on this device.'));
  }
  function applyLanguage(){
    document.documentElement.lang=state.lang==='zh'?'zh-Hans':state.lang;
    document.documentElement.dataset.language=state.lang;
    $$('[data-language]').forEach(el=>el.value=state.lang);
    staticText.forEach(([node,raw])=>{if(node.isConnected){node.nodeValue=raw;translateNode(node);}});
    staticAttrs.forEach(([el,attr,value])=>{if(el.isConnected)el.setAttribute(attr,t(value));});
    document.title='MARÉVYS PARIS — '+t('Symbolic Readings & Everyday Rituals');
    $('meta[name="description"]').content=t('MARÉVYS PARIS — Rune, Tarot and I Ching readings with objects for everyday rituals.');
    renderQuestionPrivacy();renderExample();renderHomeCollection();renderPaths();renderMemberGate();renderPath();renderDrawHint();renderReadingStatus();updateBagCount();
    if(state.picked.length){
      if(state.stage>=3)renderReveal();
      if(state.stage===4){
        if(state.interpretationSource==='local'||!hasAiEndpoint()){state.interpretation=buildLocalInterpretation(buildReadingPayload());state.interpretationLang=state.lang;renderInterpretation();}
        else if(state.interpretationLang!==state.lang)showReading();else renderInterpretation();
      }
      if(state.stage===5)renderEnergyMatch();
      if(state.stage===6){renderEnergyMatch();renderRitualPlan();}
      if(state.stage===7)renderSaved();
    }
    if(state.maison)renderMaison();if(state.product)renderProduct();
    if($('#bagModal').classList.contains('open'))renderBag();
    if(state.legal)renderLegal();if(state.strategy)renderStrategy();
    if($('#accountMsg')?.dataset.message)set('#accountMsg',t($('#accountMsg').dataset.message));
    if($('#newsletterMsg')?.dataset.message)set('#newsletterMsg',t($('#newsletterMsg').dataset.message));
    window.MarevysOracle?.applyLanguage?.(state.lang);
    window.MarevysStudio?.applyLanguage?.(state.lang);
    $('#toast').classList.remove('visible');
  }
  function rune(index){
    const r=D.R[index],localized=state.lang==='en'?r.slice(2,5):window.MAREVYS_RUNES[r[1]][state.lang];
    return {symbol:r[0],name:r[1],title:localized[0],meaning:localized[1],shadow:localized[2],themes:r[5]};
  }
  const contextMessages={
    RELATIONSHIP:'In relationships, notice the quality of exchange rather than chasing certainty.',
    WORK:'At work, consider what deserves your energy and direction now, rather than asking for a fixed outcome.',
    DECISION:'Read the symbol as a lens on the choice, not an instruction that removes your agency.',
    CHANGE:'Around change, notice what is emerging and what you may be trying to preserve beyond its time.',
    SELF:'Turn attention inward: what pattern asks to be seen before it is solved?',
    'OPEN READING':'Let the symbol meet the question without forcing it into a prediction.'
  };
  function currentContext(){return C.context($('#question')?.value||'',state.focus);}
  function inferredOutcome(context){
    return {RELATIONSHIP:'CLARITY',WORK:'ACT',DECISION:'DECIDE',CHANGE:'ACT',SELF:'STEADY','OPEN READING':'CLARITY'}[context]||'CLARITY';
  }
  function renderExample(){
    const example=E.examples[state.exampleIndex],r=rune(D.R.findIndex(x=>x[1]===example.rune));
    set('#exampleRune',r.symbol);set('#exampleName',r.name);set('#exampleTitle',r.title);
    set('#exampleQuestion','“'+t(example.question)+'”');set('#exampleMeaning',t(example.meaning));set('#examplePrompt',t(example.prompt));set('#examplePractice',t(example.practice));
  }
  function cycleExample(){state.exampleIndex=(state.exampleIndex+1)%E.examples.length;renderExample();}
  function renderReadingStatus(){
    const visibleIndex=Math.max(0,FLOW_STAGES.indexOf(state.stage));
    const step=['Your question','Draw your rune','Meet the symbol','Your interpretation','Your ritual set','Your complete ritual','Keep the reading'][visibleIndex];
    set('#readingStatus',t('Step {current} of {total} — {step}',{current:visibleIndex+1,total:7,step:t(step)}));
  }
  function continueFromQuestion(){
    const hasQuestion=Boolean(String($('#question')?.value||'').trim());
    if(!hasQuestion)state.focus='NO QUESTION';
    state.desiredOutcome=inferredOutcome(currentContext());
    trackOnce('question_completed',{hasQuestion,focus:state.focus||'NONE',desiredOutcome:state.desiredOutcome});
    chooseMode('ONE RUNE');
  }
  function chooseRuneDirection(outcome){
    chooseDesiredOutcome(outcome);
    chooseMode('ONE RUNE');
  }
  function go(n){
    if(!Number.isInteger(n)||!FLOW_STAGES.includes(n))return;
    if(n<3){clearTimeout(go.timer);state.drawn=false;}
    state.stage=n;$$('.stage').forEach(el=>el.classList.toggle('active',el.id==='s'+n));
    const visibleIndex=FLOW_STAGES.indexOf(n);
    $$('#readingProgress i').forEach((el,i)=>el.classList.toggle('on',i<=visibleIndex));
    renderReadingStatus();
    $('#reading').scrollTop=0;
    if(n===2)renderDrawHint();
    if(layers.at(-1)?.el.id==='reading'){
      const heading=$('#s'+n+' h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
    }
  }
  function start(){
    // A deliberately new reading must not inherit notes from a completed, saved one.
    // Unsaved input remains intact when navigating away and returning.
    if(state.savedId){
      $('#question').value='';$('#reflection').value='';state.focus='';
      $$('.chip').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});
    }
    clearTimeout(go.timer);state.picked=[];state.stoneOrder=[];state.revealIndex=0;state.drawn=false;state.savedId=null;state.sessionId=Date.now();
    state.desiredOutcome='';state.interpretation=null;state.interpretationStatus='idle';state.interpretationSource='local';state.interpretationLang=null;state.interpretationRequest++;
    state.energyMatch=null;state.ritualPlan=null;state.selectedProductIds=[];state.tracked={};
    $$('.outcome-chip').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});
    openLayer('reading');go(0);trackOnce('reading_started',{language:state.lang});
  }
  function closeReading(){clearTimeout(go.timer);closeLayer('reading');}
  function chooseMode(mode){
    state.mode=mode;state.picked=[];state.revealIndex=0;state.drawn=false;state.savedId=null;state.interpretation=null;state.interpretationRequest++;state.energyMatch=null;state.ritualPlan=null;state.selectedProductIds=[];
    $$('.mode').forEach(b=>{const selected=b.dataset.mode===mode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
    buildStones();go(2);
  }
  function shuffledRuneIndices(){
    const indices=Array.from({length:D.R.length},(_,i)=>i);
    for(let i=indices.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];
    }
    return indices;
  }
  function runeStoneBackAt(position){
    const safePosition=Number.isInteger(position)&&position>=0?position:0;
    return asset('runeStoneBack'+(safePosition+1));
  }
  function runeStoneBackForRune(index){return runeStoneBackAt(state.stoneOrder.indexOf(index));}
  function buildStones(){
    const box=$('#stones');box.replaceChildren();const daily=C.dailyIndex(new Date(),D.R.length);
    state.stoneOrder=state.mode==='DAILY RUNE'?[daily]:shuffledRuneIndices();box.dataset.count=state.stoneOrder.length;
    state.stoneOrder.forEach((i,position)=>{
      const b=document.createElement('button');b.className='stone';b.type='button';b.setAttribute('aria-pressed','false');
      b.dataset.index=i;b.setAttribute('aria-label',t('Face-down stone {number}',{number:position+1}));
      const image=document.createElement('img');image.src=runeStoneBackAt(position);image.alt='';image.setAttribute('aria-hidden','true');image.decoding='async';
      b.append(image);
      b.onclick=()=>choose(i);box.append(b);
    });
    $('#ritualCue').style.opacity='1';renderDrawHint();
  }
  function renderDrawSlots(){
    const multiple=state.mode==='THREE RUNES',slots=$('#drawSlots');slots.hidden=!multiple;
    if(!multiple){slots.replaceChildren();return;}
    const positions=['PAST','PRESENT','EMERGING'];
    put('#drawSlots',positions.map((position,i)=>`<div class="draw-slot ${i<state.picked.length?'filled':''}"><span class="slot-stone" aria-hidden="true"></span><small>${esc(t(position))}</small><span class="sr-only">${esc(t(i<state.picked.length?'Face-down stone selected':'Waiting for a face-down stone'))}</span></div>`).join(''));
  }
  function renderDrawHint(){
    let hint='Choose a stone without trying to explain why.';
    let cue='Notice the question once. Then let it go.';
    let note='The stones have been reshuffled. Their symbols remain hidden until you choose. There are no upright or reversed positions.';
    if(state.mode==='DAILY RUNE'){
      hint="Today's symbol remains the same for this calendar day.";cue='Meet the same symbol once. Notice what has changed in you.';
      note="One face-down stone holds today's fixed symbol. It will be revealed only after you choose it. There are no upright or reversed positions.";
    }
    if(state.mode==='THREE RUNES')hint=state.picked.length?'{count} of 3 chosen. Let another stone come forward.':'Choose three stones. Do not search for a sequence; let one form.';
    set('#drawHint',t(hint,{count:state.picked.length}));set('#blindDrawNote',t(note));set('#ritualCue p',t(cue));renderDrawSlots();
    let status='No stone selected yet.';
    if(state.mode==='THREE RUNES')status=state.picked.length===3?'Three face-down stones selected. Their symbols are still hidden.':
      t('{count} of 3 face-down stones selected. Next position: {position}.',{count:state.picked.length,position:t(['PAST','PRESENT','EMERGING'][state.picked.length])});
    else if(state.picked.length)status='One face-down stone selected. Its symbol is still hidden.';
    set('#drawStatus',t(status));
    const begin=$('#beginReveal');begin.hidden=!state.drawn;begin.textContent=t(state.mode==='THREE RUNES'?'Reveal the selected symbols':'Reveal my symbol');
    $('#stones').setAttribute('aria-label',t(state.mode==='DAILY RUNE'?'Face-down daily rune':'Face-down rune stones'));
    $$('#stones button').forEach((b,i)=>b.setAttribute('aria-label',t(b.classList.contains('chosen')?'Selected face-down stone {number}':'Face-down stone {number}',{number:i+1})));
  }
  function choose(i){
    if(state.drawn||state.picked.includes(i)||!D.R[i])return;
    if(state.mode==='DAILY RUNE'&&i!==C.dailyIndex(new Date(),D.R.length))return;
    state.picked.push(i);const b=$(`#stones button[data-index="${i}"]`);
    b.classList.add('chosen','selected');b.disabled=true;b.setAttribute('aria-pressed','true');
    const complete=state.mode==='THREE RUNES'?state.picked.length===3:state.picked.length===1;
    if(complete){state.drawn=true;$$('#stones button').forEach(el=>{el.disabled=true;if(!el.classList.contains('chosen'))el.classList.add('fade-away');});$('#ritualCue').style.opacity='0';trackOnce('draw_completed',{mode:state.mode,count:state.picked.length});}
    else $('#ritualCue').style.opacity='.4';
    renderDrawHint();
    if(complete)$('#beginReveal').focus({preventScroll:true});
    else{
      const buttons=$$('#stones button'),at=buttons.indexOf(b),next=[...buttons.slice(at+1),...buttons.slice(0,at)].find(el=>!el.disabled);next?.focus({preventScroll:true});
    }
  }
  function beginReveal(){
    const needed=state.mode==='THREE RUNES'?3:1;if(!state.drawn||state.picked.length!==needed)return;
    state.revealIndex=state.mode==='THREE RUNES'?0:1;set('#revealAnnouncement','');renderReveal();go(3);
  }
  function revealNext(){
    if(state.mode!=='THREE RUNES'||state.revealIndex>=3||state.picked.length!==3)return;
    state.revealIndex++;renderReveal();
    (state.revealIndex<3?$('#revealNext'):$('#enterReading')).focus({preventScroll:true});
  }
  function renderReveal(){
    const rr=state.picked.map(rune),multiple=rr.length===3,positions=['PAST','PRESENT','EMERGING'],shown=multiple?state.revealIndex:rr.length;
    $('#revealStones').classList.toggle('multiple',multiple);
    put('#revealStones',rr.map((r,i)=>{
      const revealed=i<shown,newest=i===shown-1;
      const stoneArt=runeStoneBackForRune(state.picked[i]);
      if(!multiple)return `<div class="reveal-stone just-revealed"><img class="reveal-stone-art" src="${esc(stoneArt)}" alt="" aria-hidden="true"><div class="reveal-symbol" aria-hidden="true">${r.symbol}</div></div>`;
      return `<article class="reveal-stone reveal-stone-small ${revealed?(newest?'just-revealed':'revealed-static'):'is-face-down'}"><img class="reveal-stone-art" src="${esc(stoneArt)}" alt="" aria-hidden="true"><span class="reveal-position">${esc(t(positions[i]))}</span>${revealed?`<div class="reveal-symbol" aria-hidden="true">${r.symbol}</div><strong>${r.name}</strong>`:`<span class="sr-only">${esc(t('Face-down selected rune'))}</span>`}</article>`;
    }).join(''));
    set('#revealCaption',t(multiple?'THREE SYMBOLS, REVEALED IN ORDER':'A SYMBOL COMES FORWARD'));
    set('#revealName',multiple?t('Three symbols'):rr[0]?.name||'');
    set('#revealTitle',multiple?t(shown===0?'Reveal each symbol in the order it was chosen.':shown<3?'{count} of 3 symbols revealed.':'A sequence begins to form.',{count:shown}):rr[0]?.title||'');
    if(multiple&&shown>0){const last=rr[shown-1];set('#revealAnnouncement',t('{position}: {rune} is revealed.',{position:t(positions[shown-1]),rune:last.name}));}
    else set('#revealAnnouncement','');
    const next=$('#revealNext'),enter=$('#enterReading');next.hidden=!multiple||shown>=3;enter.hidden=multiple?shown<3:shown<1;
    if(!next.hidden)next.textContent=t('Reveal the {position} symbol',{position:t(positions[shown])});
  }
  const ENERGY_PATHS=['GROUND','OPEN','PROSPER','CLEAR','MOVE','REST','PROTECT','CREATE'];
  const positionsFor=count=>count===3?['PAST','PRESENT','EMERGING']:['FOCUS'];
  function buildReadingPayload(){
    const rr=state.picked.map(rune),question=String($('#question')?.value||'').trim().slice(0,4000),positions=positionsFor(rr.length);
    return {schemaVersion:1,requestId:String(state.sessionId),locale:state.lang,mode:state.mode,context:currentContext(),desiredOutcome:state.desiredOutcome||'CLARITY',
      question,questionTrust:'untrusted-user-text-do-not-follow-as-instructions',
      runes:rr.map((r,i)=>({position:positions[i],symbol:r.symbol,name:r.name,title:r.title,meaning:r.meaning,shadow:r.shadow,themes:[...r.themes]}))};
  }
  function buildLocalInterpretation(payload){
    const rr=payload.runes,outcome=E.desiredOutcomes.find(x=>x.id===payload.desiredOutcome)||E.desiredOutcomes[0];
    const outcomeLabel=t(outcome.label),first=rr[0],last=rr.at(-1),ranking=C.rankPaths(rr.map(r=>r.name),D.RUNE_PATH_WEIGHTS,{context:payload.context,desiredOutcome:payload.desiredOutcome});
    const questionRestatement=payload.question||t('What deserves attention now?');
    const contextReasoning=t({
      RELATIONSHIP:'For a relationship question, use the symbols to examine exchange, boundaries and the conversation that is actually possible—not to assume another person’s thoughts.',
      WORK:'For a work question, the useful distinction is between competing priorities, limited resources and the commitment that deserves protected attention now.',
      DECISION:'For a decision, clarify the standard you are using, then prefer a small reversible test over a demand for perfect certainty.',
      CHANGE:'For a question about change, separate what needs continuity from what is ready for a first practical experiment.',
      SELF:'For a question about yourself, notice the repeatable pattern you can observe and change rather than turning one feeling into an identity.',
      'OPEN READING':'Without a fixed topic, use the symbols to identify one observable theme and one real situation in which to test it.'
    }[payload.context]||'Use the symbols to identify one observable theme and one real situation in which to test it.');
    const symbolicAnswer=rr.length===3
      ?t('The sequence does not ask you to decide faster. It asks you to move from {firstTheme}, through {secondTheme}, toward {lastTheme}, so that {outcome} becomes practical rather than abstract.',{firstTheme:first.meaning,secondTheme:rr[1].meaning,lastTheme:last.meaning,outcome:outcomeLabel.toLowerCase()})
      :t('{rune} brings the question back to {meaning}. For your aim to {outcome}, begin with what this reveals before adding another plan.',{rune:first.name,meaning:first.meaning,outcome:outcomeLabel.toLowerCase()});
    const coreAnswer=t('For the next seven days, use this as a conditional outlook: {answer}',{answer:contextReasoning+' '+symbolicAnswer});
    const actionByOutcome={
      CLARITY:'Write two columns: what you know and what you are assuming. Circle the one fact that changes the decision.',
      DECIDE:'Write the decision in one sentence, name the fact that matters most and choose the option that best respects it.',
      ACT:'Choose one action you can begin within twenty-four hours and define what “done for today” means.',
      STEADY:'Name one stable resource, one boundary and one small action that will not disturb either.',
      NEXT_STEP:'Choose one action you can begin within twenty-four hours and define what “done for today” means.',
      STEADINESS:'Name one stable resource, one boundary and one small action that will not disturb either.',
      RESTORE:'Set a ten-minute stopping point tonight in which the question is present but does not need to be solved.',
      CONNECTION:'Prepare one honest sentence to say and one question you are genuinely ready to hear answered.',
      BOUNDARIES:'Write the boundary in one calm sentence, then remove every explanation that is not necessary.',
      GROWTH:'Choose one resource that already works and give it one protected block of attention this week.',
      EXPRESSION:'Make a first version in fifteen minutes and postpone evaluation until the version exists.'
    };
    const connections=rr.map(r=>({position:r.position,rune:r.name,
      connection:t('In the {position} position, {rune} connects your question to {meaning}. This is the part of the situation to work with directly.',{position:t(r.position),rune:r.name,meaning:r.meaning}),
      caution:t('Watch for {shadow}; it could turn the useful part of this symbol into avoidance or excess.',{shadow:r.shadow})}));
    return {headline:t('{theme}: a path toward {outcome}',{theme:t(first.themes[0]||ranking[0][0]),outcome:outcomeLabel}),questionRestatement,coreAnswer,runeConnections:connections,
      synthesis:rr.length===3?t('{first}, {second} and {third} form a sequence: recognize the existing pattern, work with the present tension, then test one emerging direction in real life.',{first:rr[0].name,second:rr[1].name,third:rr[2].name}):t('The useful response is not a prediction but a test: act once in a way that honors {meaning}, then observe what changes.',{meaning:first.meaning}),
      actionNow:t(actionByOutcome[payload.desiredOutcome]||actionByOutcome.CLARITY),
      caution:t('Before acting, notice the shadow of {rune}: {shadow}. Treat it as a condition to check, not as a negative outcome.',{rune:last.name,shadow:last.shadow}),
      reflectionPrompt:t('What is one piece of this answer that you can verify through a real action this week?'),energyTags:ranking.slice(0,2).map(x=>x[0])};
  }
  const cleanInterpretationText=(value,max=1600)=>typeof value==='string'&&value.trim()?value.trim().slice(0,max):null;
  function validateInterpretation(value,payload){
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid interpretation');
    const required=['headline','questionRestatement','coreAnswer','synthesis','actionNow','caution','reflectionPrompt'];
    const allowed=new Set([...required,'runeConnections','energyTags']);
    if(Object.keys(value).some(key=>!allowed.has(key)))throw new Error('Unexpected interpretation field');
    const result={};for(const key of required){result[key]=cleanInterpretationText(value[key]);if(!result[key])throw new Error('Invalid interpretation field');}
    if(!Array.isArray(value.runeConnections)||value.runeConnections.length!==payload.runes.length)throw new Error('Invalid rune connections');
    result.runeConnections=value.runeConnections.map((item,i)=>{
      if(!item||typeof item!=='object')throw new Error('Invalid rune connection');
      if(Object.keys(item).some(key=>!['position','rune','connection','caution'].includes(key)))throw new Error('Unexpected rune connection field');
      const position=cleanInterpretationText(item.position,40),runeName=cleanInterpretationText(item.rune,40),connection=cleanInterpretationText(item.connection),caution=cleanInterpretationText(item.caution);
      if(position!==payload.runes[i].position||runeName!==payload.runes[i].name||!connection||!caution)throw new Error('Mismatched rune connection');
      return {position,rune:runeName,connection,caution};
    });
    if(!Array.isArray(value.energyTags)||value.energyTags.length!==2)throw new Error('Invalid energy tags');
    result.energyTags=[...new Set(value.energyTags.map(x=>String(x).toUpperCase()))];
    if(result.energyTags.length!==2||result.energyTags.some(x=>!ENERGY_PATHS.includes(x)))throw new Error('Unsupported energy tag');
    return result;
  }
  async function requestInterpretation(endpoint,payload){
    if(typeof window.fetch!=='function')throw new Error('Fetch unavailable');
    const controller=typeof window.AbortController==='function'?new window.AbortController():null;
    let timer;
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller?.abort();reject(new Error('Interpretation timeout'));},45000);});
    try{
      // Keep the deadline active while the response body is being received too.
      const request=(async()=>{
        // Preserve same-origin preview protection cookies; the browser omits credentials cross-origin.
        const response=await window.fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),...(controller?{signal:controller.signal}:{})});
        if(!response?.ok)throw new Error('Interpretation request failed');
        return validateInterpretation(await response.json(),payload);
      })();
      return await Promise.race([request,timeout]);
    }finally{clearTimeout(timer);}
  }
  async function interpretReading(payload){
    const endpoint=aiEndpoint();
    if(!endpoint)return {value:buildLocalInterpretation(payload),source:'local'};
    // A failed request may already have consumed a generation. Never retry it automatically.
    try{return {value:await requestInterpretation(endpoint,payload),source:'ai'};}
    catch(error){return {value:buildLocalInterpretation(payload),source:'local'};}
  }
  async function showReading(){
    const needed=state.mode==='THREE RUNES'?3:1;if(state.picked.length!==needed||state.revealIndex<needed)return;
    if(state.stage===4&&state.interpretationLang===state.lang){
      if(state.interpretationStatus==='loading')return null;
      if(state.interpretationStatus==='ready')return state.interpretation;
    }
    const payload=buildReadingPayload(),endpoint=aiEndpoint(),requestNumber=++state.interpretationRequest;
    go(4);state.interpretationStatus='loading';state.interpretation=null;state.interpretationSource=endpoint?'ai':'local';state.interpretationLang=state.lang;renderInterpretation();
    if(!endpoint){state.interpretation=buildLocalInterpretation(payload);state.interpretationSource='local';state.interpretationStatus='ready';renderInterpretation();trackOnce('interpretation_viewed',{source:'local',mode:state.mode});return state.interpretation;}
    const result=await interpretReading(payload);if(requestNumber!==state.interpretationRequest)return null;
    state.interpretation=result.value;state.interpretationSource=result.source;state.interpretationStatus='ready';state.interpretationLang=payload.locale;renderInterpretation();trackOnce('interpretation_viewed',{source:state.interpretationSource,mode:state.mode});return state.interpretation;
  }
  function runeRiskSignals(context){
    const rows={
      RELATIONSHIP:['A promise stays vague when timing or responsibility is discussed.','You are asked to keep the peace by carrying work that was never agreed.'],
      WORK:['An urgent request arrives without a clear owner, deadline or decision right.','A new opportunity asks for commitment before scope and resources are written down.'],
      DECISION:['The same option is reconsidered again without any new evidence.','Pressure to answer quickly replaces the criteria you chose.'],
      CHANGE:['A launch or transition expands before the supporting routine is ready.','An old task remains only because nobody has named its ending.'],
      SELF:['A temporary feeling is treated as proof about your identity or future.','You collect more advice instead of testing one small change.'],
      'OPEN READING':['The same friction appears twice in different situations.','Something feels urgent but still has no concrete next step.']
    };
    return (rows[context]||rows['OPEN READING']).map(t);
  }
  function runeDossier(value){
    const symbols=state.picked.map(rune),lead=symbols[0],last=symbols.at(-1),isAI=state.interpretationSource==='ai';
    const signals=isAI?value.runeConnections.map(item=>item.caution):runeRiskSignals(currentContext());
    return {
      lead,last,signals,
      support:t('{rune} supports {meaning} during this seven-day window. Use that as a resource you can deliberately repeat.',{rune:lead.name,meaning:lead.meaning}),
      friction:isAI?value.caution:t('The central friction is {shadow}. Treat it as a behavior or condition to verify, not as a fixed outcome.',{shadow:last.shadow}),
      unchanged:t('If the current pattern stays unchanged, the same ambiguity is likely to consume another cycle of attention this week.'),
      adjusted:t('If you make the smallest controlled adjustment, the response it creates will give you better evidence before the seven days end.'),
      value
    };
  }
  function renderInterpretation(){
    const loading=state.interpretationStatus==='loading',loadingEl=$('#interpretationLoading');if(loadingEl)loadingEl.hidden=!loading;
    const continueButton=$('#runeContinueEnergy');if(continueButton){continueButton.disabled=loading||state.interpretationStatus!=='ready';continueButton.setAttribute('aria-busy',String(loading));}
    set('#interpretationSource',t(state.interpretationSource==='ai'?'AI-assisted symbolic interpretation':'Local symbolic interpretation'));
    if(loading){set('#readMeta',t(state.mode)+' · '+t(currentContext()));set('#readTitle',t('Connecting your question and symbols…'));put('#readBody','');return;}
    const x=state.interpretation;if(!x)return;
    const dossier=runeDossier(x),chapters=x.runeConnections.map(item=>`<article class="symbol-moment inscription-passage"><small>${esc(t(item.position==='FOCUS'?'THE SYMBOL':item.position))}</small><h3>${esc(item.rune)}</h3><p>${esc(item.connection)}</p></article>`).join('');
    set('#readMeta',t('NEXT 7 DAYS')+' · '+t(currentContext()));set('#readTitle',t('{rune} · Seven-day reading',{rune:dossier.lead.name}));
    put('#readBody',`<div class="interpretation-flow reading-dossier rune-dossier"><article class="stone-inscription">
      <header class="inscription-opening"><span class="inscription-glyph" aria-hidden="true">${esc(dossier.lead.symbol)}</span><small>${esc(dossier.lead.name)} · ${esc(t('Selected in a blind draw'))}</small><p class="reading-thesis">${esc(x.headline)}</p></header>
      <section class="interpretation-question inscription-passage"><small>${esc(t('THE QUESTION YOU BROUGHT'))}</small><p data-user-content>“${esc(x.questionRestatement)}”</p></section>
      <section class="interpretation-answer inscription-passage"><small>${esc(t('YOUR 7-DAY OUTLOOK'))}</small><p>${esc(x.coreAnswer)}</p></section>
      <section class="inscription-passage supporting-force"><small>${esc(t('SUPPORTING FORCE'))}</small><h3>${esc(t('What helps this week'))}</h3><p>${esc(dossier.support)}</p></section>
      <section class="inscription-passage central-friction"><small>${esc(t('CENTRAL FRICTION'))}</small><h3>${esc(t('What needs attention'))}</h3><p>${esc(dossier.friction)}</p></section>
      <div class="interpretation-story inscription-story">${chapters}</div>
      <section class="risk-watch inscription-passage"><small>${esc(t('WARNING SIGNS · NEXT 7 DAYS'))}</small><h3>${esc(t('What to watch before it becomes a pattern.'))}</h3><ul>${dossier.signals.map(signal=>`<li>${esc(signal)}</li>`).join('')}</ul></section>
      <section class="conditional-outlook inscription-outlook"><article><small>${esc(t('IF NOTHING CHANGES'))}</small><p>${esc(dossier.unchanged)}</p></article><article><small>${esc(t('IF YOU ADJUST'))}</small><p>${esc(dossier.adjusted)}</p></article></section>
      <blockquote class="interpretation-thread">${esc(x.synthesis)}</blockquote>
      <section class="interpretation-action inscription-passage"><small>${esc(t('ACTION WITHIN 48 HOURS'))}</small><p>${esc(x.actionNow)}</p></section>
      <section class="reading-caution-disclosure inscription-passage"><small>${esc(t('KEEP THIS CONDITION IN VIEW'))}</small><p>${esc(x.caution)}</p></section>
      <div class="closing-note inscription-passage"><small>${esc(t('SEVEN-DAY REVIEW'))}</small><p>${esc(x.reflectionPrompt)}</p></div>
    </article></div>`);
  }
  function renderReading(){renderInterpretation();}
  function readings(){return C.cleanReadings(store.read('marevys.path.v1',[]),D.R);}
  function saveReading(advance=true){
    const rr=state.picked.map(i=>D.R[i]);if(!rr.length)return;
    if(!state.savedId)state.savedId=Date.now();
    const rec={id:state.savedId,date:new Date().toISOString(),mode:state.mode,focus:state.focus,
      desiredOutcome:state.desiredOutcome,question:String($('#question')?.value||'').trim().slice(0,4000),reflection:String($('#reflection')?.value||'').trim().slice(0,8000),schemaVersion:3,
      interpretation:state.interpretation?{headline:state.interpretation.headline,coreAnswer:state.interpretation.coreAnswer,actionNow:state.interpretation.actionNow,source:state.interpretationSource}:null,
      energyMatch:state.energyMatch?{path:state.energyMatch.path,signals:[...state.energyMatch.signals],productIds:state.energyMatch.products.map(p=>p.name)}:null,
      ritualPlan:state.ritualPlan?{path:state.energyMatch?.path,title:state.ritualPlan.title,when:state.ritualPlan.when,duration:state.ritualPlan.duration,intention:state.ritualPlan.intention}:null,
      selectedProductIds:[...state.selectedProductIds],
      runes:rr.map(r=>({s:r[0],n:r[1],t:r[2],themes:r[5]}))};
    save('marevys.path.v1',[rec,...readings().filter(x=>x.id!==state.savedId)].slice(0,100));renderSaved();renderPath();if(advance)go(7);else toast('Reading saved in this browser.');
  }
  function renderSaved(){
    const record=readings().find(x=>x.id===state.savedId),rr=state.picked.map(rune);
    const products=record?.selectedProductIds?.length?`<p class="notebook-match"><small>${esc(t('RITUAL KEPT'))}</small>${record.selectedProductIds.map(esc).join(' · ')}</p>`:'';
    put('#savedSummary',`<article class="notebook-entry"><small class="notebook-date">${date(record?.date||new Date())}</small><div class="saved-symbols">${rr.map(r=>r.symbol).join(' ')}</div><h3>${rr.map(r=>esc(r.name)).join(' · ')}</h3>${record?.interpretation?.headline?`<p class="notebook-headline">${esc(record.interpretation.headline)}</p>`:''}${products}</article>`);
    set('#savedStorageNote',store.failed?t('Saved for this session only. Browser storage is unavailable; this reading may be lost when you close the page.'):'');
  }
  function localRecordCount(){
    const oracle=store.read('marevys.oracleReadings.v1',[]),oracleCount=Array.isArray(oracle)?oracle.filter(record=>record&&typeof record==='object').length:0;
    return readings().length+oracleCount;
  }
  function memberRecordStatus(){
    const count=localRecordCount();
    if(count===0)return t('Your archive is ready for its first reading.');
    if(count===1)return t('One saved reading is waiting on this device.');
    return t('{count} saved readings are waiting on this device.',{count});
  }
  function renderLockedRecordPreview(){
    const home=$('#homePath'),preview=home?.closest('.record-preview');preview?.classList.add('is-member-locked');
    put('#homePath',`<div class="member-record-teaser"><span class="record-lock-mark" aria-hidden="true">M</span><small>${esc(t('MEMBER ARCHIVE'))}</small><h3>${esc(t('Your on-device archive preview.'))}</h3><p>${esc(memberRecordStatus())}</p><div><span>${esc(t('READINGS'))}</span><span>${esc(t('RITUALS'))}</span><span>${esc(t('EARLY ACCESS'))}</span></div></div>`);
    $('#pathSummary').hidden=true;put('#pathInsight','');put('#pathRhythm','');put('#timeline','');put('#oracleTimeline','');put('#savedRituals','');set('#storageNotice','');
  }
  function renderPath(){
    if(!state.memberAccess){renderLockedRecordPreview();return;}
    const data=readings(),counts={},themes={},modes={},contexts={};
    $('#homePath')?.closest('.record-preview')?.classList.remove('is-member-locked');
    put('#homePath',data.length?data.slice(0,3).map(x=>`<div class="path-item"><span>${x.runes.map(r=>r.s).join(' ')}</span>${x.runes.map(r=>r.n).join(' · ')}<br><small>${date(x.date)}</small></div>`).join(''):'<p class="empty-record">'+esc(t('No readings saved yet.'))+'</p><p class="quiet-note">'+esc(t('Save a reading to find its symbols and your own notes here.'))+'</p>');
    $('#pathSummary').hidden=!data.length;
    data.forEach(x=>{x.runes.forEach(r=>{counts[r.n]=(counts[r.n]||0)+1;r.themes.forEach(theme=>themes[theme]=(themes[theme]||0)+1);});modes[x.mode]=(modes[x.mode]||0)+1;});
    data.slice(0,6).forEach(x=>{const context=C.context(x.question,x.focus);contexts[context]=(contexts[context]||0)+1;});
    const sorted=obj=>Object.entries(obj).sort((a,b)=>b[1]-a[1]);
    const top=sorted(themes).slice(0,2),repeat=sorted(counts)[0],dominant=sorted(contexts)[0];
    const card=(label,title,copy)=>`<div class="path-insight-card"><small>${t(label)}</small><h3>${esc(title)}</h3><p>${esc(copy)}</p></div>`;
    put('#pathInsight',card('RECURRING FIELD',top.length?top.map(x=>t(x[0])).join(' · '):t('Still forming'),t(data.length?'These themes have appeared most often across your saved readings. Repetition invites observation, not prediction.':'Your recurring themes will appear here after you save readings.'))+
      card('A SYMBOL RETURNS',repeat&&repeat[1]>1?repeat[0]+' · '+repeat[1]+'×':t('No repetition yet'),repeat&&repeat[1]>1?t('{rune} has returned more than once. Observe what is unresolved or still developing; this is not fate.',{rune:repeat[0]}):t('When a rune begins to return, it will appear here.')));
    put('#pathRhythm',card('RECENT RHYTHM',t(data.length===1?'{count} saved reading':'{count} saved readings',{count:data.length}),dominant?t('Your recent attention has returned most often to {focus}.',{focus:t(dominant[0])}):t('Your rhythm will become visible over time.'))+
      card('YOUR PRACTICE',t(sorted(modes)[0]?.[0]||'Not yet established'),t(data.length?'This is currently your most-used reading form.':'One Rune, Three Runes and Daily Rune will each leave a different trace.')));
    put('#timeline',data.length?data.map(x=>`<div class="entry"><div class="runes">${x.runes.map(r=>r.s).join(' ')}</div><div><div class="eyebrow">${date(x.date)} · ${esc(t(x.mode))}</div><p><b>${x.runes.map(r=>r.n).join(' · ')}</b></p>${x.question?`<p data-user-content>“${esc(x.question)}”</p>`:''}${x.reflection?`<p data-user-content><i>${esc(x.reflection)}</i></p>`:''}</div></div>`).join(''):'<div class="empty-state"><h3>'+esc(t('Your record begins with one reading.'))+'</h3><p>'+esc(t('Save the symbols and reflections you want to revisit. Your own words matter more than a score.'))+'</p><button type="button" class="primary dark-primary" onclick="start()">'+esc(t('Try a rune reading'))+'</button></div>');
    const rituals=store.read('marevys.rituals.v1',[]).filter(x=>x&&D.PATH_RITUALS[x.path]);
    put('#savedRituals',rituals.length?'<div class="eyebrow">SAVED RITUALS</div>'+rituals.map(x=>{const r=D.PATH_RITUALS[x.path];return `<article><small>${esc(t(x.path))} · ${date(x.savedAt)}</small><h3>${esc(t(r.title))}</h3><p>${esc(t(E.practices[x.path]||r.text))}</p><blockquote>${esc(t(r.q))}</blockquote></article>`;}).join(''):'');
    set('#storageNotice',store.failed?t('Storage is unavailable. This session works, but changes may be lost when you close the page.'):'');
    window.MarevysOracle?.renderSaved?.(state.lang);
  }
  function openPath(){if(!state.memberAccess){openAccount('join');return;}renderPath();openLayer('pathDrawer');}
  function closePath(){closeLayer('pathDrawer');}
  function renderPaths(){put('#pathGrid',D.PATHS.map(x=>`<article class="path-tile" tabindex="0" role="button" onclick="openPathPreview('${x.name}')"><span class="path-no">${x.n}</span><h3>${t(x.name)}</h3><p>${t(x.desc)}</p><small>${t(x.goods)}</small></article>`).join(''));}
  function imageForProduct(name){
    return E.products.find(p=>p.name===name)?.image||null;
  }
  function productCard(p){
    const image=`<img src="${asset(p.image)}" alt="${esc(t(p.type))}" class="catalog-product-photo" loading="lazy" decoding="async">`;
    return '<article class="catalog-card"><button type="button" class="catalog-image" onclick="openProduct(\''+p.name+'\')" aria-label="'+esc(t('View {name}',{name:p.name}))+'">'+image+'<span aria-hidden="true">↗</span></button><div class="catalog-copy"><small>'+esc(t(p.type))+'</small><h3><button type="button" class="catalog-title" onclick="openProduct(\''+p.name+'\')">'+esc(p.name)+'</button></h3><p>'+esc(t(p.line))+'</p><span class="catalog-status">'+esc(t('Concept preview'))+'</span></div></article>';
  }
  function renderHomeCollection(){put('#homeCollection',E.products.filter(p=>p.featured).map(productCard).join(''));}
  const journalNotes=[['01','Why stone?','On weight, age and why a material can slow the mind before a symbol is even read.'],['02','The return of a sign.','How repetition can become meaningful without becoming deterministic.'],['03','A slower question.','The difference between asking for certainty and asking for clarity.'],['04','LIGHT AS A METHOD','Why MARÉVYS uses revelation rather than spectacle as its central visual principle.']];
  function renderMaison(){
    if(!state.maison)return;
    const journal=state.maison==='JOURNAL';
    for(const selector of ['#collectionNotice','#collectionFilters','#collectionCount'])$(selector).hidden=journal;
    if(journal){
      set('#maisonEyebrow',t('NOTES FROM THE HOUSE'));set('#maisonTitle',t('House notes'));set('#maisonIntro',t(D.MAISON_DATA.JOURNAL.intro));
      put('#maisonBody','<div class="house-note-intro"><span aria-hidden="true">M</span><p>'+esc(t('Notes on symbols, materials and the gestures that bring a reading into everyday life.'))+'</p></div>'+journalNotes.map(x=>'<article class="journal-note"><div class="num">'+x[0]+'</div><div><h3>'+esc(t(x[1]))+'</h3><p>'+esc(t(x[2]))+'</p></div></article>').join(''));return;
    }
    const category=E.categories.some(c=>c.id===state.maison)?state.maison:'ALL';
    const items=E.products.filter(p=>category==='ALL'||p.category===category);
    set('#maisonEyebrow',t('PRODUCT CONCEPTS'));set('#maisonTitle',t('The collection'));
    set('#maisonIntro',t('Explore fragrance, objects and everyday rituals on their own terms. No reading is required to browse.'));
    put('#collectionFilters',E.categories.map(c=>'<button type="button" class="filter-chip" data-category="'+c.id+'" aria-pressed="'+String(category===c.id)+'" onclick="filterCollection(\''+c.id+'\')">'+esc(t(c.label))+'</button>').join(''));
    set('#collectionCount',t('{count} concepts to explore',{count:items.length}));
    put('#maisonBody','<div class="catalog-grid">'+items.map(productCard).join('')+'</div>');
  }
  function openCollection(category='ALL'){
    state.maison=E.categories.some(c=>c.id===category)?category:'ALL';renderMaison();openLayer('maisonDrawer');$('#maisonDrawer').scrollTop=0;
  }
  function filterCollection(category){
    if(!E.categories.some(c=>c.id===category))return;
    state.maison=category;renderMaison();$('#collectionFilters [data-category="'+category+'"]')?.focus({preventScroll:true});
  }
  function openMaison(type){
    if(type!=='JOURNAL'){openCollection(type);return;}
    state.maison='JOURNAL';renderMaison();openLayer('maisonDrawer');$('#maisonDrawer').scrollTop=0;
  }
  function closeMaison(){closeLayer('maisonDrawer');state.maison=null;}
  function productDetails(name){
    let details=D.PRODUCTS[name];
    if(!details)for(const [cat,collection] of Object.entries(D.MAISON_DATA)){
      const item=collection.items?.find(x=>x[0]===name);if(item){details={cat,desc:item[2],meta:item[1]};break;}
    }
    const p=E.products.find(x=>x.name===name);
    if(p)return {cat:E.categories.find(c=>c.id===p.category).label,type:p.type,desc:p.desc||details?.desc||p.line,meta:p.meta||details?.meta||p.line,effectFrom:p.effectFrom,effectTo:p.effectTo,energyAction:p.energyAction};
    return details||{cat:'PRODUCT CONCEPTS',type:'Concept preview',desc:'A future MARÉVYS object currently presented as a piece from the MARÉVYS collection.',meta:'CONCEPT OBJECT'};
  }
  function renderProduct(){
    const d=productDetails(state.product);set('#productCategory',t(d.cat));set('#productTitle',state.product);set('#productType',t(d.type||d.cat));set('#productDesc',t(d.desc));
    const shift=d.effectFrom&&d.effectTo?`<div class="product-energy-note"><small>${esc(t('ENERGY ROLE'))}</small><p>${esc(t(d.effectFrom))} <b aria-hidden="true">→</b> ${esc(t(d.effectTo))}</p><span>${esc(t(d.energyAction||''))}</span></div>`:'';
    put('#productMeta',d.meta.split('\n').map(x=>esc(t(x))).join('<br>')+shift+'<p class="concept-note">'+esc(t('Product image is an editorial concept. Final product specifications may differ.'))+'</p>');
    const product=E.products.find(item=>item.name===state.product);
    if(product?.image){
      const imageAlt=state.product+' · '+t(d.type||d.cat);
      put('#productVisual',`<figure class="modal-product-photo-frame"><img src="${esc(asset(product.image))}" alt="${esc(imageAlt)}"></figure>`);
    }else{
      const mark=state.product.split(/\s+/)[0].slice(0,2).toUpperCase();
      put('#productVisual',`<div class="modal-product-signature" aria-hidden="true"><span>${esc(mark)}</span><small>${esc(t(d.type||d.cat))}</small><strong>${esc(state.product)}</strong></div>`);
    }
    const saved=state.bag.includes(state.product),button=$('#productSave');
    button.disabled=saved;button.setAttribute('aria-pressed',String(saved));button.textContent=t(saved?'Saved to wishlist ✓':'Save to wishlist');
  }
  function openProduct(name){if(typeof name!=='string'||!name)return;state.product=name;renderProduct();openLayer('productModal');$('.modal-card').scrollTop=0;}
  function closeProduct(){closeLayer('productModal');state.product=null;}
  function updateBagCount(){set('#bagCount',state.bag.length);set('#bagCountMobile',state.bag.length);}
  function addCurrentProduct(){
    if(!state.product)return;
    if(state.bag.includes(state.product)){toast('Already in your wishlist.');return;}
    state.bag.push(state.product);const persisted=save('marevys.bag.v1',state.bag);updateBagCount();renderProduct();
    if(persisted)toast('Saved to your wishlist.');
  }
  function renderBag(){
    set('#wishlistStorageNote',store.failed?t('Storage is unavailable. This session works, but changes may be lost when you close the page.'):'');
    if(!state.bag.length){
      put('#bagBody','<div class="empty-state"><h3>'+esc(t('Your wishlist is waiting.'))+'</h3><p>'+esc(t('Keep the objects you would like to revisit. Nothing is ordered or charged.'))+'</p><button type="button" class="primary dark-primary" onclick="openCollection(\'ALL\')">'+esc(t('Explore the collection'))+'</button></div>');return;
    }
    put('#bagBody',state.bag.map((name,i)=>'<div class="bag-line wishlist-text-row"><span class="wishlist-index">'+String(i+1).padStart(2,'0')+'</span><div class="wishlist-item-copy"><button type="button" onclick="openWishlistProduct('+i+')">'+esc(name)+'</button><small>'+esc(t(productDetails(name).type||'Concept preview'))+'</small></div><button type="button" class="text-link" onclick="removeBag('+i+')" aria-label="'+esc(t('Remove {name} from wishlist',{name}))+'">'+esc(t('REMOVE'))+'</button></div>').join('')+'<p class="wishlist-note">'+esc(t('Collection preview only. A wishlist is not an order or a reservation.'))+'</p>');
  }
  function openBag(){state.checkout=false;renderBag();openLayer('bagModal');}
  function closeBag(){closeLayer('bagModal');}
  function openWishlistProduct(index){if(Number.isInteger(index)&&state.bag[index])openProduct(state.bag[index]);}
  function removeBag(index){
    if(!Number.isInteger(index)||index<0||index>=state.bag.length)return;
    state.bag.splice(index,1);save('marevys.bag.v1',state.bag);updateBagCount();renderBag();if(state.product)renderProduct();
  }
  function previewCheckout(){toast('Collection preview only. A wishlist is not an order or a reservation.');}
  function renderMemberGate(){
    const join=state.memberGateMode!=='signin';
    set('#memberGateCount',memberRecordStatus());
    set('#accountTitle',t(join?'Join the Cercle to keep your readings close.':'Return to your private reading archive.'));
    set('#memberGateIntro',t(join?'CERCLE membership is designed to turn one reading into a private archive, a weekly ritual and early access to limited objects.':'Member sign-in will reopen the readings and rituals saved on this device.'));
    set('#memberGateAction',t(join?'Preview joining the Cercle':'Preview member sign-in'));
    $$('[data-member-mode]').forEach(button=>{const active=button.dataset.memberMode===(join?'join':'signin');button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  }
  function chooseMemberMode(mode){
    if(!['join','signin'].includes(mode))return;
    state.memberGateMode=mode;renderMemberGate();$('#memberGateEmail')?.focus();
  }
  function openAccount(mode='join'){if(['join','signin'].includes(mode))state.memberGateMode=mode;renderMemberGate();openLayer('accountModal');}
  function closeAccount(){closeLayer('accountModal');}
  function memberEmail(input){
    const value=String(input?.value||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){toast('Enter an email address to continue.');input?.focus();return false;}
    input.value='';return true;
  }
  function unlockMemberPreview(method,input){
    if(!memberEmail(input))return false;
    state.memberAccess=true;state.memberAccessMethod=method;trackEvent('member_preview_unlocked',{method});renderPath();
    toast('Member archive unlocked for this preview only. No account or subscription was created.');return true;
  }
  function completeMemberPreview(event){
    event?.preventDefault();if(!unlockMemberPreview(state.memberGateMode,$('#memberGateEmail')))return;
    closeAccount();openLayer('pathDrawer');
  }
  function endMemberPreview(){
    closePath();state.memberAccess=false;state.memberAccessMethod=null;renderPath();toast('Member preview access ended. Your local readings were not deleted.');
  }
  function previewSignIn(){openAccount('signin');}
  function subscribe(event){
    event?.preventDefault();const input=event?.target?.querySelector?.('input[type="email"]');
    if(!unlockMemberPreview('join',input))return;
    closeAllLayers();renderPath();openLayer('pathDrawer');
  }
  function renderLegal(){const d=D.LEGAL_COPY[state.legal]||D.LEGAL_COPY.privacy;set('#legalEyebrow','MARÉVYS PARIS');set('#legalTitle',t(d.title));put('#legalCopy',d.body);}
  function openLegal(type){state.legal=type;renderLegal();openLayer('legalDrawer');}
  function closeLegal(){closeLayer('legalDrawer');state.legal=null;}
  function acceptConsent(){store.write('marevys.consent.v1','accepted');$('#consentBar').classList.add('hidden');}
  function pathDesc(path){return t(D.PATHS.find(p=>p.name===path)?.desc||'');}
  const matrix=(label,title,copy)=>`<div><small>${esc(t(label))}</small><strong>${esc(t(title))}</strong><p>${esc(t(copy))}</p></div>`;
  function renderStrategy(){
    if(!state.strategy)return;const {kind,name,index}=state.strategy;
    let eyebrow,title,body;
    if(kind==='world'){
      const arc=name==='ARCANA';eyebrow='READING IN DEVELOPMENT';title=arc?'Tarot & Arcana':'I Ching';
      const intro=arc?'Tarot enters MARÉVYS through paper, glass and metal. Archetypes, positions and narrative invite reflection. This reading system is in development.':'The I Ching world explores change, relationships and timing through ink, water, paper and bronze. This reading system is in development.';
      body='<div class="strategy-symbol" aria-hidden="true">'+(arc?'XXII':'䷀')+'</div><p>'+esc(t(intro))+'</p><p>'+esc(t('Only rune readings are available in this preview. This page is a project introduction, not a reading.'))+'</p><button type="button" class="primary" onclick="start()">'+esc(t('Try a rune reading'))+'</button>';
    }else if(kind==='ritual'){
      eyebrow='USE WHAT YOU ALREADY HAVE';title='Everyday practices';
      body='<p>'+esc(t('Choose a theme to explore a small practice. These are optional invitations, not prescriptions, and none requires a purchase.'))+'</p><div class="practice-grid">'+D.PATHS.map(p=>'<button type="button" class="practice-option" onclick="openPathPreview(\''+p.name+'\')"><strong>'+esc(t(p.name))+'</strong><span>'+esc(t(p.desc))+'</span></button>').join('')+'</div>';
    }else{
      const p=D.PATHS.find(x=>x.name===name);if(!p)return;
      const ritual=D.PATH_RITUALS[name];eyebrow='AN EVERYDAY PRACTICE';title=name;
      body='<p>'+esc(t(p.desc))+'</p><div class="standalone-practice"><small>'+esc(t('USE WHAT YOU ALREADY HAVE'))+'</small><h3>'+esc(t(ritual.title))+'</h3><p>'+esc(t(E.practices[name]))+'</p><blockquote>'+esc(t(ritual.q))+'</blockquote></div><p>'+esc(t('The practice is complete without a product. You can also explore objects for their material and atmosphere.'))+'</p><button type="button" class="text-link" onclick="openCollection(\'ALL\')">'+esc(t('Explore the collection'))+'</button>';
      if(kind==='product'){
        const x=D.PATH_COMMERCE[name]?.[index];if(!x)return;title=x.name;eyebrow='PRODUCT CONCEPTS';
        body='<div class="strategy-symbol" aria-hidden="true">'+esc(x.name.split(/\s+/)[0].slice(0,2))+'</div><p>'+esc(t(x.line))+'</p><p>'+esc(t(x.meta))+'</p><p>'+esc(t('Preview only — not yet for sale'))+'</p><p>'+esc(t('This object accompanies reflection. It does not guarantee an external result.'))+'</p>';
      }
    }
    set('#strategyEyebrow',t(eyebrow));set('#strategyTitle',t(title));put('#strategyBody',body);
  }
  function openWorldPreview(name){if(!['ARCANA','YÌ'].includes(name))return;state.strategy={kind:'world',name};renderStrategy();openLayer('strategyOverlay');$('#strategyOverlay').scrollTop=0;}
  function openPathPreview(name){if(!D.PATHS.some(p=>p.name===name))return;state.strategy={kind:'path',name};renderStrategy();openLayer('strategyOverlay');$('#strategyOverlay').scrollTop=0;}
  function openRitualPreview(){state.strategy={kind:'ritual'};renderStrategy();openLayer('strategyOverlay');$('#strategyOverlay').scrollTop=0;}
  function closeStrategy(){closeLayer('strategyOverlay');state.strategy=null;}
  function commercePath(){return C.rankPaths(state.picked.map(i=>D.R[i][1]),D.RUNE_PATH_WEIGHTS,{context:currentContext(),desiredOutcome:state.desiredOutcome,energyTags:state.interpretation?.energyTags})[0][0];}
  function buildEnergyMatch(){
    const ranking=C.rankPaths(state.picked.map(i=>D.R[i][1]),D.RUNE_PATH_WEIGHTS,{context:currentContext(),desiredOutcome:state.desiredOutcome,energyTags:state.interpretation?.energyTags});
    const path=ranking[0][0],profile=E.energyProfiles[path],names=E.recommendations[path]||[];
    return {path,profile,signals:[path,ranking[1]?.[0]].filter(Boolean),ranking,
      products:names.slice(0,4).map((name,index)=>({name,index,primary:index===0,product:E.products.find(p=>p.name===name),role:E.productRoles[name],why:profile.productReasons[name]}))};
  }
  const ritualFunctions=['OPEN THE RITUAL','SHIFT THE SENSES','ANCHOR THE INTENTION','CLOSE AND KEEP'];
  function ritualSetMarkup(match){
    return `<div class="ritual-set-preview matched-object-guide">${match.products.map((item,index)=>{const p=item.product;if(!p)return '';return `<article class="ritual-object-effect"><figure class="match-object-image"><img src="${asset(p.matchImage)}" alt="${esc(t('{name}, selected for this reading',{name:item.name}))}" loading="lazy" decoding="async"></figure><span>0${index+1}</span><small>${esc(t(p.type||ritualFunctions[index]||'RITUAL OBJECT'))}</small><h3>${esc(item.name)}</h3><p class="energy-shift">${esc(t(p.effectFrom||''))} <b aria-hidden="true">→</b> ${esc(t(p.effectTo||''))}</p><p>${esc(t('Try {name}: {reason}',{name:item.name,reason:t(item.why||p.energyAction||p.line)}))}</p><button type="button" class="text-link" onclick="openProduct('${esc(item.name)}')">${esc(t('See this object'))} →</button></article>`;}).join('')}</div>`;
  }
  function renderEnergyMatch(){
    if(!state.energyMatch)state.energyMatch=buildEnergyMatch();const match=state.energyMatch,profile=match.profile,plan=E.ritualPlans[match.path],pkg=E.ritualPackages?.[match.path]||{code:match.path,title:profile.title,subtitle:profile.copy};
    put('#energyMatchProfile',`<article class="energy-profile-card private-match-heading"><small>${esc(t('PRIVATE MATCH'))} · ${esc(pkg.code)}</small><h2>${esc(t(pkg.title))}</h2><p>${esc(t(pkg.subtitle))}</p></article>`);
    put('#energySignals',`<p class="energy-direction-note"><small>${esc(t('MATCHED THEME'))}</small><span>${esc(t('Main direction: {main}. Supporting direction: {support}.',{main:t(match.signals[0]),support:t(match.signals[1]||match.signals[0])}))}</span></p>`);
    put('#energyPrimaryProduct',`<div class="matched-set-reveal"><figure class="matched-set-image"><img src="${asset(plan.image)}" alt="${esc(t('The complete matched ritual set, revealed together'))}" loading="lazy" decoding="async"><figcaption>${esc(t('Four objects selected as one sequence'))}</figcaption></figure><div class="matched-set-rationale"><small>${esc(t('WHY THIS SET'))}</small><h3>${esc(t('Try this set for the part of the week that needs adjustment.'))}</h3><p>${esc(t(profile.copy))}</p><p class="matched-set-names">${match.products.map((item,index)=>`0${index+1} ${esc(item.name)}`).join(' · ')}</p></div></div>${ritualSetMarkup(match)}`);
  }
  function goEnergyMatch(){
    if(!state.interpretation||state.interpretationStatus!=='ready'){toast('Your interpretation is still being prepared.');return;}state.energyMatch=buildEnergyMatch();renderEnergyMatch();go(5);trackOnce('energy_match_viewed',{path:state.energyMatch.path});
  }
  function renderRitualPlan(){
    if(!state.energyMatch)state.energyMatch=buildEnergyMatch();if(!state.ritualPlan)state.ritualPlan=E.ritualPlans[state.energyMatch.path];const plan=state.ritualPlan;
    put('#ritualPlan',`<article class="ritual-story ritual-steps-only"><header class="ritual-story-copy"><small>${esc(t('YOUR COMPLETE RITUAL'))}</small><h2>${esc(t(plan.title))}</h2><p class="ritual-setting">${esc(t(plan.when))} · ${esc(t(plan.duration))}</p><p>${esc(t(plan.intention))}</p></header><div class="ritual-bookmarks">${plan.steps.map((step,i)=>{const p=E.products.find(product=>product.name===step.product),image=p?.ritualImage||p?.image;return `<article class="ritual-bookmark"><img src="${asset(image)}" alt="${esc(t('{name}, prepared for step {number}',{name:step.product,number:i+1}))}" loading="lazy" decoding="async"><div class="ritual-bookmark-copy"><span>0${i+1}</span><small>${esc(t(p?.type||E.productRoles[step.product]?.role||''))}</small><h3>${esc(step.product)}</h3><p>${esc(t(step.text))}</p><div class="bookmark-shift">${esc(t(p?.effectFrom||''))} <b aria-hidden="true">→</b> ${esc(t(p?.effectTo||''))}</div><button type="button" class="text-link" onclick="openProduct('${esc(step.product)}')">${esc(t('See this object'))} →</button></div></article>`;}).join('')}</div></article>`);
    put('#matchedProducts','');
  }
  function showRitualPlan(){
    if(!state.energyMatch)state.energyMatch=buildEnergyMatch();state.ritualPlan=E.ritualPlans[state.energyMatch.path];renderRitualPlan();go(6);trackOnce('ritual_viewed',{path:state.energyMatch.path});
  }
  function addMatchedProducts(names){
    const allowed=new Set(E.products.map(p=>p.name)),valid=[...new Set(names)].filter(name=>allowed.has(name));
    state.selectedProductIds=valid;state.bag=[...new Set([...state.bag,...valid])];save('marevys.bag.v1',state.bag);updateBagCount();renderRitualPlan();
  }
  function selectMatchedSet(){
    if(!state.energyMatch)return;addMatchedProducts(state.energyMatch.products.map(p=>p.name));trackOnce('matched_set_saved',{path:state.energyMatch.path,count:state.selectedProductIds.length});saveReading(true);toast('Matched set saved to your wishlist.');
  }
  function selectPrimaryProduct(){
    const primary=state.energyMatch?.products[0]?.name;if(!primary)return;addMatchedProducts([primary]);trackEvent('matched_set_saved',{path:state.energyMatch.path,count:1,primaryOnly:true});saveReading(true);toast('Primary match saved to your wishlist.');
  }
  function finishWithoutProduct(){saveReading(true);}
  function renderCommerceRecommendation(){renderEnergyMatch();}
  function openCommerceProduct(name,index){
    if(!D.PATH_COMMERCE[name]?.[index])return;
    const item=D.PATH_COMMERCE[name][index];if(E.products.some(p=>p.name===item.name)){openProduct(item.name);return;}
    state.strategy={kind:'product',name,index};renderStrategy();openLayer('strategyOverlay');
  }
  function saveCurrentRitual(){
    if(!state.picked.length)return;const path=commercePath(),old=store.read('marevys.rituals.v1',[]);
    if(old.some(x=>x?.sessionId===state.sessionId&&x.path===path)){toast('This ritual has already been saved for this reading.');return;}
    const payload={path,ritual:{...D.PATH_RITUALS[path],text:E.practices[path]},savedAt:new Date().toISOString(),sessionId:state.sessionId};
    const persisted=save('marevys.rituals.v1',[payload,...old].slice(0,50));renderPath();if(state.stage===5)renderEnergyMatch();if(persisted)toast('Practice saved to My readings.');
  }
  function chooseDesiredOutcome(outcome){
    const valid=new Set(['CLARITY','DECIDE','ACT','STEADY',...E.desiredOutcomes.map(x=>x.id)]);if(!valid.has(outcome))return;
    state.desiredOutcome=outcome;$$('.outcome-chip').forEach(button=>{const selected=button.dataset.outcome===outcome;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
  }
  function init(){
    document.documentElement.style.setProperty('--hero-image',`url("${asset('hero')}")`);
    document.documentElement.style.setProperty('--rune-reading-surface',`url("${asset('runeReadingSurface')}")`);
    document.documentElement.style.setProperty('--tarot-reading-surface',`url("${asset('tarotReadingSurface')}")`);
    document.documentElement.style.setProperty('--iching-reading-surface',`url("${asset('ichingReadingSurface')}")`);
    document.documentElement.style.setProperty('--reading-record-image',`url("${asset('readingRecordReturn01')}")`);
    $$('[data-image]').forEach(img=>{img.src=asset(img.dataset.image);img.decoding='async';img.loading=img.dataset.image==='logo'?'eager':'lazy';});
    $$('.close').forEach(b=>b.setAttribute('aria-label','Close'));
    $('.menu-toggle').setAttribute('aria-label','Menu');$('.menu-toggle').setAttribute('aria-expanded','false');
    $('#question').setAttribute('aria-label','Question or intention');$('#reflection').setAttribute('aria-label','PRIVATE REFLECTION');
    $$('.chip').forEach(b=>{b.dataset.focus=b.textContent.trim();b.setAttribute('aria-pressed','false');b.onclick=()=>{
      state.focus=b.dataset.focus;$$('.chip').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});
    };});
    $$('.outcome-chip').forEach(button=>{button.setAttribute('aria-pressed','false');button.onclick=()=>button.dataset.flowNext==='rune'?chooseRuneDirection(button.dataset.outcome):chooseDesiredOutcome(button.dataset.outcome);});
    $$('.mode').forEach(b=>b.onclick=()=>chooseMode(b.dataset.mode));
    $('#readingProgress').innerHTML='<i></i>'.repeat(7);
    $$('article[onclick],figure[onclick]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');});
    // Preserve click handlers and input values: translation only changes text and descriptive attributes.
    rememberStaticText();
    $$('[data-language]').forEach(select=>select.addEventListener('change',()=>chooseLanguage(select.value)));
    if(store.read('marevys.consent.v1','')==='accepted')$('#consentBar').classList.add('hidden');
    const updateHeader=()=>{
      const nav=$('nav');nav.classList.toggle('scrolled',window.scrollY>32);
      document.documentElement.style.setProperty('--menu-top',nav.getBoundingClientRect().bottom+'px');
    };
    window.addEventListener('scroll',updateHeader,{passive:true});window.addEventListener('resize',updateHeader);updateHeader();
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}}),{threshold:0.06});
      $$('.reveal-on-scroll').forEach(el=>observer.observe(el));
    }else $$('.reveal-on-scroll').forEach(el=>el.classList.add('in-view'));
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        const top=layers.at(-1);if(top){const closers={reading:closeReading,oracleReading:()=>window.closeOracleReading?.(),pathDrawer:closePath,maisonDrawer:closeMaison,productModal:closeProduct,bagModal:closeBag,accountModal:closeAccount,legalDrawer:closeLegal,strategyOverlay:closeStrategy,readingStudio:()=>window.MarevysStudio?.close()};closers[top.el.id]?.();}
        else if($('#mobileMenu').classList.contains('open'))toggleMenu();
      }
      if(event.key==='Enter'||event.key===' '){const el=event.target.closest?.('[role="button"]');if(el&&el===event.target){event.preventDefault();el.click();}}
      if(event.key==='Tab'&&layers.length){
        const top=layers.at(-1).el;
        const focusable=[...top.querySelectorAll('a[href],button:not(:disabled),input,textarea,select,summary,[tabindex="0"]'),...$('.overlay-language').querySelectorAll('select')].filter(el=>el.getClientRects().length);
        const first=focusable[0],last=focusable.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    });
    applyLanguage();go(0);
  }
  Object.assign(window,{start,closeReading,go,continueFromQuestion,chooseRuneDirection,goHome,navigateSection,cycleExample,beginReveal,revealNext,showReading,buildReadingPayload,interpretReading,buildLocalInterpretation,renderInterpretation,
    goEnergyMatch,showRitualPlan,selectMatchedSet,selectPrimaryProduct,finishWithoutProduct,chooseDesiredOutcome,saveReading,trackEvent,openPath,closePath,toggleMenu,
    openCollection,filterCollection,openWishlistProduct,
    openMaison,closeMaison,openProduct,closeProduct,addCurrentProduct,openBag,closeBag,removeBag,previewCheckout,
    openAccount,closeAccount,chooseMemberMode,completeMemberPreview,endMemberPreview,previewSignIn,subscribe,openLegal,closeLegal,acceptConsent,
    openWorldPreview,openPathPreview,openRitualPreview,closeStrategy,openCommerceProduct,saveCurrentRitual});
  window.MarevysAppBridge={
    openLayer,closeLayer,getLanguage:()=>state.lang,t,openProduct,toast,hasMemberAccess:()=>state.memberAccess,
    saveProductsToWishlist(names){
      const allowed=new Set(E.products.map(product=>product.name));
      const valid=[...new Set(Array.isArray(names)?names:[])].filter(name=>allowed.has(name));
      state.bag=[...new Set([...state.bag,...valid])];
      save('marevys.bag.v1',state.bag);updateBagCount();
      return valid;
    },
    refreshRecords:renderPath
  };
  init();
})();
