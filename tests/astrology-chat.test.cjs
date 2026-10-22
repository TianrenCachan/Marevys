'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const {calculateChart,basicReading}=require('../server/astrology.cjs');
const {calculateSynastry,basicSynastryReading}=require('../server/synastry.cjs');

const birth={date:'1990-07-16',time:'15:22',timeUnknown:false,latitude:48.8566,longitude:2.3522,timezone:'Europe/Paris',locationId:'paris',city:'Paris'};
const partnerBirth={date:'1988-02-12',time:'09:10',timeUnknown:false,latitude:31.2304,longitude:121.4737,timezone:'Asia/Shanghai',locationId:'shanghai',city:'上海'};
const firstReading={headline:'先把期待说清楚',coreAnswer:'先说出你期待怎样沟通，再听听对方的安排。',sections:[{title:'沟通节奏',text:'星盘中的象征提供一种理解差异的角度，实际情况需要双方沟通确认。'},{title:'留出空间',text:'讨论一个双方都愿意尝试的具体安排。'}],actions:['约一个都方便的时间，讨论各自期待的回复方式。'],reflection:'什么样的沟通安排适合你？',uncertainties:[]};
const nextReading={...firstReading,headline:'下一步的安排',coreAnswer:'先问对方是否愿意一起讨论，再提出一个具体建议。',actions:['提出一个可调整的约定，观察双方能否做到。']};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function ui({mode='natal',lang='zh',question='怎样更好地沟通自己的需要？',api}={}){
  const dom=new JSDOM('<main id="root"></main>',{runScripts:'outside-only',url:'http://localhost'}),w=dom.window,root=w.document.getElementById('root');
  const chart=mode==='synastry'?calculateSynastry({mode,birth,partnerBirth,locale:lang,relationshipType:'romantic',relationshipStage:'together'}):calculateChart({...birth,locale:lang});
  const state={mode,birth:{...birth},partnerBirth:{...partnerBirth},topic:'relations',relationshipType:'romantic',relationshipStage:'together',chart,question,resultQuestion:question,resultLocale:lang,basicReading:mode==='synastry'?basicSynastryReading(chart,lang,{question}):basicReading(chart,lang,{question,topic:'relations'})};
  const calls=[],saved=[];
  w.eval(fs.readFileSync(require.resolve('../src/astrology-studio.js'),'utf8'));
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ctx={lang,state,escape,api:async(path,body)=>{calls.push({path,body});return api?api(path,body,calls):{source:'ai',readingId:'initial',reading:firstReading};},save:async record=>{saved.push(JSON.parse(JSON.stringify(record)));return true;},render:()=>w.MarevysAstrologyStudio.render(root,ctx)};
  ctx.render();
  const find=selector=>root.querySelector(selector),click=selector=>{assert(find(selector),selector);find(selector).click();};
  const fill=(selector,value)=>{const node=find(selector);assert(node,selector);node.value=value;node.dispatchEvent(new w.Event('input',{bubbles:true}));};
  const submit=selector=>{assert(find(selector),selector);find(selector).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
  return {w,root,state,ctx,calls,saved,find,click,fill,submit,chart,close:()=>w.close()};
}
async function deepen(p){p.click('[name="aiConsent"]');p.click('[data-astro="deepen"]');await tick();}

for(const mode of ['natal','synastry'])test(`astrology conversation: ${mode} initial answer and real followup retain the same computed chart`,async()=>{
  const p=ui({mode,api:async(path,body)=>({source:'ai',readingId:body.followupQuestion?'next':'initial',reading:body.followupQuestion?nextReading:firstReading})});
  try{
    assert(!p.find('.astro-chat'),'The basic symbolic reading is kept distinct from AI conversation');
    await deepen(p);
    assert.equal(p.root.querySelectorAll('.astro-chat-message.is-user').length,1);
    assert.equal(p.root.querySelectorAll('.astro-chat-message.is-reader').length,1);
    assert.equal(p.find('.astro-chat .astro-core').textContent,firstReading.coreAnswer);
    assert.equal(p.find('.astro-chat-details').open,false);
    assert(p.find('.astro-actions-list').textContent.includes(firstReading.actions[0]));
    const beforeWheel=p.find('.astro-wheel').outerHTML;
    p.click('[data-astro="followup-prompt"]');assert(p.find('#astroFollowup').value.length>=5);
    p.fill('#astroFollowup','具体可以怎样开始这段沟通？');p.submit('[data-astro-form="followup"]');await tick();
    assert.equal(p.calls.length,2);assert(p.calls.every(call=>call.path==='/api/reading'));
    const request=p.calls[1].body;
    assert.equal(request.schemaVersion,2);assert.equal(request.system,'ASTROLOGY');assert.equal(request.mode,mode);assert.equal(request.consent,true);
    assert.deepEqual(request.birth,p.calls[0].body.birth);assert.equal(request.question,p.calls[0].body.question);
    if(mode==='synastry'){assert.deepEqual(request.partnerBirth,p.calls[0].body.partnerBirth);assert.equal(request.relationshipStage,'together');}
    assert.equal(request.followupQuestion,'具体可以怎样开始这段沟通？');assert.equal(request.conversation[0].question,p.state.resultQuestion);assert(request.conversation[0].answer.includes(firstReading.coreAnswer));
    assert.equal(p.state.chart,p.chart);assert.equal(p.find('.astro-wheel').outerHTML,beforeWheel);
    assert.equal(p.state.aiReading.reading.coreAnswer,firstReading.coreAnswer,'Initial answer is not overwritten');
    assert.equal(p.state.followups[0].answer,nextReading.coreAnswer);assert.equal(p.find('#astroFollowup').value,'');
    assert.equal(p.root.querySelectorAll('.astro-chat-message.is-reader').length,2);
    p.fill('#astroNote','希望下次能更清楚地表达。');p.click('[data-astro="save"]');await tick();
    assert.equal(p.saved[0].reading.coreAnswer,firstReading.coreAnswer);assert.equal(p.saved[0].followups[0].answer,nextReading.coreAnswer);assert.equal(p.saved[0].followups[0].question,request.followupQuestion);assert.equal(p.saved[0].note,'希望下次能更清楚地表达。');assert.equal(p.saved[0].source,'ai');
  }finally{p.close();}
});

test('astrology conversation: failed followup keeps the draft, chart and previous messages with an explicit error',async()=>{
  const p=ui({api:async(path,body)=>{if(body.followupQuestion)throw {error:{message:'解读服务暂时不可用，请重试。'}};return {source:'ai',reading:firstReading};}});
  try{
    await deepen(p);p.fill('#astroFollowup','如果沟通之后仍然没有回应呢？');p.submit('[data-astro-form="followup"]');await tick();
    assert.equal(p.find('#astroFollowup').value,'如果沟通之后仍然没有回应呢？');assert.equal(p.state.followups.length,0);assert.equal(p.state.chart,p.chart);assert.equal(p.find('.astro-core').textContent,firstReading.coreAnswer);assert.match(p.find('[role="alert"]').textContent,/不可用/);assert.equal(p.state.busy,'');
  }finally{p.close();}
});

test('astrology conversation: guided short reply is attached to its latest question and cleared by the next response',async()=>{
  const asked='你们已经讨论过各自期待的回复时间吗？';
  const p=ui({api:async(path,body)=>({source:'ai',reading:{...(body.followupQuestion?nextReading:firstReading),clarificationQuestion:body.followupQuestion?null:asked}})});
  try{
    await deepen(p);assert.equal(p.find('#astroGuidedQuestion').textContent,asked);
    p.fill('#astroGuidedReply','没有');p.submit('[data-astro-form="guided"]');await tick();
    assert.equal(p.calls[1].body.followupQuestion,'没有');assert.equal(p.calls[1].body.guidedQuestion,asked);assert.equal(p.state.followups[0].guidedQuestion,asked);
    assert.equal(p.state.pendingClarification,null);assert(!p.find('#astroGuidedQuestion'));
    p.fill('#astroFollowup','应该如何提出这个话题？');p.submit('[data-astro-form="followup"]');await tick();
    assert.equal(p.calls[2].body.guidedQuestion,undefined);assert.equal(p.calls[2].body.conversation.at(-1).guidedQuestion,asked);
  }finally{p.close();}
});

test('astrology conversation: text is escaped, localization stays complete and request excerpts remain bounded',async()=>{
  const p=ui({lang:'fr',question:'Que signifie <img src=x onerror=alert(1)> dans ma question ?'});
  try{
    await deepen(p);assert.equal(p.root.querySelectorAll('.astro-chat img').length,0);assert(p.find('.astro-chat-message.is-user').textContent.includes('<img src=x'));
    assert.match(p.find('label[for="astroFollowup"]').textContent,/question/);assert.match(p.find('.astro-chat-compose button').textContent,/Envoyer/);
    p.state.followups=Array.from({length:12},()=>({question:'问'.repeat(1000),answer:'答'.repeat(1800),guidedQuestion:'补'.repeat(300),actions:[]}));p.ctx.render();
    p.fill('#astroFollowup','Comment formuler cette demande ?');p.submit('[data-astro-form="followup"]');await tick();
    const request=p.calls.at(-1).body;assert(request.conversation.length>0);assert(request.conversation.length<=4);assert(Buffer.byteLength(JSON.stringify(request.conversation),'utf8')<=8000);assert(Buffer.byteLength(JSON.stringify(request),'utf8')<=31000);
    assert.equal(p.state.followups.length,13,'Only the outgoing excerpt is bounded; local history stays complete');
  }finally{p.close();}
});
