(function(host){
  'use strict';
  const rows=[
    ['Your ritual set is ready.','Votre ensemble rituel est prêt.','你的专属仪式套组已就绪。'],
    ['Try this four-object sequence to work with the difficult part of your reading. You will see what each object is, how to use it and why it belongs here.','Essayez cette séquence de quatre objets pour travailler la partie délicate de votre lecture. Vous verrez ce qu’est chaque objet, comment l’utiliser et pourquoi il se trouve ici.','不妨试试这组四件器物，调整解读中较为不利的部分。你会清楚看到每件器物是什么、如何使用，以及它为何适合这次解读。'],
    ['A ritual you can actually follow.','Un rituel que vous pouvez réellement suivre.','一套真正可以完成的仪式。'],
    ['Move through the four bookmarks in order. Each object has one action, one duration and one practical role in changing the atmosphere around your question.','Suivez les quatre marque-pages dans l’ordre. Chaque objet possède un geste, une durée et un rôle concret pour transformer l’atmosphère autour de votre question.','按顺序完成四张器物书签上的动作。每件器物都有一个做法、一段时长，以及一个调整问题氛围的具体作用。'],
    ['Your reading, written down.','Votre lecture, mise par écrit.','你的解读，已经记下。'],
    ['An open RETURN 01 journal ready for a private reading record','Un carnet RETURN 01 ouvert, prêt à recevoir une lecture privée','一本摊开的 RETURN 01，准备记录这次私人解读'],
    ['CONTINUE THE RECORD','POURSUIVRE LE CARNET','继续记录'],
    ['Write the next seven days into RETURN 01.','Écrivez les sept prochains jours dans RETURN 01.','把接下来七天写进 RETURN 01。'],
    ['Write what changes next into RETURN 01.','Notez dans RETURN 01 ce qui change ensuite.','把接下来的变化写进 RETURN 01。'],
    ['Keep the facts, changes and decisions that follow this reading in one place.','Rassemblez au même endroit les faits, les changements et les décisions qui suivront cette lecture.','把这次解读之后出现的事实、变化与决定，留在同一个地方。'],
    ['Keep the facts, patterns and decisions that follow this reading in one place.','Rassemblez au même endroit les faits, les motifs et les décisions qui suivront cette lecture.','把这次解读之后出现的事实、规律与决定，留在同一个地方。'],
    ['View RETURN 01','Voir RETURN 01','查看 RETURN 01'],
    ['View RETURN 01 →','Voir RETURN 01 →','查看 RETURN 01 →'],
    ['{rune} · Seven-day reading','{rune} · Lecture sur sept jours','{rune} · 七日解读'],
    ['What helps this week','Ce qui vous aide cette semaine','本周的助力'],
    ['What needs attention','Ce qui demande votre attention','本周需要留意之处'],
    ['RITUAL KEPT','RITUEL CONSERVÉ','已保存的仪式'],
    ['Try {name}: {reason}','Essayez {name} : {reason}','不妨试试 {name}：{reason}'],
    ['{name}, selected for this reading','{name}, sélectionné pour cette lecture','{name}，为本次解读所选'],
    ['See this object','Découvrir cet objet','查看这件器物'],
    ['MATCHED THEME','THÈME ASSOCIÉ','本次匹配主题'],
    ['Main direction: {main}. Supporting direction: {support}.','Direction principale : {main}. Direction d’appui : {support}.','主要方向：{main}。辅助方向：{support}。'],
    ['Try this set for the part of the week that needs adjustment.','Essayez cet ensemble pour la partie de la semaine qui demande un ajustement.','不妨试试这套器物，调整本周运势中需要留意的部分。'],
    ['{name}, prepared for step {number}','{name}, préparé pour l’étape {number}','{name}，用于第 {number} 步'],
    ['Hold one real situation in mind.','Gardez à l’esprit une situation réelle.','在心中保留一个真实的情境。'],
    ['Hold your question for five seconds.','Gardez votre question en vous pendant cinq secondes.','带着你的问题，静心五秒。'],
    ['Breathe once with the question. The cards will appear when the interval is complete.','Respirez une fois avec la question. Les cartes apparaîtront à la fin de cet intervalle.','带着问题完成一次呼吸。五秒结束后，牌阵会自然出现。'],
    ['YOUR QUESTION','VOTRE QUESTION','你的问题'],
    ['Let the words settle. There is nothing to choose yet.','Laissez les mots se déposer. Il n’y a encore rien à choisir.','先让问题沉静下来，此刻还不需要作出选择。'],
    ['{count} seconds before the cards appear.','Les cartes apparaîtront dans {count} secondes.','距离牌阵出现还有 {count} 秒。'],
    ['Select this card to reveal {position}.','Sélectionnez cette carte pour révéler la position {position}.','点击这张牌，翻开“{position}”。'],
    ['Your seven-day spread','Votre tirage sur sept jours','你的七日牌阵'],
    ['The pattern and its change','La figure et sa transformation','本卦与变化'],
    ['Three square-hole bronze coins beside blank xuan paper and ink tools','Trois pièces de bronze à trou carré près d’un papier xuan vierge et d’outils d’encre','三枚方孔铜钱置于空白宣纸和笔墨器具旁']
  ];
  if(!Array.isArray(host.MAREVYS_TEXT))host.MAREVYS_TEXT=[];
  host.MAREVYS_TEXT.push(...rows);
  host.MAREVYS_RC19_TEXT=rows;
})(typeof window==='undefined'?globalThis:window);
