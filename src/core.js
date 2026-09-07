(function (host) {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => String(s).replace(/\s+/g,' ').trim();
  function makeTranslator(rows) {
    const exact = new Map(), folded = new Map();
    for (const [en,fr,zh] of rows) {
      if (!en || typeof fr !== 'string' || typeof zh !== 'string') throw new Error('Invalid translation row: '+en);
      exact.set(normalize(en),{en,fr,zh});
      if (!folded.has(en.toLowerCase())) folded.set(en.toLowerCase(),{en,fr,zh});
    }
    function has(text) {return exact.has(normalize(text)) || folded.has(normalize(text).toLowerCase());}
    function t(text, lang='en', params={}) {
      const key=normalize(text);
      let result=text;
      const row=exact.get(key) || folded.get(key.toLowerCase());
      if (row && lang !== 'en') {
        result=row[lang] ?? text;
        // English title-case navigation has the same key as upper-case navigation.
        if (!exact.has(key) && /^[A-Z][a-z]/.test(key) && lang==='fr') result=result.charAt(0).toUpperCase()+result.slice(1).toLowerCase();
      } else if (!row && lang!=='en' && / · | \/ /.test(key)) {
        result=key.split(/( · | \/ )/).map(part => /^( · | \/ )$/.test(part) ? part : t(part,lang)).join('');
      }
      return String(result).replace(/\{(\w+)\}/g,(all,k)=>Object.hasOwn(params,k)?String(params[k]):all);
    }
    return {t,has,rows:exact};
  }
  function context(question,focus) {
    // Stable focus IDs always take precedence; translations never become business-logic keys.
    const fixed={LOVE:'RELATIONSHIP',WORK:'WORK',CHANGE:'CHANGE',SELF:'SELF','A DECISION':'DECISION','NO QUESTION':'OPEN READING'};
    if (fixed[focus]) return fixed[focus];
    const q=String(question).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if (/love|relationship|partner|amour|couple|relation|partenaire|爱情|感情|关系|伴侣/.test(q)) return 'RELATIONSHIP';
    if (/work|job|career|business|project|client|team|company|contract|collaborat|partnership|travail|emploi|carriere|entreprise|profession|projet|equipe|contrat|collabor|partenariat|工作|事业|职业|生意|合作|项目|客户|团队|公司|合伙|合同/.test(q)) return 'WORK';
    if (/decision|choose|choice|choix|choisir|decid|决定|选择/.test(q)) return 'DECISION';
    if (/change|move|new|chang|nouveau|nouvelle|demenag|改变|变化|搬|新/.test(q)) return 'CHANGE';
    if (/\bself\b|myself|moi|soi|personnel|自己|自我/.test(q)) return 'SELF';
    return 'OPEN READING';
  }
  const PATHS=['GROUND','OPEN','PROSPER','CLEAR','MOVE','REST','PROTECT','CREATE'];
  const CONTEXT_PATH_WEIGHTS={
    RELATIONSHIP:{OPEN:0.7,PROTECT:0.3},WORK:{CLEAR:0.55,PROSPER:0.4,MOVE:0.25},
    DECISION:{CLEAR:0.75,MOVE:0.35},CHANGE:{MOVE:0.75,GROUND:0.25},SELF:{GROUND:0.35,CREATE:0.3,REST:0.25},
    'OPEN READING':{}
  };
  const OUTCOME_PATH_WEIGHTS={
    CLARITY:{CLEAR:1},NEXT_STEP:{MOVE:1},STEADINESS:{GROUND:1},RESTORE:{REST:1},
    CONNECTION:{OPEN:1},BOUNDARIES:{PROTECT:1},GROWTH:{PROSPER:1},EXPRESSION:{CREATE:1},
    DECIDE:{CLEAR:1},ACT:{MOVE:1},STEADY:{GROUND:1}
  };
  function rankPaths(runes,weights,options={}) {
    const scores=Object.fromEntries(PATHS.map(path=>[path,0]));
    runes.forEach((name,i) => {
      const w=runes.length===3 ? [0.8,1,1.1][i] : 1;
      for (const [path,score] of Object.entries(weights?.[String(name).toUpperCase()]||{})) if(Object.hasOwn(scores,path)) scores[path]+=Number(score||0)*w;
    });
    const ctx=CONTEXT_PATH_WEIGHTS[String(options.context||'').toUpperCase()]||{};
    const outcome=OUTCOME_PATH_WEIGHTS[String(options.desiredOutcome||'').toUpperCase()]||{};
    for(const [path,score] of Object.entries(ctx))scores[path]+=score;
    for(const [path,score] of Object.entries(outcome))scores[path]+=score;
    const energyTags=Array.isArray(options.energyTags)?options.energyTags:[];
    energyTags.slice(0,2).forEach((tag,i)=>{const path=String(tag||'').toUpperCase();if(Object.hasOwn(scores,path))scores[path]+=[0.8,0.35][i];});
    return Object.entries(scores).sort((a,b)=>b[1]-a[1]||PATHS.indexOf(a[0])-PATHS.indexOf(b[0]));
  }
  function pathFromRunes(runes,weights) {
    return rankPaths(runes,weights)[0][0];
  }
  function dailyIndex(date,count) {
    const k=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
    let h=0;for(const c of k)h=(h*31+c.charCodeAt(0))>>>0;
    return h%count;
  }
  function createStore(storage) {
    const memory=new Map();let failed=!storage;
    return {
      get failed(){return failed;},
      read(key,fallback) {
        let raw=memory.has(key)?memory.get(key):null;
        if (!failed) {try{raw=storage.getItem(key)}catch{failed=true;}}
        if(raw===null||raw===undefined) return fallback;
        try {const value=JSON.parse(raw);return Array.isArray(fallback)&&!Array.isArray(value)?fallback:value;}catch{return typeof fallback==='string'?raw:fallback;}
      },
      write(key,value) {
        const raw=JSON.stringify(value);memory.set(key,raw);
        if(!failed){try{storage.setItem(key,raw);return true;}catch{failed=true;}}
        return false;
      }
    };
  }
  function changeLanguage(state,lang){
    if(!['en','fr','zh'].includes(lang))return false;
    state.lang=lang;
    return true;
  }
  function cleanReadings(data,runes) {
    const known=new Map(runes.map(r=>[r[1],r]));
    return (Array.isArray(data)?data:[]).filter(x=>x&&Array.isArray(x.runes)).map(x=>({
      ...x,question:String(x.question||''),reflection:String(x.reflection||''),focus:String(x.focus||''),
      runes:x.runes.filter(r=>r&&known.has(r.n)).map(r=>{const canonical=known.get(r.n);return {s:canonical[0],n:r.n,t:canonical[2],themes:canonical[5]};})
    })).filter(x=>x.runes.length>0).slice(0,100);
  }
  host.MarevysCore={escape,normalize,makeTranslator,context,rankPaths,pathFromRunes,dailyIndex,createStore,cleanReadings,changeLanguage};
})(typeof window==='undefined'?globalThis:window);
