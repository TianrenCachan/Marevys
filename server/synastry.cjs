'use strict';
const {AstrologyError,calculateChart}=require('./astrology.cjs');
const TYPES=[['conjunction',0,6],['sextile',60,4],['square',90,6],['trine',120,6],['opposition',180,6]];
const RELATIONSHIPS=['romantic','friendship','family','work'];
const STAGES=['getting-to-know','together','distance','reconnecting'];
const NAMES={zh:{Sun:'太阳',Moon:'月亮',Mercury:'水星',Venus:'金星',Mars:'火星',Jupiter:'木星',Saturn:'土星',Uranus:'天王星',Neptune:'海王星',Pluto:'冥王星'},fr:{Sun:'Soleil',Moon:'Lune',Mercury:'Mercure',Venus:'Vénus',Mars:'Mars',Jupiter:'Jupiter',Saturn:'Saturne',Uranus:'Uranus',Neptune:'Neptune',Pluto:'Pluton'}};
const ASPECT_NAMES={zh:{conjunction:'合相',sextile:'六分相',square:'四分相',trine:'三分相',opposition:'对分相'},fr:{conjunction:'conjonction',sextile:'sextile',square:'carré',trine:'trigone',opposition:'opposition'}};
const delta=(a,b)=>((a-b+540)%360)-180;
function calculateCrossAspects(personA,personB){
  // A day-range is not a birth instant. Never substitute noon or a range midpoint.
  if(!personA.timeKnown||!personB.timeKnown)return [];
  const aspects=[];
  for(const a of personA.planets)for(const b of personB.planets){
    if(!Number.isFinite(a.longitude)||!Number.isFinite(b.longitude))continue;
    const separation=Math.abs(delta(a.longitude,b.longitude));
    for(const [type,angle,allowedOrb] of TYPES){
      const orb=Math.abs(separation-angle);
      if(orb<=allowedOrb)aspects.push({person1:'A',planet1:a.id,person2:'B',planet2:b.id,type,angle,orb:Number(orb.toFixed(6)),allowedOrb});
    }
  }
  return aspects.sort((a,b)=>a.orb-b.orb||a.planet1.localeCompare(b.planet1)||a.planet2.localeCompare(b.planet2));
}
function calculateSynastry(raw){
  const locale=['zh','en','fr'].includes(raw?.locale)?raw.locale:'fr';
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||!raw.birth||!raw.partnerBirth)throw new AstrologyError(400,'INVALID_INPUT',locale);
  const relationshipType=raw.relationshipType||'romantic',relationshipStage=raw.relationshipStage||'getting-to-know';
  if(!RELATIONSHIPS.includes(relationshipType)||!STAGES.includes(relationshipStage)||raw.question!==undefined&&(typeof raw.question!=='string'||raw.question.length>1600))throw new AstrologyError(400,'INVALID_INPUT',locale);
  // Only the two submitted birth inputs reach the ephemeris. Client-supplied chart
  // positions and aspect lists are never trusted for a basic or AI interpretation.
  const personA=calculateChart({...raw.birth,locale}),personB=calculateChart({...raw.partnerBirth,locale});
  const timeKnown=personA.timeKnown&&personB.timeKnown;
  const warnings=[...personA.warnings.map(w=>({...w,person:'A'})),...personB.warnings.map(w=>({...w,person:'B'}))];
  if(!timeKnown)warnings.push({code:'CROSS_ASPECTS_WITHHELD',message:locale==='zh'?'有一方出生时间未知：不计算双方的精确相位，也不推断宫位叠加。请先把解读作为相处问题的参考。':locale==='en'?'A birth time is unknown: precise cross-chart aspects and house overlays are withheld. Use this reading only as a starting point for a conversation.':'Une heure de naissance est inconnue : les aspects précis entre les deux thèmes et les superpositions de maisons sont masqués. Cette lecture sert de point de départ à une discussion.'});
  return {version:1,mode:'synastry',timeKnown,personA,personB,crossAspects:calculateCrossAspects(personA,personB),relationshipType,relationshipStage,warnings,method:{engine:'Astronomy Engine',engineVersion:personA.method.engineVersion,zodiac:'tropical',type:'synastry',description:'Two separately calculated natal charts; cross-chart planetary aspects. Not a midpoint composite chart.',aspects:'Conjunction, square, trine, opposition: 6°; sextile: 4°',unknownBirthTime:'All precise cross-chart aspects withheld if either time is unknown; no house overlays or inferred Moon longitude.',compatibilityScore:null}};
}
function questionIntent(question=''){
  if(/复合|挽回|重新|回到|reconnect|reconcil|retrouv|revenir|reprise/i.test(question))return 'reconnect';
  if(/吵|冷战|沟通|争|误会|conflict|argu|communicat|disput|conflit|malentendu/i.test(question))return 'communication';
  if(/结婚|长期|未来|稳定|承诺|长久|commit|long.term|marri|avenir|durable|engag|mariage/i.test(question))return 'commitment';
  if(/喜欢|吸引|缘分|暧昧|爱我|attract|feel|crush|attir|amour|aime/i.test(question))return 'attraction';
  return 'general';
}
function basicSynastryReading(chart,locale='fr',context={}){
  if(!['zh','fr','en'].includes(locale))locale='fr';
  const question=String(context.question||'').trim(),intent=questionIntent(question),romantic=chart.relationshipType==='romantic';
  const choose=o=>o[locale];
  const intentCopy={
    communication:{zh:'关于沟通，先看你们是不是在说同一件事：一个人在要回应，另一个人可能急着解释。可以从最近一次不愉快的对话开始核对，而不是判断谁天生难相处。',en:'For communication, start with one recent difficult exchange. Was one person asking to be heard while the other was trying to explain? Check what each of you needed before deciding who was wrong.',fr:'Pour mieux communiquer, reprenez un échange récent. L’un cherchait-il une écoute pendant que l’autre voulait expliquer ? Vérifiez le besoin de chacun avant de chercher qui avait tort.'},
    commitment:{zh:'如果你关心能不能走得长久，最值得看的是双方能否把承诺变成持续的行动。星盘可以提供相处线索，不能替任何一方答应未来。',en:'If you are asking whether this can last, look at whether both people follow through consistently. The chart can suggest questions about the relationship; it cannot make a commitment on either person’s behalf.',fr:'Si vous vous demandez si le lien peut durer, regardez si chacun tient ses engagements dans le temps. Le thème peut ouvrir des pistes ; il ne peut pas promettre un avenir à la place de l’autre.'},
    reconnect:{zh:'如果你想重新靠近，先确认对方愿意联系，再看导致疏远的问题有没有实际变化。比较盘不能告诉你对方一定会回来。',en:'If you want to reconnect, first check whether contact is welcome and whether the problem that created distance has changed. A chart cannot tell you that the other person will return.',fr:'Pour renouer, vérifiez d’abord que le contact est souhaité et que ce qui vous a éloignés a changé. Le thème ne peut pas annoncer que l’autre reviendra.'},
    attraction:{zh:romantic?'如果你想知道有没有缘分，可以把吸引和能否相处舒服分开看。对方是否愿意投入，仍要通过明确表达和实际行动确认。':'如果你想知道是否投缘，可以观察彼此是否愿意主动联系、倾听和尊重不同意见。星盘不能替对方表达心意。',en:'If you are asking about chemistry, separate an initial pull from feeling comfortable together. The other person’s interest needs to be checked through clear words and actions.',fr:'Si votre question porte sur l’attirance, distinguez l’élan du début et le fait de se sentir bien ensemble. Les intentions de l’autre se vérifient par ses paroles et ses actes.'},
    general:{zh:romantic?'你们能否相处得好，可以从沟通、被关心的方式和处理分歧这三件事看起。下面的线索用来对照真实相处，不用来给缘分打分。':'你们的关系可以从沟通、互相支持和处理分歧这三件事看起。下面的线索需要对照真实相处，不代表对任何一方的定论。',en:'Start with how you talk, support each other and handle disagreement. Use the observations below to compare with real interactions, rather than to assign the relationship a score.',fr:'Commencez par votre façon de parler, de vous soutenir et de gérer un désaccord. Comparez les pistes ci-dessous à votre vécu, sans attribuer une note à votre relation.'}
  };
  const areas=[
    {id:'communication',bodies:['Mercury'],titles:{zh:'把话说到一起',fr:'Se comprendre',en:'Understanding each other'},smooth:{zh:'可以观察：你们是否容易接住彼此的话，或帮助对方把想法说清楚。遇到重要事情时，把“我以为你知道”变成一句明确的确认。',en:'Notice whether you help each other put thoughts into words. For important plans, turn “I thought you knew” into a direct check that you understood the same thing.',fr:'Observez si vous vous aidez à formuler vos idées. Pour une décision importante, remplacez « je pensais que tu savais » par une vérification claire.'},tense:{zh:'可以观察：一方觉得自己在讲道理时，另一方是否觉得没被听见。试着先用自己的话复述对方的意思，再说你的看法。',en:'Notice whether one person feels they are explaining clearly while the other feels unheard. Try reflecting back what you understood before giving your own view.',fr:'Observez si l’un pense expliquer clairement pendant que l’autre ne se sent pas écouté. Reformulez ce que vous avez compris avant de répondre.'}},
    {id:'care',bodies:['Moon'],titles:{zh:'怎样才会觉得被在意',fr:'Se sentir soutenus',en:'Feeling supported'},smooth:{zh:'可以观察：相处时，你们是否较容易理解对方需要安慰还是需要空间。这种默契也值得说清楚，尤其在忙碌或压力大的时候。',en:'Notice whether you can tell when the other person wants reassurance or space. Even an easy understanding benefits from being stated clearly during stressful times.',fr:'Observez si vous reconnaissez le besoin de réconfort ou d’espace de l’autre. Même une bonne entente gagne à être explicitée dans les moments stressants.'},tense:{zh:'可以观察：一个人想马上得到回应，另一个人是否需要先独处。把各自需要的时间说清楚，比用回复速度判断在不在乎更有帮助。',en:'Notice whether one person wants an immediate response while the other needs time alone. Agreeing on when to return to the conversation helps more than measuring care by reply speed.',fr:'Observez si l’un attend une réponse immédiate tandis que l’autre a besoin de temps seul. Convenez d’un moment pour reprendre la discussion plutôt que de juger le lien à la vitesse des réponses.'}},
    {id:'connection',bodies:['Venus','Mars'],titles:{zh:romantic?'吸引之后，怎样相处':'找到舒服的相处节奏',fr:romantic?'Après l’attirance':'Trouver un rythme commun',en:romantic?'Beyond the initial spark':'Finding a shared rhythm'},smooth:{zh:'可以观察：你们是否愿意一起做事，也能尊重对方不同的喜好。把一次具体的小计划落实，比猜测彼此的心意更容易看见关系有没有向前。',en:'Notice whether you enjoy doing things together while respecting different preferences. Following through on a small shared plan tells you more than guessing what the other person feels.',fr:'Observez si vous aimez faire des choses ensemble tout en respectant des goûts différents. Réaliser un petit projet commun en dit plus que deviner les sentiments de l’autre.'},tense:{zh:'可以观察：你们对联系频率、主动程度或相处节奏是否有不同期待。直接说出自己舒服的范围，也给对方表达不同意见的空间。',en:'Notice whether you want different amounts of contact or move at different speeds. State what feels comfortable and give the other person room to disagree.',fr:'Observez si vos attentes diffèrent sur la fréquence des échanges ou le rythme du lien. Dites ce qui vous convient et laissez à l’autre la place d’exprimer un besoin différent.'}}
  ];
  const aspects=chart.crossAspects||[],used=new Set();
  const sections=areas.map(area=>{
    const candidates=aspects.filter(a=>area.bodies.includes(a.planet1)||area.bodies.includes(a.planet2));
    const a=candidates.find(a=>!used.has(a))||candidates[0];if(a)used.add(a);
    const tense=a&&['square','opposition'].includes(a.type);
    let text=choose(tense?area.tense:area.smooth);
    let evidence=null;
    if(a){
      evidence={planet1:a.planet1,planet2:a.planet2,type:a.type,orb:a.orb};
      const aName=NAMES[locale]?.[a.planet1]||a.planet1,bName=NAMES[locale]?.[a.planet2]||a.planet2,aspectName=ASPECT_NAMES[locale]?.[a.type]||a.type;
      text+=choose({zh:`这条线索来自你与对方的${aName}／${bName}${aspectName}；它是一种占星象征，需要由你们的实际经历来验证。`,en:` This prompt is based on your ${aName} and their ${bName} ${aspectName}. It is an astrological interpretation to compare with your experience.`,fr:` Cette piste part de votre ${aName} et de son ${bName} en ${aspectName}. C’est une lecture symbolique à comparer à votre vécu.`});
    }else text=choose({zh:chart.timeKnown?'在这组行星中没有找到所采用容许度内的主要相位，不能据此判断这个方面好或坏。可以直接聊聊：最近哪一次互动让各自觉得被理解？':'出生时间不完整，这个方面暂时不做精确相位解读。可以直接聊聊：最近哪一次互动让各自觉得被理解？',en:chart.timeKnown?'No major aspect in the selected orbs supports a specific observation here. That does not mean this area is good or bad. Ask each other about a recent moment of feeling understood.':'Without complete birth times, no precise aspect interpretation is offered here. Ask each other about a recent moment of feeling understood.',fr:chart.timeKnown?'Aucun aspect majeur dans les orbes retenus ne permet une piste précise ici. Cela ne dit pas si ce domaine va bien ou mal. Parlez d’un moment récent où chacun s’est senti compris.':'Sans les deux heures de naissance, aucune interprétation d’aspect précis n’est proposée ici. Parlez d’un moment récent où chacun s’est senti compris.'});
    return {id:area.id,title:choose(area.titles),text,evidence};
  });
  const actions={communication:{zh:'挑一次具体的对话，各自说“我当时希望你……”；先确认理解，再讨论办法。',en:'Choose one exchange and each finish “What I needed then was…”. Check understanding before discussing a solution.',fr:'Choisissez un échange et complétez chacun « À ce moment-là, j’avais besoin de… ». Vérifiez la compréhension avant de chercher une solution.'},commitment:{zh:'各自说出未来一个月愿意做到的一件事，在约定日期一起看看有没有落实。',en:'Each name one thing you are willing to do over the next month, then agree on a date to check what happened.',fr:'Nommez chacun une chose que vous êtes prêts à faire dans le mois, puis fixez un moment pour en reparler.'},reconnect:{zh:'如果联系是双方都愿意的，可以发出一次简单、没有施压的邀约；尊重对方的回答或不回应。',en:'If contact is welcome, offer one simple invitation without pressure and respect the answer, including no response.',fr:'Si le contact est souhaité, proposez une invitation simple, sans pression, et respectez la réponse ou l’absence de réponse.'},attraction:{zh:'提出一次轻松、具体的见面或交流，观察对方是否也主动安排并尊重你的边界。',en:'Suggest one specific, low-pressure plan and notice whether the other person also makes an effort and respects your boundaries.',fr:'Proposez un moment concret, sans pression, et observez si l’autre s’investit aussi et respecte vos limites.'},general:{zh:'各自说出一件希望保留的相处习惯，以及一件想一起调整的小事。',en:'Each name one habit you want to keep and one small thing you would like to change together.',fr:'Nommez chacun une habitude à garder et une petite chose à ajuster ensemble.'}};
  return {mode:'symbolic-basic',title:choose({zh:'把你们的相处看得更清楚',en:'A closer look at how you relate',fr:'Mieux comprendre votre lien'}),headline:choose({zh:'从真实的相处里，看见这段关系',en:'Understand the relationship through lived experience',fr:'Comprendre le lien à travers votre vécu'}),coreAnswer:choose(intentCopy[intent]),introduction:choose({zh:'以下为根据计算结果整理的基础参考；选择 AI 深入解读后，才会结合你的具体问题生成更完整的回答。',en:'These basic prompts use calculated chart data; they are not a deep AI reading. Choose an AI reading for a fuller response to your question.',fr:'Ces premiers repères utilisent les positions calculées ; ce n’est pas une lecture approfondie par IA. La lecture IA permet de relier plus précisément le thème à votre question.'}),sections,actions:[choose(actions[intent])],uncertainties:chart.warnings.filter(w=>w.code==='CROSS_ASPECTS_WITHHELD').map(w=>w.message),reflection:choose({zh:'如果先放下星盘，你们最近的行动给了你什么答案？',en:'If you set the chart aside, what do your recent actions tell you?',fr:'Si vous laissez le thème de côté, que disent vos actes récents ?'})};
}
module.exports={calculateSynastry,calculateCrossAspects,basicSynastryReading,questionIntent,RELATIONSHIPS,STAGES};
