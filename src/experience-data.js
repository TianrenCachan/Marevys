// RC19: distinct reading horizons, illustrated private matches and tactile ritual bookmarks.
window.MAREVYS_EXPERIENCE = {
  categories: [
    {id:'ALL',label:'All objects'},
    {id:'PARFUMS',label:'Fragrance'},
    {id:'OBJECTS',label:'Objects & jewelry'},
    {id:'RITUALS',label:'Tea & everyday rituals'},
    {id:'PAPER',label:'Journals & paper'}
  ],
  products: [
    {name:'EAU 01',category:'PARFUMS',image:'parfum',matchImage:'matchEau01',ritualImage:'bookmarkEau01',type:'Eau de parfum',line:'Mineral · Rain · Pale wood',featured:true,effectFrom:'Unmarked transition',effectTo:'A deliberate beginning',energyAction:'A single scent cue marks the instant reflection becomes a chosen action.'},
    {name:'VEIL 01',category:'RITUALS',image:'ritual',matchImage:'matchVeil01',ritualImage:'bookmarkVeil01',type:'Candle & evening ritual',line:'Paper · Scent · Flame',effectFrom:'Lingering stimulation',effectTo:'A contained pause',energyAction:'A small field of candlelight slows the visual rhythm and gives the moment an edge.'},
    {name:'SPECIMEN 01',category:'OBJECTS',image:'object',matchImage:'matchSpecimen01',ritualImage:'bookmarkSpecimen01',type:'Bronze pendant',line:'Stone · Bronze',effectFrom:'Disembodied thought',effectTo:'Embodied presence',energyAction:'The pendant’s weight brings attention back to posture, breath and the boundary of the body.'},
    {name:'RETURN 01',category:'PAPER',image:'journal',matchImage:'matchReturn01',ritualImage:'bookmarkReturn01',type:'Reflection journal',line:'A place for your own words.',desc:'A cloth-bound journal concept for keeping questions, observations and the reflections you choose to revisit.',meta:'Journal concept · Final specifications to be confirmed',effectFrom:'Circular thought',effectTo:'Articulated direction',energyAction:'Writing moves the question out of the mind and gives one decision a visible form.'},
    {name:'STONE 24',category:'OBJECTS',image:'productStone24',matchImage:'matchStone24',ritualImage:'bookmarkStone24',type:'Physical rune set',line:'24 hand-finished basalt stones',desc:'A complete Elder Futhark set cut from naturally varied dark basalt, with each historical character engraved by hand and filled in pale mineral pigment.',meta:'Rune set concept · 24 natural basalt stones · Linen pouch',effectFrom:'Scattered attention',effectTo:'Tactile grounding',energyAction:'Cool mineral texture and physical weight give attention one stable place to return to.'},
    {name:'GROUND 01',category:'RITUALS',image:'tea',matchImage:'matchGround01',ritualImage:'bookmarkGround01',type:'Tea ritual',line:'Roasted · Woody · Warm',desc:'A tea concept for a quiet pause. The bowl is a styling reference; the final blend, format and accessories are not yet confirmed.',meta:'Tea concept · Final specifications to be confirmed',effectFrom:'Inner speed',effectTo:'Measured pace',energyAction:'Warmth, aroma and repeated sips bring the body into a slower rhythm before another choice.'},
    {name:'PULSE 01',category:'PARFUMS',image:'productPulse01',matchImage:'matchPulse01',ritualImage:'bookmarkPulse01',type:'Botanical pulse oil',line:'Cedar leaf · Orris · Quiet warmth',featured:true,desc:'A portable roll-on scent designed to mark the moment reflection becomes action.',meta:'Pulse oil concept · Amber glass · 10 ml',effectFrom:'Hesitation',effectTo:'Readiness',energyAction:'Touch and fragrance at the wrist create a small threshold between planning and beginning.'},
    {name:'MEDALLION 01',category:'PARFUMS',image:'productMedallion01',matchImage:'matchMedallion01',ritualImage:'bookmarkMedallion01',type:'Solid perfume medallion',line:'Skin scent · Bronze · Iris',desc:'A refillable solid perfume held in a pocket medallion for intimate, close-to-skin rituals.',meta:'Solid perfume concept · Refillable medallion',effectFrom:'Guarded distance',effectTo:'Receptive presence',energyAction:'A close-to-skin scent softens the transition into a conversation without filling the room.'},
    {name:'EMBER 01',category:'RITUALS',image:'productEmber01',matchImage:'matchEmber01',ritualImage:'bookmarkEmber01',type:'Incense & bronze holder',line:'Hinoki · Tea smoke · Bronze',featured:true,desc:'A low bronze holder and short incense designed for a defined seven-minute interval.',meta:'Incense ritual concept · Holder and 12 short sticks',effectFrom:'Mental noise',effectTo:'Focused attention',energyAction:'One short incense stick gives the question a visible beginning, duration and ending.'},
    {name:'CLOTH 01',category:'OBJECTS',image:'productCloth01',matchImage:'matchCloth01',ritualImage:'bookmarkCloth01',type:'Ritual linen',line:'Undyed flax · Woven boundary',desc:'A small woven field for laying out cards, coins, a journal or one chosen object.',meta:'Ritual textile concept · Washed European linen',effectFrom:'Diffuse space',effectTo:'A protected field',energyAction:'Unfolding the linen separates this ritual from the rest of the room and the rest of the day.'},
    {name:'ARCANA 22',category:'PAPER',image:'productArcana22',matchImage:'matchArcana22',ritualImage:'bookmarkArcana22',type:'Major Arcana art deck',line:'22 images · Mineral pigment · Linen box',featured:true,desc:'An unbranded twenty-two-card art deck designed for slow, image-led reflection.',meta:'Tarot deck concept · Major Arcana · No reversed meanings',effectFrom:'Unformed feeling',effectTo:'A visible archetype',energyAction:'An image gives an unnamed tension a form that can be observed, questioned and reframed.'},
    {name:'COIN 64',category:'OBJECTS',image:'productCoin64',matchImage:'matchCoin64',ritualImage:'bookmarkCoin64',type:'I Ching coin set',line:'Three bronze coins · Woven pouch',desc:'Three weighted bronze coins and a woven pouch for forming a six-line cast by hand.',meta:'I Ching object concept · Three cast coins',effectFrom:'Rushed uncertainty',effectTo:'Deliberate attention',energyAction:'Six measured casts slow the question down and reveal change one line at a time.'}
  ],
  practices: {
    GROUND:'Rest your feet on the floor. Prepare a familiar drink and note what helps you feel settled.',
    OPEN:'Set distractions aside and write down something you would like to share with someone you trust.',
    PROSPER:'Name one resource you already have and one small way to make thoughtful use of it.',
    CLEAR:'Put one question on a page. Separate what you know from what you are assuming.',
    MOVE:'Choose one manageable next step and give it a place in your day. You do not have to decide everything that follows.',
    REST:'Take a short pause without notifications. Notice what can be left unfinished for now.',
    PROTECT:'Write down one boundary you want to keep and a respectful way to express it.',
    CREATE:'Put pen to paper for a few minutes without trying to make the result useful or perfect.'
  },
  recommendations: {
    GROUND:['GROUND 01','STONE 24','SPECIMEN 01','RETURN 01'],OPEN:['MEDALLION 01','EAU 01','SPECIMEN 01','RETURN 01'],
    PROSPER:['COIN 64','EAU 01','SPECIMEN 01','RETURN 01'],CLEAR:['CLOTH 01','EMBER 01','STONE 24','RETURN 01'],
    MOVE:['PULSE 01','EAU 01','SPECIMEN 01','RETURN 01'],REST:['CLOTH 01','VEIL 01','GROUND 01','RETURN 01'],
    PROTECT:['CLOTH 01','VEIL 01','SPECIMEN 01','RETURN 01'],CREATE:['CLOTH 01','PULSE 01','VEIL 01','RETURN 01']
  },
  desiredOutcomes: [
    {id:'CLARITY',label:'See the situation clearly',path:'CLEAR'},
    {id:'DECIDE',label:'Make a grounded decision',path:'CLEAR'},
    {id:'ACT',label:'Take the next real step',path:'MOVE'},
    {id:'STEADY',label:'Feel steadier',path:'GROUND'}
  ],
  energyProfiles: {
    GROUND:{title:'Rooted presence',copy:'Your reading asks for a stable base before another decision or demand is added.',signals:['STEADINESS','CONTINUITY'],productReasons:{'GROUND 01':'Warm tea gives the pause a physical beginning and keeps the next decision unhurried.','STONE 24':'A basalt stone gives your attention a cool, tactile place to return to.','SPECIMEN 01':'The pendant’s weight turns an abstract boundary into something the body can remember.','RETURN 01':'Writing separates what is stable from what is only urgent.'}},
    OPEN:{title:'Receptive connection',copy:'Your reading points toward listening, exchange and making room for a response you cannot force.',signals:['RECEPTIVITY','CONNECTION'],productReasons:{'MEDALLION 01':'A close-to-skin scent becomes a quiet cue to speak honestly and leave room for an answer.','EAU 01':'One breath of fragrance creates a threshold between rehearsal and the real conversation.','SPECIMEN 01':'The pendant becomes a discreet tactile reminder to stay present.','RETURN 01':'The page lets you name what you want to say before the conversation.'}},
    PROSPER:{title:'Considered expansion',copy:'Your reading favors noticing useful resources and giving the strongest one consistent attention.',signals:['RESOURCE','MOMENTUM'],productReasons:{'COIN 64':'The three weighted coins turn an abstract possibility into six deliberate moments of attention.','EAU 01':'A scent cue marks the moment you begin focused work.','SPECIMEN 01':'Its physical weight marks the resource you have chosen to develop rather than merely admire.','RETURN 01':'The journal makes existing resources and opportunities visible.'}},
    CLEAR:{title:'Quiet discernment',copy:'Your reading asks you to reduce noise, distinguish facts from assumptions and name one decision.',signals:['CLARITY','FOCUS'],productReasons:{'CLOTH 01':'A visible woven boundary removes unrelated objects and gives the question one uncluttered field.','EMBER 01':'A seven-minute incense interval gives the question a clear beginning and ending.','STONE 24':'A single stone gives the chosen priority a visible place.','RETURN 01':'The page holds facts, assumptions and the next decision separately.'}},
    MOVE:{title:'Measured momentum',copy:'Your reading supports movement that is concrete and small enough to begin within the next day.',signals:['MOVEMENT','COURAGE'],productReasons:{'PULSE 01':'Applied at the pulse, the botanical scent marks the exact moment planning becomes action.','EAU 01':'A clean scent cue interrupts repeated planning and declares that the first attempt has begun.','SPECIMEN 01':'Worn or held, the pendant marks the threshold between considering and acting.','RETURN 01':'Writing fixes the next action, time and first checkpoint.'}},
    REST:{title:'Restorative quiet',copy:'Your reading makes space for restoration before more analysis, effort or problem-solving.',signals:['REST','INWARD ATTENTION'],productReasons:{'CLOTH 01':'The linen places the phone and the unfinished day outside a visible edge.','VEIL 01':'Candlelight defines a short period in which nothing has to be solved.','GROUND 01':'A warm infusion slows the transition out of the day.','RETURN 01':'One closing sentence lets the question rest outside your mind.'}},
    PROTECT:{title:'Held boundaries',copy:'Your reading calls for a clear edge: what you will hold, what you will decline and what remains yours.',signals:['BOUNDARY','STEADINESS'],productReasons:{'CLOTH 01':'The linen creates a visible field: what belongs inside this moment and what stays outside it.','VEIL 01':'Lighting the candle creates a contained moment to rehearse clear words.','SPECIMEN 01':'The pendant is a tactile boundary cue you can wear into the situation.','RETURN 01':'Writing reduces the boundary to one calm sentence you can repeat without over-explaining.'}},
    CREATE:{title:'Emerging form',copy:'Your reading asks for an imperfect first form instead of waiting for complete certainty.',signals:['EXPRESSION','BEGINNING'],productReasons:{'CLOTH 01':'The woven field limits the session to one idea and the materials needed for its first form.','PULSE 01':'A pulse-point scent separates the moment of making from the moment of judging.','VEIL 01':'The candle gives the first draft a defined, limited window.','RETURN 01':'The journal receives the first version without requiring it to be finished.'}}
  },
  ritualPackages: {
    GROUND:{code:'BASE 04',title:'Grounding ritual set',subtitle:'For a period when pressure is moving faster than your foundations.'},
    OPEN:{code:'VOICE 04',title:'Honest conversation set',subtitle:'For a week when what is left unsaid is shaping the relationship.'},
    PROSPER:{code:'GROW 04',title:'Resource and momentum set',subtitle:'For a period when one useful resource needs consistent attention.'},
    CLEAR:{code:'SIGNAL 04',title:'Clear decision set',subtitle:'For a week of competing information, urgency or mixed priorities.'},
    MOVE:{code:'THRESHOLD 04',title:'Measured action set',subtitle:'For a week when more planning would only delay the first real test.'},
    REST:{code:'STILL 04',title:'Evening recovery set',subtitle:'For a period of overload, circular thought or unfinished stimulation.'},
    PROTECT:{code:'BOUNDARY 04',title:'Boundary ritual set',subtitle:'For a week of complicated cooperation, blurred requests or repeated boundary pressure.'},
    CREATE:{code:'FORM 04',title:'First-form ritual set',subtitle:'For a period when perfectionism is preventing the first visible draft.'}
  },
  productRoles: {
    'EAU 01':{role:'scent cue',action:'spray once onto a blotter or wrist'},
    'VEIL 01':{role:'light cue',action:'light the candle on a stable, clear surface'},
    'GROUND 01':{role:'tea ritual',action:'brew one warm cup and sit down with it'},
    'RETURN 01':{role:'written anchor',action:'write by hand in the journal'},
    'STONE 24':{role:'tactile anchor',action:'touch or place one basalt stone'},
    'SPECIMEN 01':{role:'wearable anchor',action:'wear or hold the pendant'},
    'PULSE 01':{role:'pulse-point cue',action:'apply one drop to the wrist before the first action'},
    'MEDALLION 01':{role:'close-to-skin scent',action:'touch the solid perfume once before the conversation'},
    'EMBER 01':{role:'seven-minute interval',action:'light one short incense stick in the bronze holder'},
    'CLOTH 01':{role:'ritual boundary',action:'unfold the linen and place only the essential object on it'},
    'ARCANA 22':{role:'image-led reflection',action:'turn one card and notice the image before reading its name'},
    'COIN 64':{role:'six-part decision ritual',action:'cast the three coins once for each of the six lines'}
  },
  ritualPlans: {
    GROUND:{image:'ritualGround',title:'Return to solid ground',when:'Before your next decision or at the start of the day',duration:'10 minutes',setting:'A table and a chair, with both feet on the floor',intention:'Name what is already stable before deciding what comes next.',steps:[
      {product:'GROUND 01',text:'Brew one cup of GROUND 01, sit down and feel both feet meet the floor.'},
      {product:'STONE 24',text:'Hold one STONE 24 piece for three slow breaths, then place it beside the cup as the marker of what is stable.'},
      {product:'SPECIMEN 01',text:'Touch SPECIMEN 01 and name the one boundary that will keep the next step sustainable.'},
      {product:'RETURN 01',text:'In RETURN 01, write one thing that is secure and one next step that does not disturb it.'}
    ]},
    OPEN:{image:'ritualOpen',title:'Prepare a real conversation',when:'Before speaking with the person involved',duration:'9 minutes',setting:'A quiet place where you can write one private page',intention:'Enter the conversation ready to listen as well as speak.',steps:[
      {product:'MEDALLION 01',text:'Touch MEDALLION 01 once and let the close-to-skin scent mark the beginning.'},
      {product:'EAU 01',text:'Spray EAU 01 once into the air beside you and allow one full breath before choosing your words.'},
      {product:'SPECIMEN 01',text:'Wear or hold SPECIMEN 01 during the conversation as a reminder to return to listening.'},
      {product:'RETURN 01',text:'In RETURN 01, finish two sentences: “I want to say…” and “I am ready to hear…”'}
    ]},
    PROSPER:{image:'ritualProsper',title:'Choose what to grow',when:'At the beginning of a focused work period',duration:'12 minutes',setting:'Your work surface, cleared of unrelated objects',intention:'Give one existing resource enough attention to develop.',steps:[
      {product:'COIN 64',text:'Place the three COIN 64 pieces together and name the resource that already has real potential.'},
      {product:'EAU 01',text:'Spray EAU 01 once and choose the one resource that deserves the next uninterrupted block.'},
      {product:'SPECIMEN 01',text:'Place SPECIMEN 01 over the chosen resource as a physical marker of commitment.'},
      {product:'RETURN 01',text:'List three resources already available in RETURN 01, then schedule the smallest useful test.'}
    ]},
    CLEAR:{image:'ritualClear',title:'Separate signal from noise',when:'When a decision feels crowded or urgent',duration:'10 minutes',setting:'A clear surface with notifications turned off',intention:'Reduce the question to what is known and actionable.',steps:[
      {product:'CLOTH 01',text:'Unfold CLOTH 01 and place only the question and the objects for this ritual inside its edge.'},
      {product:'EMBER 01',text:'Light one short EMBER 01 incense stick and give the question only this seven-minute interval.'},
      {product:'STONE 24',text:'Place one STONE 24 piece beside the fact that deserves attention first.'},
      {product:'RETURN 01',text:'Divide a page in RETURN 01 into “facts,” “assumptions” and “next decision,” then add one line to each.'}
    ]},
    MOVE:{image:'ritualMove',title:'Cross one small threshold',when:'Within twenty-four hours of this reading',duration:'8 minutes to prepare, then one real action',setting:'Where the next action can actually begin',intention:'Turn reflection into one observable movement.',steps:[
      {product:'PULSE 01',text:'Apply one drop of PULSE 01 at the wrist and name the threshold you are ready to cross.'},
      {product:'EAU 01',text:'Spray EAU 01 once to mark a clean beginning rather than another round of planning.'},
      {product:'SPECIMEN 01',text:'Wear or hold SPECIMEN 01, then begin before adding another plan.'},
      {product:'RETURN 01',text:'In RETURN 01, write the action, its start time and what “done for today” means.'}
    ]},
    REST:{image:'ritualRest',title:'Close the day gently',when:'In the evening, after the final necessary task',duration:'15 minutes',setting:'A dim room with the phone out of reach',intention:'Let the question rest without demanding an answer tonight.',steps:[
      {product:'CLOTH 01',text:'Unfold CLOTH 01 and place the phone outside its edge before beginning.'},
      {product:'VEIL 01',text:'Light VEIL 01 on a stable surface and give yourself ten minutes without solving the question.'},
      {product:'GROUND 01',text:'Brew GROUND 01 and drink the first half of the cup without a screen.'},
      {product:'RETURN 01',text:'Write one closing sentence in RETURN 01, then extinguish the candle before leaving the room.'}
    ]},
    PROTECT:{image:'ritualProtect',title:'Rehearse the boundary',when:'Before the situation in which the boundary is needed',duration:'10 minutes',setting:'A private place where you can speak one sentence aloud',intention:'Make the boundary clear, calm and possible to repeat.',steps:[
      {product:'CLOTH 01',text:'Unfold CLOTH 01 and place only the object or note that belongs to this decision inside its edge.'},
      {product:'VEIL 01',text:'Light VEIL 01 and let the circle of light define the space in which you will choose your words.'},
      {product:'SPECIMEN 01',text:'Wear or hold SPECIMEN 01 and notice the physical space around your body.'},
      {product:'RETURN 01',text:'Write the boundary once in RETURN 01, rehearse it aloud, then extinguish the candle before leaving.'}
    ]},
    CREATE:{image:'ritualCreate',title:'Make the first version',when:'At the next protected creative window',duration:'18 minutes',setting:'A work surface with only the materials for one draft',intention:'Give the idea a visible first form before evaluating it.',steps:[
      {product:'CLOTH 01',text:'Unfold CLOTH 01 and place only the materials for this one draft inside its edge.'},
      {product:'PULSE 01',text:'Apply PULSE 01 once when you are tempted to judge, then return to making.'},
      {product:'VEIL 01',text:'Light VEIL 01 to give the first version a finite, protected window.'},
      {product:'RETURN 01',text:'Open RETURN 01 to a blank page and make the first imperfect version before the candle interval ends.'}
    ]}
  },
  examples: [
    {rune:'ISA',question:'I feel pulled in many directions. What should I notice?',meaning:'ISA is associated with stillness. Use it to notice where a pause might help, not as a prediction that life will stop.',prompt:'What can wait until tomorrow?',practice:'Put your phone aside and write down the one thing that needs your attention.'},
    {rune:'GEBO',question:'How can I bring more balance into a relationship?',meaning:'GEBO evokes exchange and reciprocity. Consider what is being offered, received or left unspoken.',prompt:'What would a more balanced exchange look like?',practice:'Make room for one honest conversation, without trying to settle everything at once.'},
    {rune:'DAGAZ',question:'I am ready for a change. Where could I begin?',meaning:'DAGAZ is associated with a shift in perspective. Notice what becomes clearer when you look at the situation differently.',prompt:'Which small next step is actually within my control?',practice:'Choose one manageable action and leave space to reconsider after trying it.'}
  ]
};
