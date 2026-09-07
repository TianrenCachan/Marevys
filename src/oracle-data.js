// RC14: original, trilingual reference data for the Tarot and I Ching journeys.
// Tarot scope: the 22 Major Arcana only. This edition intentionally does not use reversals.
(function () {
  "use strict";

  const localize = (en, fr, zh) => Object.freeze({ en, fr, zh });

  const TAROT_MAJOR_SOURCE = [
    {
      id: "TAROT_00", number: 0, roman: "0", key: "FOOL", glyph: "◌",
      name: localize("The Fool", "Le Mat", "愚者"),
      principle: localize(
        "A beginning becomes possible when curiosity is allowed to move before certainty.",
        "Un commencement devient possible lorsque la curiosité avance avant la certitude.",
        "当好奇心可以先于确定性迈步，新的开始便有了空间。"
      ),
      caution: localize(
        "Openness is useful; impulse without a foothold can scatter your attention.",
        "L’ouverture est féconde ; l’impulsion sans point d’appui peut disperser l’attention.",
        "开放很有价值，但没有落点的冲动会让注意力四散。"
      ),
      action: localize(
        "Choose one small, reversible experiment and begin it within a day.",
        "Choisissez une petite expérience réversible et commencez-la dans la journée.",
        "选一个可随时调整的小尝试，并在一天内开始。"
      ),
      energyTags: ["MOVE", "OPEN"]
    },
    {
      id: "TAROT_01", number: 1, roman: "I", key: "MAGICIAN", glyph: "✦",
      name: localize("The Magician", "Le Bateleur", "魔术师"),
      principle: localize(
        "Intention gains force when the right tools are gathered around one clear aim.",
        "L’intention prend de la force lorsque les bons outils servent un but clair.",
        "当合适的资源围绕一个清晰目标聚拢，意图才会产生力量。"
      ),
      caution: localize(
        "Skill can turn into performance or control when the real purpose is left unnamed.",
        "Le savoir-faire devient mise en scène ou contrôle si le véritable but reste sans nom.",
        "若不说清真正目的，能力容易变成表演或控制。"
      ),
      action: localize(
        "Name one resource already in your hands and use it on the question today.",
        "Nommez une ressource déjà disponible et employez-la aujourd’hui sur la question.",
        "说出手中已有的一项资源，今天就把它用在这个问题上。"
      ),
      energyTags: ["CREATE", "MOVE"]
    },
    {
      id: "TAROT_02", number: 2, roman: "II", key: "HIGH_PRIESTESS", glyph: "☾",
      name: localize("The High Priestess", "La Papesse", "女祭司"),
      principle: localize(
        "Quiet attention can reveal what noise, urgency and other people’s answers conceal.",
        "Une attention silencieuse révèle ce que le bruit, l’urgence et les réponses d’autrui cachent.",
        "安静的注意力会显出被噪音、急迫感和他人答案遮住的东西。"
      ),
      caution: localize(
        "Intuition needs testing; silence alone can become projection or passive waiting.",
        "L’intuition demande à être vérifiée ; le silence seul peut devenir projection ou attente passive.",
        "直觉仍需验证；只有沉默，可能变成投射或被动等待。"
      ),
      action: localize(
        "Sit without input for five minutes, then write what you already sense and what remains unknown.",
        "Restez cinq minutes sans apport extérieur, puis notez ce que vous pressentez et ce qui demeure inconnu.",
        "五分钟不接收外界信息，然后写下你已经感到的和仍未知的部分。"
      ),
      energyTags: ["REST", "CLEAR"]
    },
    {
      id: "TAROT_03", number: 3, roman: "III", key: "EMPRESS", glyph: "♀",
      name: localize("The Empress", "L’Impératrice", "皇后"),
      principle: localize(
        "Growth follows when care, pleasure and practical nourishment meet fertile conditions.",
        "La croissance vient lorsque le soin, le plaisir et une nourriture concrète trouvent un terrain fertile.",
        "关怀、愉悦与实际滋养遇到合适条件时，成长便会发生。"
      ),
      caution: localize(
        "Giving everything away can exhaust the source that makes growth possible.",
        "Tout donner peut épuiser la source même qui rend la croissance possible.",
        "一味付出，会耗尽原本支持成长的源头。"
      ),
      action: localize(
        "Improve one condition that lets the person, project or body in question thrive.",
        "Améliorez une condition permettant à la personne, au projet ou au corps concerné de s’épanouir.",
        "改善一个条件，让相关的人、项目或身体真正获得滋养。"
      ),
      energyTags: ["CREATE", "PROSPER"]
    },
    {
      id: "TAROT_04", number: 4, roman: "IV", key: "EMPEROR", glyph: "◆",
      name: localize("The Emperor", "L’Empereur", "皇帝"),
      principle: localize(
        "A stable structure turns responsibility into something visible, ordered and dependable.",
        "Une structure stable rend la responsabilité visible, ordonnée et fiable.",
        "稳定的结构让责任变得可见、有序并且可靠。"
      ),
      caution: localize(
        "Order loses its purpose when it hardens into control or refuses new evidence.",
        "L’ordre perd son sens lorsqu’il se durcit en contrôle ou refuse de nouveaux éléments.",
        "当秩序僵化为控制，或拒绝新的事实，它就失去了意义。"
      ),
      action: localize(
        "Define one boundary, one owner and the next checkpoint for this situation.",
        "Définissez une limite, un responsable et le prochain point d’étape pour cette situation.",
        "为当前情况明确一条边界、一个负责人和下一个检查点。"
      ),
      energyTags: ["PROTECT", "GROUND"]
    },
    {
      id: "TAROT_05", number: 5, roman: "V", key: "HIEROPHANT", glyph: "✢",
      name: localize("The Hierophant", "Le Pape", "教皇"),
      principle: localize(
        "A tested tradition or trusted teacher can offer language for what you are learning.",
        "Une tradition éprouvée ou un guide de confiance peut donner des mots à votre apprentissage.",
        "经过验证的传统或可信的引导者，能为正在学习的事提供语言。"
      ),
      caution: localize(
        "Received wisdom should support discernment, not replace your own responsibility.",
        "La sagesse reçue doit soutenir le discernement, non remplacer votre responsabilité.",
        "传承下来的智慧应帮助你判断，而不是替你承担责任。"
      ),
      action: localize(
        "Consult one reliable source, then write the part you accept and the part you must test yourself.",
        "Consultez une source fiable, puis notez ce que vous retenez et ce que vous devez vérifier vous-même.",
        "查阅一个可靠来源，再写下你接受的部分和需要亲自验证的部分。"
      ),
      energyTags: ["GROUND", "CLEAR"]
    },
    {
      id: "TAROT_06", number: 6, roman: "VI", key: "LOVERS", glyph: "♡",
      name: localize("The Lovers", "L’Amoureux", "恋人"),
      principle: localize(
        "A meaningful choice asks your values, desire and relationships to speak to one another.",
        "Un choix important demande à vos valeurs, vos désirs et vos liens de dialoguer.",
        "真正重要的选择，需要价值、欲望与关系彼此对话。"
      ),
      caution: localize(
        "Agreement made only to avoid discomfort can hide the choice that still needs to be made.",
        "Un accord conclu seulement pour éviter l’inconfort peut masquer le choix encore nécessaire.",
        "只为避免不适而达成的一致，会掩盖仍需作出的选择。"
      ),
      action: localize(
        "Name the value you will not trade away, then have the conversation it requires.",
        "Nommez la valeur que vous ne voulez pas sacrifier, puis engagez la conversation nécessaire.",
        "说出你不愿交换掉的那项价值，然后进行它所要求的对话。"
      ),
      energyTags: ["OPEN", "CLEAR"]
    },
    {
      id: "TAROT_07", number: 7, roman: "VII", key: "CHARIOT", glyph: "⇧",
      name: localize("The Chariot", "Le Chariot", "战车"),
      principle: localize(
        "Momentum becomes coherent when competing forces are given one direction.",
        "L’élan devient cohérent lorsque des forces concurrentes reçoivent une même direction.",
        "当相互牵扯的力量被赋予同一方向，行动才会形成势能。"
      ),
      caution: localize(
        "Speed and willpower cannot compensate for a destination you have not chosen.",
        "La vitesse et la volonté ne remplacent pas une destination encore indécise.",
        "速度和意志力无法弥补一个尚未选定的目的地。"
      ),
      action: localize(
        "Choose one destination for the next seven days and say no to one competing pull.",
        "Choisissez une destination pour les sept prochains jours et refusez une sollicitation concurrente.",
        "为接下来七天选定一个方向，并拒绝一项与之争夺精力的事。"
      ),
      energyTags: ["MOVE", "PROTECT"]
    },
    {
      id: "TAROT_08", number: 8, roman: "VIII", key: "STRENGTH", glyph: "∞",
      name: localize("Strength", "La Force", "力量"),
      principle: localize(
        "Lasting courage works with instinct through patience rather than overpowering it.",
        "Le courage durable apprivoise l’instinct avec patience au lieu de le dominer.",
        "持久的勇气会以耐心与本能合作，而不是强行压制它。"
      ),
      caution: localize(
        "Suppression can look composed while quietly increasing the pressure beneath it.",
        "La répression peut sembler calme tout en augmentant silencieusement la pression.",
        "压抑看似平静，却可能让内在压力悄悄增加。"
      ),
      action: localize(
        "Approach the hardest part with a smaller voice, a slower pace and one steady repetition.",
        "Abordez la difficulté avec une voix plus douce, un rythme plus lent et un geste répété.",
        "用更柔和的语气、更慢的节奏和一次稳定重复接近最难的部分。"
      ),
      energyTags: ["GROUND", "MOVE"]
    },
    {
      id: "TAROT_09", number: 9, roman: "IX", key: "HERMIT", glyph: "✧",
      name: localize("The Hermit", "L’Ermite", "隐者"),
      principle: localize(
        "Deliberate solitude makes room for an answer that cannot be heard in constant exchange.",
        "Une solitude choisie ouvre la place à une réponse inaudible dans l’échange constant.",
        "主动选择独处，能让持续交流中听不见的答案浮现。"
      ),
      caution: localize(
        "Reflection becomes avoidance when it never returns to contact or action.",
        "La réflexion devient évitement lorsqu’elle ne revient jamais au lien ni à l’action.",
        "如果思考始终不回到联系或行动，它就会变成逃避。"
      ),
      action: localize(
        "Create a short interval alone, then return with one sentence you are ready to stand behind.",
        "Accordez-vous un bref temps seul, puis revenez avec une phrase que vous êtes prêt à assumer.",
        "给自己一小段独处时间，然后带着一句愿意负责的话回到现实。"
      ),
      energyTags: ["REST", "CLEAR"]
    },
    {
      id: "TAROT_10", number: 10, roman: "X", key: "WHEEL_OF_FORTUNE", glyph: "⟳",
      name: localize("Wheel of Fortune", "La Roue de Fortune", "命运之轮"),
      principle: localize(
        "Conditions turn; wisdom lies in noticing the cycle and responding at the right scale.",
        "Les conditions tournent ; la sagesse consiste à reconnaître le cycle et à répondre à sa juste mesure.",
        "局势会转动；智慧在于看见周期，并以合适的尺度回应。"
      ),
      caution: localize(
        "Chasing total control—or surrendering all agency—misreads what change is asking of you.",
        "Chercher le contrôle total — ou abandonner toute initiative — méconnaît la demande du changement.",
        "追求完全控制或彻底放弃主动权，都会误读变化的要求。"
      ),
      action: localize(
        "Divide the situation into what you can influence, what you can prepare for and what you must release.",
        "Séparez ce que vous pouvez influencer, ce que vous pouvez préparer et ce que vous devez laisser aller.",
        "把局势分成可以影响、可以准备和必须放下的三部分。"
      ),
      energyTags: ["MOVE", "PROSPER"]
    },
    {
      id: "TAROT_11", number: 11, roman: "XI", key: "JUSTICE", glyph: "⚖",
      name: localize("Justice", "La Justice", "正义"),
      principle: localize(
        "A clear decision considers facts, consequences and the responsibility carried by each person.",
        "Une décision juste considère les faits, les conséquences et la responsabilité de chacun.",
        "清晰的决定会同时看见事实、后果和每个人应承担的责任。"
      ),
      caution: localize(
        "Cold certainty and simple binaries can erase the context needed for a fair response.",
        "Une certitude froide et des oppositions trop simples peuvent effacer le contexte nécessaire à l’équité.",
        "冷硬的确定感和简单二分，可能抹去公平判断所需的背景。"
      ),
      action: localize(
        "Write three lines: the fact, its impact and the fairest repair you can actually make.",
        "Écrivez trois lignes : le fait, son impact et la réparation la plus juste que vous puissiez réellement offrir.",
        "写三行：事实、它造成的影响，以及你确实能做出的最公平修复。"
      ),
      energyTags: ["CLEAR", "PROTECT"]
    },
    {
      id: "TAROT_12", number: 12, roman: "XII", key: "HANGED_MAN", glyph: "⟂",
      name: localize("The Hanged Man", "Le Pendu", "倒吊人"),
      principle: localize(
        "A chosen suspension can loosen an old viewpoint and let another meaning appear.",
        "Une suspension choisie peut desserrer un ancien point de vue et laisser apparaître un autre sens.",
        "主动暂停，会松开旧有视角，让另一层意义出现。"
      ),
      caution: localize(
        "Waiting without a purpose can become self-sacrifice or delay disguised as insight.",
        "Attendre sans intention peut devenir sacrifice de soi ou retard déguisé en lucidité.",
        "没有目的的等待，可能变成自我牺牲，或披着洞见外衣的拖延。"
      ),
      action: localize(
        "Pause one assumption and describe the question from the opposite point of view.",
        "Suspendez une hypothèse et décrivez la question depuis le point de vue opposé.",
        "暂时放下一个假设，从相反立场重新描述这个问题。"
      ),
      energyTags: ["REST", "OPEN"]
    },
    {
      id: "TAROT_13", number: 13, roman: "XIII", key: "DEATH", glyph: "✣",
      name: localize("Death", "La Mort", "死神"),
      principle: localize(
        "An honest ending frees attention and material for the form that follows.",
        "Une fin assumée libère l’attention et la matière nécessaires à la forme suivante.",
        "诚实地结束，会释放注意力和资源，为下一种形态腾出空间。"
      ),
      caution: localize(
        "Clinging prolongs what is complete; dramatic rupture can destroy what still deserves care.",
        "S’agripper prolonge ce qui est achevé ; une rupture brutale peut détruire ce qui mérite encore soin.",
        "抓住已经完成的事会拖长消耗；过度决裂也可能毁掉仍值得珍惜的部分。"
      ),
      action: localize(
        "Name what is over, preserve what remains useful and remove one object or obligation tied to the old form.",
        "Nommez ce qui est fini, gardez ce qui reste utile et retirez un objet ou une obligation lié à l’ancienne forme.",
        "说清什么已经结束，保留仍有用的部分，并移走一个属于旧阶段的物件或责任。"
      ),
      energyTags: ["MOVE", "REST"]
    },
    {
      id: "TAROT_14", number: 14, roman: "XIV", key: "TEMPERANCE", glyph: "≋",
      name: localize("Temperance", "Tempérance", "节制"),
      principle: localize(
        "A workable rhythm appears when different needs are combined in the right proportion.",
        "Un rythme viable apparaît lorsque des besoins différents sont réunis dans une juste proportion.",
        "不同需要以恰当比例结合时，才会出现可持续的节奏。"
      ),
      caution: localize(
        "Compromise that removes every distinct quality produces dilution, not integration.",
        "Un compromis qui efface toute différence produit de la dilution, non de l’intégration.",
        "抹去所有差异的妥协只是稀释，并不是真正整合。"
      ),
      action: localize(
        "Combine two competing needs in one modest routine you can repeat this week.",
        "Réunissez deux besoins concurrents dans une routine modeste que vous pourrez répéter cette semaine.",
        "把两个相互竞争的需要放进一个本周可以重复的小习惯里。"
      ),
      energyTags: ["GROUND", "OPEN"]
    },
    {
      id: "TAROT_15", number: 15, roman: "XV", key: "DEVIL", glyph: "⌁",
      name: localize("The Devil", "Le Diable", "恶魔"),
      principle: localize(
        "Naming an attachment clearly restores choice where a habit has begun to feel inevitable.",
        "Nommer clairement un attachement rend du choix là où une habitude semblait inévitable.",
        "清楚说出一项依附，会让看似不可避免的惯性重新出现选择。"
      ),
      caution: localize(
        "Shame hides the mechanism; denial lets the pattern continue without examination.",
        "La honte cache le mécanisme ; le déni laisse le schéma se poursuivre sans examen.",
        "羞耻会遮住机制，否认则让模式不受检视地继续。"
      ),
      action: localize(
        "Identify the repeating loop and add one practical point of friction before its next step.",
        "Repérez la boucle répétitive et ajoutez un obstacle concret avant sa prochaine étape.",
        "找出重复循环，并在它的下一步发生前加入一个现实阻力。"
      ),
      energyTags: ["PROTECT", "CLEAR"]
    },
    {
      id: "TAROT_16", number: 16, roman: "XVI", key: "TOWER", glyph: "ϟ",
      name: localize("The Tower", "La Maison Dieu", "高塔"),
      principle: localize(
        "Disruption exposes a weak foundation and makes a more truthful structure possible.",
        "La rupture révèle une fondation fragile et rend possible une structure plus vraie.",
        "突变会暴露脆弱地基，也使更真实的结构成为可能。"
      ),
      caution: localize(
        "Panic can mistake one failed structure for the collapse of everything.",
        "La panique peut confondre l’échec d’une structure avec l’effondrement de tout.",
        "恐慌容易把一个结构的失效误认为一切都已崩塌。"
      ),
      action: localize(
        "Secure what is essential, state the newly visible truth and postpone nonessential decisions.",
        "Mettez l’essentiel en sécurité, formulez la vérité devenue visible et différez les décisions secondaires.",
        "先保护最重要的部分，说出已经显现的事实，并推迟非必要决定。"
      ),
      energyTags: ["PROTECT", "MOVE"]
    },
    {
      id: "TAROT_17", number: 17, roman: "XVII", key: "STAR", glyph: "☆",
      name: localize("The Star", "L’Étoile", "星星"),
      principle: localize(
        "Renewal begins when hope is made honest, simple and connected to replenishment.",
        "Le renouveau commence lorsque l’espoir devient honnête, simple et relié au ressourcement.",
        "当希望变得诚实、简单，并与恢复相连，更新便开始了。"
      ),
      caution: localize(
        "Inspiration fades when it is admired from a distance but never tended in daily life.",
        "L’inspiration s’éteint lorsqu’on la contemple de loin sans jamais la nourrir au quotidien.",
        "若只远远欣赏灵感，却不在日常中照料它，灵感便会消散。"
      ),
      action: localize(
        "Do one replenishing act, then give ten focused minutes to the future you want to support.",
        "Faites un geste qui vous ressource, puis consacrez dix minutes au futur que vous souhaitez soutenir.",
        "先做一件让自己恢复的事，再为想支持的未来投入十分钟专注行动。"
      ),
      energyTags: ["OPEN", "REST"]
    },
    {
      id: "TAROT_18", number: 18, roman: "XVIII", key: "MOON", glyph: "☽",
      name: localize("The Moon", "La Lune", "月亮"),
      principle: localize(
        "Ambiguity asks for sensitivity: feelings carry information, but not every image is a fact.",
        "L’ambiguïté demande de la sensibilité : les émotions informent, mais toute image n’est pas un fait.",
        "模糊需要敏感地对待：感受会提供信息，但并非每个想象都是事实。"
      ),
      caution: localize(
        "Fear can fill missing information with a story that feels more certain than it is.",
        "La peur peut combler les informations manquantes par un récit plus certain qu’il ne l’est.",
        "恐惧会用故事填补缺失信息，并让它显得比实际更确定。"
      ),
      action: localize(
        "Make three columns—facts, feelings and unknowns—before drawing a conclusion.",
        "Tracez trois colonnes — faits, émotions et inconnues — avant de conclure.",
        "在下结论前，先分三栏写下事实、感受与未知。"
      ),
      energyTags: ["REST", "CLEAR"]
    },
    {
      id: "TAROT_19", number: 19, roman: "XIX", key: "SUN", glyph: "☉",
      name: localize("The Sun", "Le Soleil", "太阳"),
      principle: localize(
        "Visibility, warmth and shared confidence allow what is healthy to grow in the open.",
        "La visibilité, la chaleur et une confiance partagée permettent à ce qui est sain de grandir au grand jour.",
        "可见、温暖与共享的信心，会让健康的事物在阳光下成长。"
      ),
      caution: localize(
        "Brightness can become overexposure or forced optimism that leaves difficulty unheard.",
        "La lumière peut devenir surexposition ou optimisme forcé, laissant la difficulté sans voix.",
        "明亮也可能变成过度曝光或强迫乐观，让困难无法被听见。"
      ),
      action: localize(
        "Share one clear success or idea with the person who can help it meet reality.",
        "Partagez une réussite ou une idée claire avec la personne qui peut l’aider à rencontrer le réel.",
        "把一个明确的成果或想法分享给能帮助它进入现实的人。"
      ),
      energyTags: ["PROSPER", "CREATE"]
    },
    {
      id: "TAROT_20", number: 20, roman: "XX", key: "JUDGEMENT", glyph: "◇",
      name: localize("Judgement", "Le Jugement", "审判"),
      principle: localize(
        "A candid review can release an old account and clarify the call you are ready to answer.",
        "Un bilan sincère peut clore un ancien compte et clarifier l’appel auquel vous êtes prêt à répondre.",
        "坦诚回顾能结清旧账，也会澄清你准备回应的召唤。"
      ),
      caution: localize(
        "Accountability is not self-condemnation; endless judgment keeps the past in charge.",
        "La responsabilité n’est pas la condamnation de soi ; juger sans fin laisse le passé gouverner.",
        "负责不等于自我定罪；无休止的评判会让过去继续掌权。"
      ),
      action: localize(
        "Review what happened, name the lesson and answer with one decision that belongs to the present.",
        "Revoyez ce qui s’est passé, nommez la leçon et répondez par une décision qui appartient au présent.",
        "回顾发生了什么，说出所得的教训，再做一个属于当下的决定。"
      ),
      energyTags: ["CLEAR", "MOVE"]
    },
    {
      id: "TAROT_21", number: 21, roman: "XXI", key: "WORLD", glyph: "◎",
      name: localize("The World", "Le Monde", "世界"),
      principle: localize(
        "Completion gathers the separate parts into a whole and creates a threshold for what follows.",
        "L’accomplissement rassemble les parties en un tout et ouvre le seuil de ce qui suit.",
        "完成会把分散的部分整合为整体，也为下一阶段打开门槛。"
      ),
      caution: localize(
        "Endless polishing can prevent completion; rushing onward can erase what deserves recognition.",
        "Peaufiner sans fin empêche d’achever ; repartir trop vite efface ce qui mérite reconnaissance.",
        "无尽打磨会阻碍完成，匆忙向前又会抹去值得被看见的成果。"
      ),
      action: localize(
        "Close one open loop, mark what was learned and choose where the completed work will now live.",
        "Fermez une boucle, marquez l’apprentissage et choisissez où le travail achevé prendra désormais place.",
        "结束一个未闭合事项，记录所得，并决定完成的成果接下来放在哪里。"
      ),
      energyTags: ["PROSPER", "GROUND"]
    }
  ];

  const TAROT_MAJOR = TAROT_MAJOR_SOURCE.map((card) => Object.freeze({
    ...card,
    // Explicit semantic aliases keep the data convenient for both UI copy and AI payloads.
    meaning: card.principle,
    shadow: card.caution,
    actionCue: card.action,
    supportsReversal: false
  }));

  // Patterns and line arrays are written from the bottom line to the top line.
  const TRIGRAM_ORDER = Object.freeze(["QIAN", "DUI", "LI", "ZHEN", "XUN", "KAN", "GEN", "KUN"]);
  const TRIGRAMS = Object.freeze({
    QIAN: Object.freeze({ key: "QIAN", pattern: "111", lines: Object.freeze([1, 1, 1]), symbol: "☰", name: localize("Heaven", "Ciel", "乾 · 天") }),
    DUI: Object.freeze({ key: "DUI", pattern: "110", lines: Object.freeze([1, 1, 0]), symbol: "☱", name: localize("Lake", "Lac", "兑 · 泽") }),
    LI: Object.freeze({ key: "LI", pattern: "101", lines: Object.freeze([1, 0, 1]), symbol: "☲", name: localize("Fire", "Feu", "离 · 火") }),
    ZHEN: Object.freeze({ key: "ZHEN", pattern: "100", lines: Object.freeze([1, 0, 0]), symbol: "☳", name: localize("Thunder", "Tonnerre", "震 · 雷") }),
    XUN: Object.freeze({ key: "XUN", pattern: "011", lines: Object.freeze([0, 1, 1]), symbol: "☴", name: localize("Wind", "Vent", "巽 · 风") }),
    KAN: Object.freeze({ key: "KAN", pattern: "010", lines: Object.freeze([0, 1, 0]), symbol: "☵", name: localize("Water", "Eau", "坎 · 水") }),
    GEN: Object.freeze({ key: "GEN", pattern: "001", lines: Object.freeze([0, 0, 1]), symbol: "☶", name: localize("Mountain", "Montagne", "艮 · 山") }),
    KUN: Object.freeze({ key: "KUN", pattern: "000", lines: Object.freeze([0, 0, 0]), symbol: "☷", name: localize("Earth", "Terre", "坤 · 地") })
  });

  // Rows are upper trigrams, columns are lower trigrams, both in TRIGRAM_ORDER.
  const KING_WEN_MATRIX = Object.freeze([
    Object.freeze([1, 10, 13, 25, 44, 6, 33, 12]),
    Object.freeze([43, 58, 49, 17, 28, 47, 31, 45]),
    Object.freeze([14, 38, 30, 21, 50, 64, 56, 35]),
    Object.freeze([34, 54, 55, 51, 32, 40, 62, 16]),
    Object.freeze([9, 61, 37, 42, 57, 59, 53, 20]),
    Object.freeze([5, 60, 63, 3, 48, 29, 39, 8]),
    Object.freeze([26, 41, 22, 27, 18, 4, 52, 23]),
    Object.freeze([11, 19, 36, 24, 46, 7, 15, 2])
  ]);

  const h = (number, key, name, principle, caution, action, energyTags) => {
    const meaning = localize(...principle);
    const shadow = localize(...caution);
    const actionCue = localize(...action);
    return Object.freeze({
      id: `HEXAGRAM_${number}`,
      number,
      key,
      name: localize(...name),
      principle: meaning,
      meaning,
      caution: shadow,
      shadow,
      action: actionCue,
      actionCue,
      energyTags: Object.freeze(energyTags)
    });
  };

  const HEXAGRAMS = [
    // Entries are ordered by King Wen number. The short guidance is original MARÉVYS copy,
    // not a reproduction of any modern translation.
    h(1, "CREATIVE",
      ["The Creative", "Le Créatif", "乾 · 乾为天"],
      ["Sustained initiative can turn a clear purpose into form.", "Une initiative soutenue peut donner forme à un but clair.", "持续而清醒的主动性能让明确意图逐渐成形。"],
      ["Force used without timing or integrity quickly exhausts itself.", "La force privée de justesse ou de rythme s’épuise vite.", "缺少时机与原则的用力，很快就会耗尽自身。"],
      ["Choose the first move you can fully own and give it a time today.", "Choisissez le premier geste que vous pouvez pleinement assumer et fixez-lui une heure aujourd’hui.", "选一个你能完全负责的第一步，并把它安排在今天。"],
      ["CREATE", "MOVE"]),
    h(2, "RECEPTIVE",
      ["The Receptive", "Le Réceptif", "坤 · 坤为地"],
      ["Progress comes through responsive support, patience and conditions that can carry growth.", "Le progrès vient d’un soutien attentif, de la patience et d’un terrain capable de porter la croissance.", "回应、耐心与承载成长的条件，会让事情自然推进。"],
      ["Receptivity is not passive surrender or the erasure of your own needs.", "La réceptivité n’est ni soumission passive ni effacement de vos besoins.", "接纳并不等于被动服从，也不意味着抹去自己的需要。"],
      ["Prepare one practical condition and offer the kind of support the situation actually needs.", "Préparez une condition concrète et offrez le soutien dont la situation a réellement besoin.", "准备一个实际条件，并给予当前情况真正需要的支持。"],
      ["GROUND", "OPEN"]),
    h(3, "INITIAL_DIFFICULTY",
      ["Difficulty at the Beginning", "Difficulté initiale", "屯 · 水雷屯"],
      ["Early disorder is part of forming a new structure; patient orientation matters more than speed.", "Le désordre initial appartient à la formation d’une nouvelle structure ; s’orienter compte plus que la vitesse.", "初始的混乱是新结构形成的一部分，此时辨明方向比速度更重要。"],
      ["Trying to solve every complication at once multiplies confusion.", "Vouloir résoudre toutes les complications à la fois multiplie la confusion.", "试图一次解决所有困难，只会放大混乱。"],
      ["Name the first obstacle, find one capable ally and work only on the next foothold.", "Nommez le premier obstacle, trouvez un allié compétent et ne travaillez que le prochain point d’appui.", "指出第一个障碍，找到一位可靠协助者，只处理下一个落点。"],
      ["GROUND", "MOVE"]),
    h(4, "YOUTHFUL_FOLLY",
      ["Youthful Folly", "Inexpérience", "蒙 · 山水蒙"],
      ["Not knowing can become a disciplined beginning when the question is sincere.", "Ne pas savoir devient un commencement fécond lorsque la question est sincère et disciplinée.", "承认不知道，并提出真诚的问题，本身就是有纪律的开始。"],
      ["Repeated guessing—or handing all authority to a teacher—prevents learning.", "Deviner sans cesse — ou céder toute autorité à un guide — empêche d’apprendre.", "反复猜测，或把全部判断交给老师，都会阻碍学习。"],
      ["Formulate one precise question, seek one grounded answer and test it in practice.", "Formulez une question précise, cherchez une réponse solide et vérifiez-la par la pratique.", "提出一个准确问题，寻找一个可靠答案，再用实践验证。"],
      ["OPEN", "CLEAR"]),
    h(5, "WAITING",
      ["Waiting", "Attente", "需 · 水天需"],
      ["A necessary pause becomes useful when it is filled with preparation and trust in timing.", "Une pause nécessaire devient utile lorsqu’elle est habitée par la préparation et la confiance dans le rythme.", "必要的等待若用于准备，并尊重时机，就会产生价值。"],
      ["Anxiety may provoke premature intervention or endless postponement.", "L’anxiété peut provoquer une intervention prématurée ou un report sans fin.", "焦虑可能催生过早干预，也可能让拖延无限延长。"],
      ["Gather the missing facts and resources, then set the moment when you will reassess.", "Rassemblez les faits et ressources manquants, puis fixez le moment de réévaluer.", "补齐缺失的事实与资源，并设定重新评估的时间。"],
      ["REST", "GROUND"]),
    h(6, "CONFLICT",
      ["Conflict", "Conflit", "讼 · 天水讼"],
      ["Disagreement asks for clear terms, evidence and an outcome proportionate to the issue.", "Le désaccord demande des termes clairs, des faits et une issue proportionnée au problème.", "分歧需要清楚的边界、事实依据，以及与问题相称的处理方式。"],
      ["Winning the argument can cost more than the matter itself.", "Gagner l’argument peut coûter davantage que l’enjeu lui-même.", "赢下争论，可能付出比争议本身更大的代价。"],
      ["State the disagreement, one shared fact and the condition under which you will stop escalating.", "Formulez le désaccord, un fait partagé et la condition qui mettra fin à l’escalade.", "说清分歧、一个双方承认的事实，以及停止升级的条件。"],
      ["CLEAR", "PROTECT"]),
    h(7, "ARMY",
      ["The Army", "L’Armée", "师 · 地水师"],
      ["Collective force works when purpose, roles and discipline are explicit.", "La force collective agit lorsque le but, les rôles et la discipline sont explicites.", "集体力量只有在目标、角色与纪律清楚时才有效。"],
      ["Mobilizing people without a legitimate aim creates disorder and resentment.", "Mobiliser sans but légitime crée désordre et ressentiment.", "缺少正当目标的动员会制造混乱与怨气。"],
      ["Define the objective, assign each role and agree on the rule for stopping.", "Définissez l’objectif, attribuez les rôles et convenez d’une règle d’arrêt.", "明确目标、分配角色，并共同约定停止行动的规则。"],
      ["PROTECT", "GROUND"]),
    h(8, "UNION",
      ["Holding Together", "Union", "比 · 水地比"],
      ["Trust grows around a center that people can recognize and support freely.", "La confiance grandit autour d’un centre que chacun peut reconnaître et soutenir librement.", "信任会围绕一个大家都能认同并自愿支持的核心生长。"],
      ["Belonging without shared standards can become dependence or exclusion.", "L’appartenance sans critères partagés peut devenir dépendance ou exclusion.", "没有共同标准的归属感，容易变成依赖或排斥。"],
      ["Choose the bond that shows reciprocal contribution and make your part visible.", "Choisissez le lien où la contribution est réciproque et rendez votre part visible.", "选择有相互投入的关系，并让自己的贡献变得可见。"],
      ["OPEN", "GROUND"]),
    h(9, "SMALL_TAMING",
      ["Small Taming", "Petite retenue", "小畜 · 风天小畜"],
      ["Small acts of restraint and refinement can gather enough strength for later movement.", "De petits gestes de retenue et d’ajustement peuvent rassembler la force d’un mouvement futur.", "细小的克制与修正，会为之后的推进积累力量。"],
      ["Preparation becomes avoidance when no condition for action is ever named.", "La préparation devient évitement si aucune condition d’action n’est jamais nommée.", "如果始终不说明何时行动，准备就会变成逃避。"],
      ["Make one minor correction and schedule the point at which you will decide to proceed.", "Faites une correction mineure et fixez le moment où vous déciderez d’avancer.", "先做一个小修正，并设定决定是否前进的时间点。"],
      ["PROSPER", "GROUND"]),
    h(10, "TREADING",
      ["Treading", "Conduite", "履 · 天泽履"],
      ["Careful conduct lets you move near power or risk without losing your footing.", "Une conduite attentive permet d’approcher le pouvoir ou le risque sans perdre pied.", "谨慎得体的行动，让你靠近权力或风险时仍能站稳。"],
      ["Confidence without awareness of context can cross a boundary you did not see.", "La confiance sans lecture du contexte peut franchir une limite invisible.", "若自信缺少对情境的觉察，可能在不知不觉中越界。"],
      ["Take the next step with the relevant protocol, boundary and consequence clearly in mind.", "Faites le prochain pas en gardant clairement à l’esprit le protocole, la limite et la conséquence.", "采取下一步时，把相关规则、边界与后果都放在眼前。"],
      ["PROTECT", "CLEAR"]),
    h(11, "PEACE",
      ["Peace", "Paix", "泰 · 地天泰"],
      ["Open exchange between different levels creates a fertile period of connection and progress.", "Un échange ouvert entre différents niveaux crée une période fertile de lien et de progrès.", "不同层面之间的顺畅交流，会带来适合连接与发展的阶段。"],
      ["A favorable flow still needs maintenance; comfort can hide early neglect.", "Un courant favorable demande encore de l’entretien ; le confort peut cacher les premiers signes de négligence.", "顺畅仍需维护，安逸可能遮住最初的疏忽。"],
      ["Use this open window to strengthen one relationship or process before it is tested.", "Profitez de cette ouverture pour renforcer un lien ou un processus avant qu’il ne soit mis à l’épreuve.", "趁窗口打开时，先加固一段关系或一个流程。"],
      ["PROSPER", "OPEN"]),
    h(12, "STANDSTILL",
      ["Standstill", "Stagnation", "否 · 天地否"],
      ["When exchange is blocked, preserving integrity and resources is itself meaningful work.", "Lorsque l’échange est bloqué, préserver son intégrité et ses ressources est déjà un travail essentiel.", "交流受阻时，守住原则与资源，本身就是有意义的行动。"],
      ["Pushing the same closed channel harder can deepen separation.", "Forcer davantage le même canal fermé peut aggraver la séparation.", "对同一条关闭的通道继续用力，只会加深隔离。"],
      ["Stop one unproductive exchange, protect what matters and look for a different route.", "Arrêtez un échange stérile, protégez l’essentiel et cherchez une autre voie.", "停止一项无效交流，保护重要部分，并寻找另一条路径。"],
      ["PROTECT", "REST"]),
    h(13, "FELLOWSHIP",
      ["Fellowship", "Communauté", "同人 · 天火同人"],
      ["People can cooperate deeply when a shared purpose is visible beyond private interests.", "Une coopération profonde devient possible lorsqu’un but commun dépasse les intérêts privés.", "当共同目标超越个人利益并清晰可见，人们便能深入协作。"],
      ["Similarity alone can form a closed circle rather than a true community.", "La simple ressemblance peut former un cercle fermé plutôt qu’une véritable communauté.", "仅凭相似性聚集，容易形成封闭圈子，而非真正共同体。"],
      ["State the common purpose in public language and invite one relevant difference into the work.", "Formulez le but commun dans un langage ouvert et invitez une différence pertinente dans le travail.", "用公开清楚的语言说明共同目标，并邀请一种相关的不同视角加入。"],
      ["OPEN", "CREATE"]),
    h(14, "GREAT_POSSESSION",
      ["Great Possession", "Grande possession", "大有 · 火天大有"],
      ["Abundance becomes valuable through stewardship, circulation and a purpose larger than ownership.", "L’abondance prend de la valeur par l’intendance, la circulation et un but plus grand que la possession.", "丰盛只有通过妥善管理、流动和超越占有的目的，才真正有价值。"],
      ["Resources become a burden when possession is confused with identity or entitlement.", "Les ressources deviennent un poids lorsque la possession se confond avec l’identité ou le droit acquis.", "把拥有等同于身份或特权，资源就会变成负担。"],
      ["Allocate one available resource where it can create durable benefit beyond yourself.", "Affectez une ressource disponible là où elle créera un bénéfice durable au-delà de vous-même.", "把一项已有资源投入到能产生长期且超越个人收益的地方。"],
      ["PROSPER", "CREATE"]),
    h(15, "MODESTY",
      ["Modesty", "Modestie", "谦 · 地山谦"],
      ["Accurate self-measurement makes contribution steady and leaves room for others.", "Une juste mesure de soi rend la contribution stable et laisse de la place aux autres.", "准确衡量自己，既能稳定贡献，也能给他人留下空间。"],
      ["Making yourself smaller to be accepted is not humility.", "Se diminuer pour être accepté n’est pas de l’humilité.", "为了被接受而缩小自己，并不是真正的谦逊。"],
      ["State your capacity plainly, share the credit and take the responsibility that is genuinely yours.", "Énoncez sobrement votre capacité, partagez le mérite et prenez la responsabilité qui vous revient vraiment.", "如实说明能力，分享功劳，并承担真正属于你的责任。"],
      ["GROUND", "OPEN"]),
    h(16, "ENTHUSIASM",
      ["Enthusiasm", "Enthousiasme", "豫 · 雷地豫"],
      ["Shared energy can mobilize people when feeling is given rhythm, structure and direction.", "Une énergie partagée mobilise lorsqu’elle reçoit rythme, structure et direction.", "共同的热情一旦有了节奏、结构与方向，就能带动行动。"],
      ["Excitement without a plan spends tomorrow’s energy today.", "L’enthousiasme sans plan dépense aujourd’hui l’énergie de demain.", "没有计划的兴奋，会提前消耗明天的能量。"],
      ["Turn the emotion into a date, a role and one visible preparation.", "Transformez l’émotion en une date, un rôle et une préparation visible.", "把热情变成一个日期、一个角色和一项可见准备。"],
      ["MOVE", "CREATE"]),
    h(17, "FOLLOWING",
      ["Following", "Suivre", "随 · 泽雷随"],
      ["Responsive following can align you with a sound movement already underway.", "Suivre avec discernement peut vous accorder à un mouvement juste déjà engagé.", "有判断地顺势而行，能让你与已经发生的良性趋势对齐。"],
      ["Following the loudest voice can quietly surrender your own judgment.", "Suivre la voix la plus forte peut abandonner silencieusement votre propre jugement.", "追随最响亮的声音，可能悄悄交出自己的判断。"],
      ["Choose what has earned your trust, follow it for one interval and keep a clear review point.", "Choisissez ce qui a mérité votre confiance, suivez-le pour un temps défini et gardez un point de révision.", "选择已经赢得信任的方向，在限定周期内跟随，并保留明确复盘点。"],
      ["OPEN", "MOVE"]),
    h(18, "REPAIR_DECAY",
      ["Repairing Decay", "Réparer le déclin", "蛊 · 山风蛊"],
      ["An inherited or neglected pattern can be repaired once its source is examined honestly.", "Un schéma hérité ou négligé peut être réparé lorsque sa source est examinée avec honnêteté.", "遗留或被忽视的模式，只要诚实追溯源头，就有修复可能。"],
      ["Blame keeps attention on the past while the mechanism continues unchanged.", "Le blâme maintient l’attention sur le passé tandis que le mécanisme reste intact.", "指责会把注意力困在过去，而问题机制仍原样运转。"],
      ["Trace the fault to its earliest repeatable cause, repair it and add one maintenance rule.", "Remontez jusqu’à la première cause répétable, réparez-la et ajoutez une règle d’entretien.", "追溯到最早可重复的成因，完成修复，并增加一条维护规则。"],
      ["CLEAR", "CREATE"]),
    h(19, "APPROACH",
      ["Approach", "Approche", "临 · 地泽临"],
      ["Drawing near with attention and responsibility lets influence become supportive rather than remote.", "S’approcher avec attention et responsabilité rend l’influence soutenante plutôt que distante.", "带着关注与责任靠近，影响力才会从遥远指令变成真实支持。"],
      ["Warmth without preparation may promise more support than you can sustain.", "La chaleur sans préparation peut promettre davantage de soutien que vous ne pourrez tenir.", "缺少准备的热情，可能承诺超出持续能力的支持。"],
      ["Move closer to the people affected, ask one direct question and make one support concrete.", "Rapprochez-vous des personnes concernées, posez une question directe et rendez un soutien concret.", "靠近受到影响的人，问一个直接问题，并把一项支持落实。"],
      ["OPEN", "PROSPER"]),
    h(20, "CONTEMPLATION",
      ["Contemplation", "Contemplation", "观 · 风地观"],
      ["A wider view reveals the pattern created by many small actions.", "Une vue plus large révèle le motif formé par de nombreux petits gestes.", "拉开距离观看，会显出许多小行动共同形成的模式。"],
      ["Observation without participation can become distance without responsibility.", "Observer sans participer peut devenir une distance sans responsabilité.", "只观察而不参与，可能变成没有责任的疏离。"],
      ["Step back, map the repeating pattern and choose one behavior that would alter it.", "Prenez du recul, cartographiez le motif récurrent et choisissez un comportement capable de le modifier.", "退后一步画出重复模式，再选择一个能改变它的行为。"],
      ["CLEAR", "REST"]),
    h(21, "BITING_THROUGH",
      ["Biting Through", "Mordre au travers", "噬嗑 · 火雷噬嗑"],
      ["A defined obstruction may require a direct, fair and proportionate response.", "Un obstacle clairement défini peut demander une réponse directe, juste et proportionnée.", "明确的阻碍可能需要直接、公平且适度的处理。"],
      ["Punishment without evidence or measure creates a new injustice.", "Une sanction sans preuve ni mesure crée une nouvelle injustice.", "没有证据与分寸的惩罚，会制造新的不公。"],
      ["Identify the breach, verify the evidence and apply the smallest consequence that restores function.", "Identifiez le manquement, vérifiez les faits et appliquez la conséquence minimale qui rétablit le fonctionnement.", "确认违规点、核实证据，并采取能恢复秩序的最小必要后果。"],
      ["CLEAR", "PROTECT"]),
    h(22, "GRACE",
      ["Grace", "Grâce", "贲 · 山火贲"],
      ["Thoughtful form can make real substance easier to perceive and receive.", "Une forme soignée peut rendre la substance plus facile à percevoir et à recevoir.", "用心的形式能让真实内容更容易被看见和接受。"],
      ["Appearance becomes a screen when it is asked to replace the substance beneath it.", "L’apparence devient un écran lorsqu’elle remplace la substance qu’elle devrait révéler.", "当形式被用来替代内容，它就会变成遮挡。"],
      ["Remove one decorative distraction and let the central value become more visible.", "Retirez une distraction décorative et rendez la valeur centrale plus visible.", "去掉一项分散注意的装饰，让核心价值更加清楚。"],
      ["CREATE", "CLEAR"]),
    h(23, "SPLITTING_APART",
      ["Splitting Apart", "Éclatement", "剥 · 山地剥"],
      ["When support is failing, subtraction protects the foundation that can still endure.", "Lorsque les appuis cèdent, soustraire protège la fondation qui peut encore tenir.", "支撑正在失效时，做减法能够保护仍可持续的根基。"],
      ["Rebuilding too early adds weight to what has not finished falling away.", "Reconstruire trop tôt ajoute du poids à ce qui n’a pas fini de tomber.", "过早重建，会给尚未脱落完的结构继续增加负担。"],
      ["Stop adding load, let one weak layer go and identify the foundation worth keeping.", "Cessez d’ajouter du poids, laissez partir une couche fragile et identifiez la base à conserver.", "停止增加负荷，让一层脆弱结构离开，并认出值得保留的基础。"],
      ["REST", "PROTECT"]),
    h(24, "RETURN",
      ["Return", "Retour", "复 · 地雷复"],
      ["A quiet return to the right direction matters more than a dramatic promise of change.", "Un retour discret vers la bonne direction compte davantage qu’une promesse spectaculaire de changement.", "安静地回到正确方向，比戏剧性的改变承诺更重要。"],
      ["Waiting for perfect motivation can delay the return that is already available.", "Attendre une motivation parfaite peut retarder un retour déjà possible.", "等待完美动力，会推迟此刻已经可以发生的回归。"],
      ["Resume the smallest version of the practice or commitment that still feels true.", "Reprenez la plus petite version de la pratique ou de l’engagement qui reste juste.", "重新开始那个仍然真实的习惯或承诺，并采用它最小的可行版本。"],
      ["GROUND", "MOVE"]),
    h(25, "INNOCENCE",
      ["Innocence", "Innocence", "无妄 · 天雷无妄"],
      ["Uncontrived action is powerful when intention is clean and conditions are honestly seen.", "Une action sans artifice est forte lorsque l’intention est claire et les conditions regardées honnêtement.", "意图清白、条件看得真实，朴素直接的行动便有力量。"],
      ["Spontaneity is not permission to ignore evidence, impact or preparation.", "La spontanéité n’autorise pas à ignorer les faits, l’impact ou la préparation.", "自然行动并不意味着可以忽视事实、影响与准备。"],
      ["State your intention plainly, verify the conditions and act without adding a hidden agenda.", "Énoncez simplement votre intention, vérifiez les conditions et agissez sans arrière-pensée.", "如实说出意图，核实条件，然后不夹带隐性目的地行动。"],
      ["OPEN", "CLEAR"]),
    h(26, "GREAT_TAMING",
      ["Great Taming", "Grande maîtrise", "大畜 · 山天大畜"],
      ["Stored strength, disciplined learning and restraint prepare capacity for meaningful use.", "La force accumulée, l’apprentissage discipliné et la retenue préparent une capacité réellement utile.", "积蓄力量、有纪律地学习并保持克制，会形成真正可用的能力。"],
      ["Preparation can become hoarding when no condition for release is defined.", "La préparation devient accumulation stérile si aucune condition de mise en œuvre n’est définie.", "如果没有设定投入使用的条件，准备就可能变成囤积。"],
      ["Train one capability, store one essential resource and define when you will put both to work.", "Développez une capacité, conservez une ressource essentielle et définissez quand vous les mettrez en œuvre.", "训练一项能力，储备一项必要资源，并明确何时将两者投入使用。"],
      ["PROSPER", "GROUND"]),
    h(27, "NOURISHMENT",
      ["Nourishment", "Nourriture", "颐 · 山雷颐"],
      ["What you repeatedly take in—and offer outward—shapes the life around the question.", "Ce que vous absorbez et offrez de façon répétée façonne la vie autour de la question.", "你反复摄入与向外给予的内容，正在塑造这个问题周围的生活。"],
      ["Feeding distraction, resentment or empty demand still strengthens something.", "Nourrir la distraction, le ressentiment ou une demande vide renforce malgré tout quelque chose.", "喂养分心、怨气或空洞需求，也是在强化某种东西。"],
      ["Audit one daily input and one repeated output, then replace the less nourishing one.", "Examinez une entrée quotidienne et une sortie répétée, puis remplacez la moins nourrissante.", "检查一项每日输入和一项反复输出，替换其中更无益的一项。"],
      ["GROUND", "PROSPER"]),
    h(28, "GREAT_EXCEEDING",
      ["Great Exceeding", "Grand dépassement", "大过 · 泽风大过"],
      ["An exceptional load calls for an exceptional but deliberate adjustment.", "Une charge exceptionnelle appelle un ajustement exceptionnel mais délibéré.", "非常的负荷，需要非常但有分寸的调整。"],
      ["Acting as if conditions were normal can let the central support fail.", "Faire comme si la situation était normale peut faire céder le soutien central.", "继续把异常情况当作日常处理，可能让核心支撑断裂。"],
      ["Name the overload, reinforce the critical support and remove one nonessential demand now.", "Nommez la surcharge, renforcez l’appui critique et retirez immédiatement une demande secondaire.", "说出超载之处，加固关键支撑，并立即移除一项非必要要求。"],
      ["PROTECT", "MOVE"]),
    h(29, "ABYSS",
      ["The Abysmal", "L’Abîme", "坎 · 坎为水"],
      ["Repeated danger develops skill when each passage follows a tested sequence.", "Le danger répété développe l’habileté lorsque chaque passage suit une séquence éprouvée.", "反复的风险若以经过验证的步骤穿越，会培养真正能力。"],
      ["Familiarity with risk can become numbness, bravado or needless repetition.", "La familiarité avec le risque peut devenir insensibilité, bravade ou répétition inutile.", "熟悉风险可能变成麻木、逞强或无谓重复。"],
      ["Mark the real hazard, use the proven sequence and prepare one backup before entering.", "Identifiez le danger réel, suivez la séquence éprouvée et préparez une solution de secours avant d’entrer.", "标记真实风险，使用可靠步骤，并在进入前准备一个备选方案。"],
      ["PROTECT", "GROUND"]),
    h(30, "RADIANCE",
      ["Clinging Fire", "Feu rayonnant", "离 · 离为火"],
      ["Clarity stays bright when it is attached to worthy material and tended consistently.", "La clarté reste vive lorsqu’elle s’attache à une matière digne et reçoit un soin constant.", "清明依附在值得的载体上，并被持续照料，才能保持光亮。"],
      ["Brightness without fuel becomes burnout; visibility without substance seeks approval.", "La lumière sans combustible devient épuisement ; la visibilité sans substance cherche l’approbation.", "没有燃料的明亮会变成耗竭，没有内容的可见只是在寻求认可。"],
      ["Choose the work or practice that deserves your attention and tend it at a sustainable rhythm.", "Choisissez le travail ou la pratique qui mérite votre attention et nourrissez-le à un rythme durable.", "选择真正值得关注的工作或练习，并以可持续节奏照料它。"],
      ["CLEAR", "CREATE"]),
    h(31, "INFLUENCE",
      ["Influence", "Influence", "咸 · 泽山咸"],
      ["Mutual responsiveness creates influence that neither side needs to force.", "Une réponse mutuelle crée une influence qu’aucun côté n’a besoin de forcer.", "彼此回应会形成无需任何一方强迫的影响力。"],
      ["Subtle influence becomes manipulation when the real request stays hidden.", "L’influence subtile devient manipulation lorsque la véritable demande reste cachée.", "如果真实请求一直被隐藏，细微影响就会变成操控。"],
      ["Make one clear invitation, listen to the response and let it genuinely alter your next move.", "Faites une invitation claire, écoutez la réponse et laissez-la réellement modifier votre prochain geste.", "提出一个清楚邀请，听取回应，并允许它真正改变你的下一步。"],
      ["OPEN", "CREATE"]),
    h(32, "DURATION",
      ["Duration", "Durée", "恒 · 雷风恒"],
      ["Continuity comes from a stable principle expressed through adaptable repetition.", "La continuité vient d’un principe stable exprimé par une répétition adaptable.", "持久来自稳定原则，也来自能够调整的重复方式。"],
      ["Persistence becomes habit without meaning when the method is never reviewed.", "La persistance devient habitude vide lorsque la méthode n’est jamais réexaminée.", "如果方法从不复盘，坚持就可能变成失去意义的惯性。"],
      ["Keep the principle, adjust one method and choose a rhythm you can sustain for a month.", "Gardez le principe, ajustez une méthode et choisissez un rythme tenable pendant un mois.", "保留核心原则，调整一个方法，并选择能持续一个月的节奏。"],
      ["GROUND", "PROSPER"]),
    h(33, "RETREAT",
      ["Retreat", "Retraite", "遁 · 天山遁"],
      ["A deliberate withdrawal can preserve strength, position and freedom for a better moment.", "Un retrait délibéré peut préserver la force, la position et la liberté pour un meilleur moment.", "主动退让能够保存力量、位置与自由，为更合适的时机做准备。"],
      ["Retreat made from shame or panic can abandon what still needs protection.", "Un retrait dicté par la honte ou la panique peut abandonner ce qui doit encore être protégé.", "因羞耻或恐慌而退出，可能丢下仍需保护的部分。"],
      ["Withdraw from one unwinnable exposure, state the boundary and protect the capacity you will need later.", "Retirez-vous d’une exposition ingagnable, énoncez la limite et protégez la capacité nécessaire plus tard.", "退出一项此刻无法取胜的暴露，说明边界，并保护之后需要的能力。"],
      ["PROTECT", "REST"]),
    h(34, "GREAT_POWER",
      ["Great Power", "Grande puissance", "大壮 · 雷天大壮"],
      ["Real power is most convincing when it is directed, proportionate and restrained.", "La véritable puissance convainc lorsqu’elle est dirigée, proportionnée et retenue.", "真正的力量在方向明确、分寸合适并能自我克制时最有说服力。"],
      ["Force used merely to prove itself creates resistance and weakens legitimacy.", "La force employée pour se prouver elle-même crée de la résistance et affaiblit sa légitimité.", "只为证明强大而用力，会制造抵抗并削弱正当性。"],
      ["Use the smallest amount of force that serves a clearly measurable purpose.", "Employez la force minimale qui serve un objectif clairement mesurable.", "只使用能服务于明确可衡量目标的最小必要力量。"],
      ["MOVE", "PROTECT"]),
    h(35, "PROGRESS",
      ["Progress", "Progrès", "晋 · 火地晋"],
      ["Visible progress grows when useful contribution meets recognition and supportive conditions.", "Le progrès visible grandit lorsqu’une contribution utile rencontre reconnaissance et conditions favorables.", "有价值的贡献遇到认可与支持条件时，进展便会清晰可见。"],
      ["Promotion that outruns substance leaves the next level without support.", "Une mise en avant qui dépasse la substance laisse le niveau suivant sans fondation.", "曝光或晋升若超过实际积累，下一阶段就会缺少支撑。"],
      ["Document one real gain and offer the next contribution that can justify further trust.", "Documentez un gain réel et proposez la prochaine contribution capable de justifier davantage de confiance.", "记录一项真实进展，并交付能继续赢得信任的下一项贡献。"],
      ["PROSPER", "MOVE"]),
    h(36, "DARKENING_LIGHT",
      ["Darkening of the Light", "Obscurcissement de la lumière", "明夷 · 地火明夷"],
      ["In an unreceptive setting, inner clarity may need protection rather than display.", "Dans un milieu peu réceptif, la clarté intérieure demande parfois protection plutôt qu’exposition.", "在不接纳真实的环境中，内在清明有时需要保护，而不是展示。"],
      ["Self-protection becomes self-erasure if your own position is no longer remembered.", "La protection de soi devient effacement si votre propre position n’est plus gardée en mémoire.", "自我保护若让你忘记自己的立场，就会变成自我抹除。"],
      ["Keep your position in writing, share only where it is safe and preserve the evidence you may need.", "Gardez votre position par écrit, ne partagez que là où c’est sûr et conservez les éléments nécessaires.", "把立场写下来，只在安全处表达，并保存之后可能需要的证据。"],
      ["PROTECT", "REST"]),
    h(37, "FAMILY",
      ["The Family", "La Famille", "家人 · 风火家人"],
      ["Near relationships become reliable when roles, care and everyday responsibilities are understood.", "Les liens proches deviennent fiables lorsque les rôles, le soin et les responsabilités quotidiennes sont compris.", "亲近关系在角色、照料与日常责任清楚时才会可靠。"],
      ["Tradition cannot justify an unequal burden that no one is allowed to question.", "La tradition ne peut justifier une charge inégale que personne n’a le droit de questionner.", "传统不能成为不平等负担且不许质疑的理由。"],
      ["Make one recurring responsibility explicit and agree on a reciprocal form of support.", "Rendez explicite une responsabilité récurrente et convenez d’un soutien réciproque.", "明确一项反复出现的责任，并约定一种相互支持的方式。"],
      ["GROUND", "OPEN"]),
    h(38, "OPPOSITION",
      ["Opposition", "Opposition", "睽 · 火泽睽"],
      ["Difference can clarify boundaries and reveal the limited purpose that remains shareable.", "La différence clarifie les limites et révèle le but limité qui peut encore être partagé.", "差异能澄清边界，也会显出仍可共同完成的有限目标。"],
      ["Forcing full agreement turns a workable difference into deeper division.", "Forcer un accord total transforme une différence gérable en division plus profonde.", "强求全面一致，会把可处理的不同变成更深分裂。"],
      ["Identify one common task and allow each side a different method for completing it.", "Identifiez une tâche commune et laissez à chaque côté une méthode différente pour l’accomplir.", "找出一项共同任务，并允许双方以不同方式完成。"],
      ["CLEAR", "OPEN"]),
    h(39, "OBSTRUCTION",
      ["Obstruction", "Obstacle", "蹇 · 水山蹇"],
      ["A real obstacle asks for a change of route, perspective or source of support.", "Un obstacle réel demande de changer de route, de perspective ou de source d’appui.", "真实阻碍要求你改变路线、视角或支持来源。"],
      ["Repeated frontal effort can turn resolve into preventable damage.", "L’effort frontal répété peut transformer la détermination en dommage évitable.", "反复正面硬推，会让决心变成原本可以避免的损耗。"],
      ["Name the obstacle precisely, adjust the route and ask one experienced person for help.", "Nommez précisément l’obstacle, ajustez la route et demandez l’aide d’une personne expérimentée.", "准确说出障碍，调整路径，并向一位有经验的人求助。"],
      ["GROUND", "CLEAR"]),
    h(40, "DELIVERANCE",
      ["Deliverance", "Délivrance", "解 · 雷水解"],
      ["Once tension breaks, simple release and prompt cleanup allow movement to return.", "Lorsque la tension cède, une libération simple et un nettoyage rapide rendent le mouvement possible.", "紧张解除后，及时放下并完成收尾，行动便能恢复。"],
      ["Relief without addressing the cause lets the same knot form again.", "Le soulagement sans traitement de la cause laisse le même nœud se reformer.", "只有松一口气却不处理成因，同一个结还会再次形成。"],
      ["Remove the immediate cause, settle one loose end and give the system a short recovery period.", "Retirez la cause immédiate, réglez un point resté ouvert et accordez au système un bref répit.", "移除直接原因，处理一个未完事项，并给整个系统一段短暂恢复期。"],
      ["MOVE", "REST"]),
    h(41, "DECREASE",
      ["Decrease", "Diminution", "损 · 山泽损"],
      ["Intentional subtraction can restore balance and return resources to what matters most.", "Une soustraction intentionnelle peut rétablir l’équilibre et rendre les ressources à l’essentiel.", "有意识地减少，能够恢复平衡，把资源还给最重要的事。"],
      ["Cutting what is essential merely to show discipline weakens the whole.", "Réduire l’essentiel pour afficher de la discipline affaiblit l’ensemble.", "为了显示自律而削减必要部分，会让整体变弱。"],
      ["Remove one measurable drain and observe what important capacity returns.", "Retirez une fuite mesurable et observez quelle capacité importante revient.", "移除一项可衡量的消耗，观察哪种重要能力重新出现。"],
      ["REST", "CLEAR"]),
    h(42, "INCREASE",
      ["Increase", "Augmentation", "益 · 风雷益"],
      ["Well-placed investment expands capacity when benefit can circulate through the whole.", "Un investissement bien placé augmente la capacité lorsque le bénéfice peut circuler dans l’ensemble.", "资源投放得当且收益能够流动时，整体能力便会增长。"],
      ["Growth without capacity, purpose or distribution becomes strain rather than benefit.", "La croissance sans capacité, but ni partage devient tension plutôt que bénéfice.", "缺少承载力、目的与分配的增长，只会变成压力。"],
      ["Add one resource where there is already evidence of response, then measure who benefits.", "Ajoutez une ressource là où une réponse existe déjà, puis mesurez qui en bénéficie.", "把一项资源增加到已有回应的地方，并衡量谁真正受益。"],
      ["PROSPER", "CREATE"]),
    h(43, "BREAKTHROUGH",
      ["Breakthrough", "Percée", "夬 · 泽天夬"],
      ["A decisive truth can clear the way when it is stated openly and backed by proportionate action.", "Une vérité décisive ouvre la voie lorsqu’elle est dite clairement et soutenue par une action proportionnée.", "决定性的事实若被公开说明，并配以适度行动，就能清开道路。"],
      ["Aggression, secrecy or repeated announcement can weaken a necessary decision.", "L’agression, le secret ou l’annonce répétée peuvent affaiblir une décision nécessaire.", "攻击、隐瞒或反复宣告，都会削弱一个必要决定。"],
      ["State the decision, its evidence and its consequence once, then carry it out consistently.", "Énoncez une fois la décision, ses preuves et sa conséquence, puis appliquez-la avec constance.", "一次说清决定、依据与后果，然后稳定执行。"],
      ["MOVE", "CLEAR"]),
    h(44, "MEETING",
      ["Coming to Meet", "Rencontre", "姤 · 天风姤"],
      ["A sudden influence deserves recognition before attraction or momentum gives it a larger role.", "Une influence soudaine mérite d’être reconnue avant que l’attrait ou l’élan ne lui donne plus de place.", "突然而来的影响应先被看清，再决定是否让吸引力或势头扩大它的位置。"],
      ["A small unchecked factor can enter quickly and begin directing the whole situation.", "Un petit facteur non vérifié peut entrer vite et commencer à diriger toute la situation.", "一个未经检查的小因素，可能迅速进入并开始主导全局。"],
      ["Acknowledge the attraction, set one boundary and gather facts before deeper engagement.", "Reconnaissez l’attrait, posez une limite et rassemblez les faits avant de vous engager davantage.", "承认吸引力，先设一条边界，并在深入投入前收集事实。"],
      ["PROTECT", "OPEN"]),
    h(45, "GATHERING",
      ["Gathering Together", "Rassemblement", "萃 · 泽地萃"],
      ["People and resources gather well when a shared center gives the meeting meaning.", "Les personnes et les ressources se rassemblent justement lorsqu’un centre commun donne sens à la rencontre.", "人与资源围绕一个共同核心聚拢时，集合才会有意义。"],
      ["A crowd without purpose disperses attention and amplifies uncertainty.", "Une foule sans but disperse l’attention et amplifie l’incertitude.", "没有目的的聚集会分散注意力并放大不确定。"],
      ["Name the purpose, host the necessary roles and end with one shared next action.", "Nommez le but, réunissez les rôles nécessaires et terminez par une prochaine action commune.", "说明目的，召集必要角色，并以一项共同的下一步结束。"],
      ["OPEN", "PROSPER"]),
    h(46, "ASCENDING",
      ["Pushing Upward", "Ascension", "升 · 地风升"],
      ["Gradual upward movement is built through effort that respects sequence and support.", "Une montée progressive se construit par un effort qui respecte la séquence et les appuis.", "稳步上升来自尊重顺序、善用支持的持续努力。"],
      ["Comparison and skipped foundations make advancement fragile.", "La comparaison et les fondations sautées rendent l’avancée fragile.", "比较与跳过基础，会让进阶变得脆弱。"],
      ["Identify the next rung, complete its requirement and record the skill it adds.", "Identifiez le prochain échelon, remplissez sa condition et notez la capacité acquise.", "找出下一级台阶，完成它的要求，并记录由此获得的能力。"],
      ["PROSPER", "MOVE"]),
    h(47, "OPPRESSION",
      ["Oppression", "Épuisement", "困 · 泽水困"],
      ["Constraint reveals which inner resources and commitments remain trustworthy under pressure.", "La contrainte révèle les ressources intérieures et les engagements qui restent fiables sous pression.", "困境会显出哪些内在资源与承诺在压力下仍然可靠。"],
      ["Treating exhaustion as identity can hide the help and choices that remain.", "Faire de l’épuisement une identité peut cacher l’aide et les choix encore disponibles.", "把疲惫当作身份，会遮住仍然存在的帮助与选择。"],
      ["Stop one leak, ask for one concrete support and reserve energy for the essential commitment.", "Arrêtez une fuite, demandez un soutien concret et réservez l’énergie à l’engagement essentiel.", "堵住一处消耗，请求一项具体支持，并把能量留给核心承诺。"],
      ["REST", "PROTECT"]),
    h(48, "WELL",
      ["The Well", "Le Puits", "井 · 水风井"],
      ["A shared source stays valuable when access, maintenance and contribution remain reliable.", "Une source commune garde sa valeur lorsque l’accès, l’entretien et la contribution restent fiables.", "共同资源只有在获取、维护与贡献都可靠时，才能持续有价值。"],
      ["Drawing from a neglected source without upkeep eventually harms everyone who depends on it.", "Puiser dans une source négligée sans l’entretenir finit par nuire à tous ceux qui en dépendent.", "只从被忽视的资源中索取而不维护，最终会伤害所有依赖它的人。"],
      ["Repair one point of access and contribute to the source before taking from it again.", "Réparez un point d’accès et contribuez à la source avant d’y puiser de nouveau.", "修复一个获取环节，并在再次索取前先为资源源头作出贡献。"],
      ["GROUND", "OPEN"]),
    h(49, "REVOLUTION",
      ["Revolution", "Révolution", "革 · 泽火革"],
      ["Fundamental change becomes legitimate when the old mandate has ended and a clear transition is ready.", "Un changement fondamental devient légitime lorsque l’ancien mandat est épuisé et qu’une transition claire est prête.", "旧秩序的正当性已经结束，且清晰过渡方案就绪时，根本改变才站得住。"],
      ["Change pursued for novelty, anger or image can reproduce the same problem in a new form.", "Le changement recherché pour la nouveauté, la colère ou l’image peut reproduire le même problème sous une autre forme.", "为新鲜感、愤怒或形象而改变，可能只让同一问题换一种形式重现。"],
      ["Show why the old form no longer works, define the transition and protect those carrying its cost.", "Montrez pourquoi l’ancienne forme ne fonctionne plus, définissez la transition et protégez ceux qui en portent le coût.", "说明旧形式为何失效，设计过渡，并保护承担转型成本的人。"],
      ["MOVE", "CREATE"]),
    h(50, "CAULDRON",
      ["The Cauldron", "Le Chaudron", "鼎 · 火风鼎"],
      ["Different raw materials can be transformed into value that nourishes a wider circle.", "Des matières différentes peuvent être transformées en une valeur qui nourrit un cercle plus large.", "不同原料经过转化，可以成为滋养更广人群的价值。"],
      ["An impressive container cannot compensate for weak ingredients or an unclear purpose.", "Un contenant impressionnant ne compense ni des ingrédients faibles ni un but incertain.", "再精美的容器，也无法弥补薄弱原料或模糊目的。"],
      ["Combine the strongest available resources into one useful offering and test it with real people.", "Réunissez les meilleures ressources disponibles dans une offre utile et testez-la auprès de personnes réelles.", "把最有力的现有资源组合成一个有用成果，并交给真实的人检验。"],
      ["CREATE", "PROSPER"]),
    h(51, "SHOCK",
      ["Shock", "Ébranlement", "震 · 震为雷"],
      ["A sudden jolt can awaken attention and restore contact with what is immediately real.", "Un choc soudain peut réveiller l’attention et rétablir le contact avec le réel immédiat.", "突发震动能够唤醒注意力，使人重新接触眼前真实。"],
      ["One reaction can trigger another until urgency replaces judgment.", "Une réaction peut en déclencher une autre jusqu’à ce que l’urgence remplace le jugement.", "一个反应可能引发另一个反应，直到急迫感取代判断。"],
      ["Ground your body, confirm the facts and complete the first necessary safety action.", "Revenez au corps, confirmez les faits et accomplissez le premier geste nécessaire de sécurité.", "先让身体落稳，确认事实，再完成第一项必要的安全行动。"],
      ["GROUND", "PROTECT"]),
    h(52, "STILLNESS",
      ["Keeping Still", "Immobilité", "艮 · 艮为山"],
      ["A clear stop can contain movement long enough for attention and proportion to return.", "Un arrêt clair peut contenir le mouvement assez longtemps pour rendre attention et proportion.", "明确停下，能暂时容纳冲动，让注意力与分寸重新回来。"],
      ["Stillness becomes freezing when feeling and necessary movement are both refused.", "L’immobilité devient gel lorsque l’émotion et le mouvement nécessaire sont tous deux refusés.", "若连感受与必要行动都被拒绝，静止就会变成冻结。"],
      ["Pause physical movement and new input, then decide what should remain still and what must resume.", "Suspendez le mouvement et les nouveaux apports, puis décidez ce qui doit rester immobile et ce qui doit reprendre.", "暂停身体动作与新输入，再决定什么该继续静止、什么必须恢复。"],
      ["REST", "GROUND"]),
    h(53, "DEVELOPMENT",
      ["Gradual Development", "Développement graduel", "渐 · 风山渐"],
      ["Development becomes dependable when each stage establishes the conditions for the next.", "Le développement devient fiable lorsque chaque étape établit les conditions de la suivante.", "每个阶段都为下一阶段打好条件，发展才会可靠。"],
      ["Rushing because others appear further ahead can bypass the support your own path needs.", "Se presser parce que d’autres semblent plus avancés peut contourner les appuis nécessaires à votre propre chemin.", "因为别人看似更快而急进，可能跳过自身道路所需的支撑。"],
      ["Name your present stage and complete its one unfinished requirement before advancing.", "Nommez votre étape actuelle et achevez son unique condition incomplète avant d’avancer.", "说清当前阶段，并在前进前完成其中一项未尽要求。"],
      ["PROSPER", "GROUND"]),
    h(54, "MARRYING_MAIDEN",
      ["The Marrying Maiden", "La Jeune Épousée", "归妹 · 雷泽归妹"],
      ["Entering a secondary or unequal position requires clarity about role, timing and agency.", "Entrer dans une position secondaire ou inégale demande de la clarté sur le rôle, le moment et la marge d’action.", "进入次要或不对等位置时，必须看清角色、时机与自主空间。"],
      ["Urgency, attraction or status can persuade you to bargain away your future voice.", "L’urgence, l’attrait ou le statut peuvent vous pousser à céder votre voix future.", "急迫、吸引力或身份诱惑，可能让你交换掉未来的发言权。"],
      ["Clarify the role, terms and exit before making a commitment that changes your position.", "Clarifiez le rôle, les conditions et la sortie avant tout engagement qui change votre position.", "在作出改变自身位置的承诺前，先明确角色、条件与退出方式。"],
      ["PROTECT", "CLEAR"]),
    h(55, "ABUNDANCE",
      ["Abundance", "Abondance", "丰 · 雷火丰"],
      ["At a bright peak, many signals and resources can be directed toward significant work.", "Au sommet d’une période lumineuse, de nombreux signes et ressources peuvent servir un travail important.", "处在明盛高点时，众多信息与资源可以被导向重要工作。"],
      ["Assuming the peak will last can lead to excess, neglect and poor preparation for change.", "Croire que le sommet durera peut conduire à l’excès, à la négligence et à une mauvaise préparation au changement.", "以为高峰会永久持续，容易导致过度、疏忽与对变化准备不足。"],
      ["Use the visibility to prioritize, store one surplus and prepare the system for a quieter phase.", "Profitez de la visibilité pour prioriser, conserver un surplus et préparer le système à une phase plus calme.", "利用当下的明亮确定重点，保存一份余量，并为较安静的阶段做准备。"],
      ["PROSPER", "CLEAR"]),
    h(56, "WANDERER",
      ["The Wanderer", "Le Voyageur", "旅 · 火山旅"],
      ["A temporary setting rewards humility, adaptability and attention to local conditions.", "Un contexte temporaire récompense l’humilité, l’adaptation et l’attention aux conditions locales.", "身处暂时环境时，谦逊、适应与尊重当地条件会带来帮助。"],
      ["Rootlessness can become carelessness; overattachment can mistake a stop for a home.", "L’absence de racines peut devenir négligence ; l’attachement peut confondre une étape avec un foyer.", "无根可能变成轻率，过度依恋又会把停留误认成归宿。"],
      ["Learn the local rules, carry only what is essential and leave a clear, respectful trace.", "Apprenez les règles locales, ne portez que l’essentiel et laissez une trace claire et respectueuse.", "了解当地规则，只携带必要之物，并留下清楚而尊重的痕迹。"],
      ["OPEN", "PROTECT"]),
    h(57, "GENTLE",
      ["The Gentle Wind", "Le Doux pénétrant", "巽 · 巽为风"],
      ["Repeated subtle influence can enter places that force cannot reach.", "Une influence subtile et répétée peut entrer là où la force ne peut atteindre.", "持续而细微的影响，能进入强力无法到达的地方。"],
      ["Indirectness becomes avoidance when the message never becomes clear.", "La subtilité devient évitement lorsque le message ne devient jamais clair.", "如果信息始终不清楚，委婉就会变成回避。"],
      ["Repeat one clear message and pair it with the same small, consistent action.", "Répétez un message clair et associez-le au même petit geste constant.", "重复一条清楚信息，并配合一个始终一致的小行动。"],
      ["OPEN", "CREATE"]),
    h(58, "JOYOUS",
      ["The Joyous Lake", "La Joie", "兑 · 兑为泽"],
      ["Open exchange and shared pleasure can renew trust, learning and willingness.", "Un échange ouvert et un plaisir partagé peuvent renouveler confiance, apprentissage et élan.", "开放交流与共享愉悦，能够更新信任、学习与行动意愿。"],
      ["Pleasure that avoids every difficult truth eventually weakens the connection.", "Un plaisir qui évite toute vérité difficile finit par affaiblir le lien.", "若愉悦回避所有困难事实，关系最终会被削弱。"],
      ["Create one honest conversation that includes both a genuine delight and a difficult fact.", "Créez une conversation honnête qui accueille à la fois une joie réelle et un fait difficile.", "进行一次诚实对话，同时容纳真实的愉悦与一个困难事实。"],
      ["OPEN", "PROSPER"]),
    h(59, "DISPERSION",
      ["Dispersion", "Dispersion", "涣 · 风水涣"],
      ["Dissolving a frozen barrier can restore circulation and reconnect separated parts.", "Dissoudre une barrière figée peut rétablir la circulation et relier les parties séparées.", "化开僵固屏障，能够恢复流动并重新连接分散部分。"],
      ["Release without a shared center can scatter commitments along with the tension.", "La libération sans centre commun peut disperser les engagements avec la tension.", "若没有共同核心，松解压力也可能同时冲散承诺。"],
      ["Release one rigid defense, then reconvene the people or resources around one shared aim.", "Relâchez une défense rigide, puis rassemblez de nouveau personnes ou ressources autour d’un but commun.", "松开一项僵硬防御，再让相关人与资源围绕一个共同目标重新聚合。"],
      ["OPEN", "MOVE"]),
    h(60, "LIMITATION",
      ["Limitation", "Limitation", "节 · 水泽节"],
      ["A meaningful limit creates proportion, rhythm and space for what matters.", "Une limite porteuse de sens crée proportion, rythme et espace pour l’essentiel.", "有意义的限制会带来分寸、节奏与留给重要事物的空间。"],
      ["Arbitrary or permanent restriction can damage the life it was meant to organize.", "Une restriction arbitraire ou permanente peut nuire à la vie qu’elle devait organiser.", "武断或永久的限制，可能伤害原本想要整理的生活。"],
      ["Set one clear limit with a reason, a duration and a date for review.", "Posez une limite claire avec une raison, une durée et une date de révision.", "设定一条清楚限制，并写明理由、期限与复盘日期。"],
      ["PROTECT", "GROUND"]),
    h(61, "INNER_TRUTH",
      ["Inner Truth", "Vérité intérieure", "中孚 · 风泽中孚"],
      ["Sincerity becomes trustworthy when inner conviction, evidence and behavior align.", "La sincérité devient fiable lorsque conviction intérieure, faits et comportement s’accordent.", "内在确信、事实与行为一致时，真诚才值得信任。"],
      ["Strong conviction without contact with reality can become self-sealing certainty.", "Une forte conviction sans contact avec le réel peut devenir une certitude fermée sur elle-même.", "强烈确信若不接触现实，可能变成自我封闭的确定感。"],
      ["State what feels true, verify it through behavior and invite one honest response.", "Dites ce qui vous semble vrai, vérifiez-le par les actes et invitez une réponse honnête.", "说出你认为真实的部分，用行为验证，并邀请一个诚实回应。"],
      ["CLEAR", "OPEN"]),
    h(62, "SMALL_EXCEEDING",
      ["Small Exceeding", "Petit dépassement", "小过 · 雷山小过"],
      ["Attention to a small exception or detail can prevent a larger error.", "L’attention portée à une petite exception ou à un détail peut éviter une erreur plus grande.", "关注一个小例外或细节，能够避免更大的错误。"],
      ["A dramatic leap is poorly matched to a moment that asks for modest precision.", "Un saut spectaculaire convient mal à un moment qui demande une précision modeste.", "需要小心精准的时刻，并不适合戏剧性跨越。"],
      ["Correct the smallest visible risk now and keep the larger ambition close to the ground.", "Corrigez maintenant le plus petit risque visible et gardez l’ambition plus large près du sol.", "立即修正最小的可见风险，并让更大目标暂时贴近现实。"],
      ["CLEAR", "GROUND"]),
    h(63, "AFTER_COMPLETION",
      ["After Completion", "Après l’accomplissement", "既济 · 水火既济"],
      ["A working arrangement has been achieved; careful maintenance now protects the result.", "Un ordre fonctionnel est atteint ; un entretien attentif protège désormais le résultat.", "可运行的秩序已经建立，现在需要细致维护来保护成果。"],
      ["Relaxing vigilance—or making unnecessary improvements—can disturb a delicate balance.", "Relâcher l’attention — ou améliorer sans nécessité — peut troubler un équilibre délicat.", "过早松懈或进行不必要的改动，都可能打乱微妙平衡。"],
      ["Stabilize the handoff, check one vulnerable point and schedule simple maintenance.", "Stabilisez la transmission, vérifiez un point vulnérable et programmez un entretien simple.", "稳住交接，检查一个脆弱点，并安排简单维护。"],
      ["PROTECT", "GROUND"]),
    h(64, "BEFORE_COMPLETION",
      ["Before Completion", "Avant l’accomplissement", "未济 · 火水未济"],
      ["The crossing is close, but the final sequence still deserves full attention.", "La traversée est proche, mais la dernière séquence demande encore toute l’attention.", "渡越已经接近完成，但最后的顺序仍值得全神贯注。"],
      ["Premature celebration or one rushed last step can undo careful earlier work.", "Une célébration prématurée ou une dernière étape précipitée peut défaire le travail déjà accompli.", "过早庆祝或匆忙完成最后一步，可能推翻之前的细致工作。"],
      ["List the final conditions, put them in order and complete only the next unfinished one.", "Listez les dernières conditions, mettez-les en ordre et n’accomplissez que la prochaine inachevée.", "列出最后条件并排好顺序，只完成眼前下一个未完成项。"],
      ["CLEAR", "MOVE"])
  ];

  const HEXAGRAM_BY_NUMBER = new Map(HEXAGRAMS.map((hexagram) => [hexagram.number, hexagram]));
  const TRIGRAM_BY_PATTERN = Object.freeze(Object.fromEntries(
    TRIGRAM_ORDER.map((key) => [TRIGRAMS[key].pattern, TRIGRAMS[key]])
  ));

  function validateLines(lines) {
    if (!Array.isArray(lines) || lines.length !== 6) {
      throw new TypeError("I Ching lines must be an array of six values ordered bottom-to-top.");
    }
    if (!lines.every((value) => Number.isInteger(value) && value >= 6 && value <= 9)) {
      throw new RangeError("Each I Ching line must be one of 6, 7, 8 or 9.");
    }
    return lines.slice();
  }

  function resolveHexagram(lines) {
    const sourceLines = validateLines(lines);
    const bits = sourceLines.map((value) => (value === 7 || value === 9 ? 1 : 0));
    const lowerPattern = bits.slice(0, 3).join("");
    const upperPattern = bits.slice(3, 6).join("");
    const lower = TRIGRAM_BY_PATTERN[lowerPattern];
    const upper = TRIGRAM_BY_PATTERN[upperPattern];
    const lowerIndex = TRIGRAM_ORDER.indexOf(lower.key);
    const upperIndex = TRIGRAM_ORDER.indexOf(upper.key);
    const number = KING_WEN_MATRIX[upperIndex][lowerIndex];
    const hexagram = HEXAGRAM_BY_NUMBER.get(number);
    const movingLines = sourceLines.reduce((positions, value, index) => {
      if (value === 6 || value === 9) positions.push(index + 1);
      return positions;
    }, []);

    return {
      ...hexagram,
      lines: sourceLines,
      bits,
      lower,
      upper,
      movingLines,
      hasMovingLines: movingLines.length > 0
    };
  }

  function relatedHexagram(lines) {
    const sourceLines = validateLines(lines);
    const relatedLines = sourceLines.map((value) => {
      if (value === 6) return 7;
      if (value === 9) return 8;
      return value;
    });
    const result = resolveHexagram(relatedLines);
    return {
      ...result,
      sourceLines,
      changedFrom: sourceLines.reduce((positions, value, index) => {
        if (value === 6 || value === 9) positions.push(index + 1);
        return positions;
      }, []),
      isChanged: sourceLines.some((value) => value === 6 || value === 9)
    };
  }

  const ENERGY_WEIGHTS = Object.freeze({
    CLARITY: Object.freeze({ CLEAR: 3, REST: 1, GROUND: 1 }),
    DECIDE: Object.freeze({ CLEAR: 3, PROTECT: 1, GROUND: 1 }),
    ACT: Object.freeze({ MOVE: 3, CREATE: 1, PROTECT: 1 }),
    STEADY: Object.freeze({ GROUND: 3, REST: 2, OPEN: 1 })
  });

  const ORACLE_DATA = Object.freeze({
    version: "RC14.1",
    energyKeys: Object.freeze(["GROUND", "OPEN", "PROSPER", "CLEAR", "MOVE", "REST", "PROTECT", "CREATE"]),
    energyWeights: ENERGY_WEIGHTS,
    tarot: Object.freeze({
      deckType: "MAJOR_ARCANA",
      cardCount: 22,
      usesReversals: false,
      lineOrder: null,
      cards: Object.freeze(TAROT_MAJOR)
    }),
    tarotMajor: Object.freeze(TAROT_MAJOR),
    trigramOrder: TRIGRAM_ORDER,
    trigrams: TRIGRAMS,
    kingWenMatrix: KING_WEN_MATRIX,
    hexagrams: Object.freeze(HEXAGRAMS),
    iching: Object.freeze({
      lineOrder: "BOTTOM_TO_TOP",
      lineValues: Object.freeze([6, 7, 8, 9]),
      changingValues: Object.freeze([6, 9]),
      trigrams: TRIGRAMS,
      trigramOrder: TRIGRAM_ORDER,
      kingWenMatrix: KING_WEN_MATRIX,
      hexagrams: Object.freeze(HEXAGRAMS)
    }),
    resolveHexagram,
    relatedHexagram
  });

  window.MAREVYS_ORACLE_DATA = ORACLE_DATA;
  // Compatibility alias for early RC14 controllers created in parallel.
  window.MAREVYS_ORACLES = ORACLE_DATA;
})();
