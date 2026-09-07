(function(host){
  'use strict';
  const rows=[
    ['02 · BLIND DRAW','02 · TIRAGE À L’AVEUGLE','02 · 盲选'],
    ['02 · DRAW OR CAST','02 · TIRAGE OU FORMATION','02 · 抽取或起卦'],
    ['03 · REVEAL','03 · RÉVÉLATION','03 · 揭示'],
    ['04 · YOUR INTERPRETATION','04 · VOTRE INTERPRÉTATION','04 · 你的解读'],
    ['05 · THE REVEAL','05 · LA RÉVÉLATION','05 · 专属揭晓'],
    ['06 · HOW TO USE IT','06 · COMMENT L’UTILISER','06 · 使用方式'],
    ['07 · KEEP THE READING','07 · CONSERVER LA LECTURE','07 · 保存解读'],
    ['All cards share the ARCANA 22 lunar back. Their faces stay hidden until the reveal.','Toutes les cartes partagent le même dos lunaire ARCANA 22. Leurs faces restent cachées jusqu’à la révélation.','所有牌都使用 ARCANA 22 同款月相牌背，牌面会一直隐藏到揭示时刻。'],
    ['Yes. The rune experience reshuffles all 24 stones and asks you to blind-draw one. MARÉVYS does not assign upright or reversed positions: every rune is considered through both its central meaning and its shadow edge.','Oui. L’expérience mélange les 24 pierres et vous invite à en tirer une à l’aveugle. MARÉVYS n’attribue ni position droite ni position renversée : chaque rune est lue à travers son sens central et sa part d’ombre.','是的。系统会重新打乱全部 24 枚符文石，并请你盲选一枚。MARÉVYS 不设置正位或逆位；每枚符文都会同时从核心含义与阴影面来理解。'],
    ['MARÉVYS connects the context of your question with the themes in your chosen symbolic system, then composes four sensory objects into one practical ritual. For the full explanation, see the Reading notice.','MARÉVYS relie le contexte de votre question aux thèmes du système symbolique choisi, puis compose quatre objets sensoriels en un rituel concret. Pour l’explication complète, consultez la notice de lecture.','MARÉVYS 会把你的问题语境与所选象征体系的主题联系起来，再将四件感官器物组合成一套可执行的仪式。完整说明请参阅“解读说明”。']
  ];
  if(!Array.isArray(host.MAREVYS_TEXT))host.MAREVYS_TEXT=[];
  host.MAREVYS_TEXT.push(...rows);
  host.MAREVYS_RC18_TEXT=rows;
})(typeof window==='undefined'?globalThis:window);
