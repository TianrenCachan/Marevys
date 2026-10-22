'use strict';

// This catalogue is editorial application data. Visitor-supplied descriptions,
// positions and membership claims never become trusted reading instructions.
const localized = (en, fr, zh) => ({ en, fr, zh });
const position = (id, en, fr, zh) => ({ id, name: localized(en, fr, zh) });
const mode = (id, category, spreadId, title, focus, positions) => ({ id, category, spreadId, title, focus, positions });
const records = [
  mode('open', 'explore', null, localized('Your question', 'Votre question', '自由提问'),
    'Explore the visitor’s concrete question using the selected generic spread. Preserve their actual circumstances and chosen timeframe.', null),
  mode('love-feelings', 'love', 'three', localized('Understanding the connection', 'Comprendre le lien', '了解彼此的感受'),
    'Explore the connection through what the visitor has actually observed, possible sources of misunderstanding and a constructive way to ask. Another person’s private feelings are unknown: symbolic cards do not establish what they think, intend or conceal.', [
      position('love_signal', 'What your interactions show', 'Ce que vos échanges montrent', '实际互动中的线索'),
      position('love_uncertainty', 'What remains unclear', 'Ce qui reste à éclaircir', '还不清楚的地方'),
      position('love_conversation', 'A way to open the conversation', 'Comment ouvrir la discussion', '可以怎样开口')
    ]),
  mode('love-relationship', 'love', 'five', localized('Our relationship', 'Notre relation', '我们的关系'),
    'Explore the relationship as reported by the visitor: how they relate, what creates friction, what supports repair, a realistic conversation and an observable next step. Never assert infidelity, hidden motives, destiny or an inevitable outcome.', [
      position('relationship_now', 'Where the relationship stands', 'Où en est votre relation', '关系目前的状态'),
      position('relationship_tension', 'Where you get stuck', 'Ce qui vous freine', '容易卡住的地方'),
      position('relationship_resource', 'What supports your connection', 'Ce qui soutient votre lien', '可以借助的支持'),
      position('relationship_dialogue', 'What to discuss', 'Ce dont vous pouvez parler', '需要谈清楚的事'),
      position('relationship_step', 'A next step to try', 'Un prochain pas à essayer', '下一步可以怎么做')
    ]),
  mode('love-reconnection', 'love', 'five', localized('After a separation', 'Après une séparation', '分开之后的选择'),
    'Help the visitor decide whether and how to reconnect after distance or separation, using known contact, consent, boundaries and changes. Do not promise reconciliation or frame persistence against someone’s wishes as a good outcome.', [
      position('reconnection_now', 'What remains between you', 'Ce qui reste entre vous', '目前仍然存在的联系'),
      position('reconnection_pattern', 'A pattern to reconsider', 'Un schéma à reconsidérer', '需要重新看待的相处方式'),
      position('reconnection_boundary', 'A boundary to respect', 'Une limite à respecter', '需要尊重的边界'),
      position('reconnection_change', 'What would need to change', 'Ce qui devrait changer', '重新开始需要的改变'),
      position('reconnection_choice', 'Your next choice', 'Votre prochain choix', '你可以作出的下一步选择')
    ]),
  mode('love-new', 'love', 'three', localized('A new connection', 'Une nouvelle rencontre', '新的相遇'),
    'Explore readiness for a new relationship, everyday opportunities to meet people and healthy ways to recognize reciprocal interest. Do not invent a future partner’s identity, appearance, profession, date of arrival or guaranteed soulmate.', [
      position('new_relationship_needs', 'What you want from a connection', 'Ce que vous attendez d’un lien', '你期待怎样的关系'),
      position('new_relationship_opening', 'Where you can make room', 'Où faire de la place', '可以主动创造的机会'),
      position('new_relationship_step', 'One step towards meeting people', 'Un pas vers la rencontre', '可以迈出的一个小步骤')
    ]),
  mode('career-offer', 'career', 'three', localized('Considering a job offer', 'Évaluer une offre', '是否接受这份工作'),
    'Help evaluate a job offer with real factors such as responsibilities, pay, working arrangements, development and current alternatives. Keep symbolic reflection distinct from verified contract terms; identify what to confirm before accepting.', [
      position('offer_value', 'What this opportunity offers', 'Ce que cette offre apporte', '这份机会可能带来什么'),
      position('offer_check', 'What to check first', 'Ce qu’il faut vérifier', '接受前需要确认什么'),
      position('offer_next_step', 'Your next step', 'Votre prochain pas', '接下来可以怎样决定')
    ]),
  mode('career-change', 'career', 'five', localized('Changing direction at work', 'Changer de voie', '工作中的新方向'),
    'Explore a possible career change through current dissatisfaction, practical constraints, transferable strengths, preparation and a small reversible next step. Do not promise an offer or encourage an abrupt resignation without considering real resources.', [
      position('career_present', 'What matters in your current work', 'Ce qui compte dans votre travail', '当前工作中最重要的事'),
      position('career_constraint', 'A practical constraint', 'Une contrainte concrète', '现实中的限制'),
      position('career_strength', 'A strength you can carry forward', 'Un atout pour la suite', '可以带到新方向的优势'),
      position('career_preparation', 'What to prepare', 'Ce qu’il faut préparer', '需要提前做的准备'),
      position('career_experiment', 'A next step to test', 'Une étape à tester', '可以先试一试的行动')
    ]),
  mode('decision', 'decision', 'three', localized('Making a choice', 'Faire un choix', '面对一个选择'),
    'Offer a provisional practical tendency about the exact choice, with reasons, missing facts and a next check. A reversed card is not automatically no, and an upright card is not automatically yes. Do not substitute symbols for the visitor’s judgment.', [
      position('decision_priority', 'What matters in this choice', 'Ce qui compte dans ce choix', '这个选择中最重要的因素'),
      position('decision_caution', 'What to look at more closely', 'Ce qu’il faut regarder de près', '需要进一步确认的地方'),
      position('decision_next_step', 'A step towards deciding', 'Un pas pour décider', '帮助你作决定的一步')
    ]),
  mode('daily', 'fortune', 'one', localized('A moment for today', 'Un repère pour aujourd’hui', '今日提醒'),
    'Give a short practical theme to notice today, grounded in the visitor’s question. This is a reflective daily focus, not a forecast of events or a claim that luck will change.', [
      position('daily_focus', 'Something to notice today', 'Un point d’attention pour aujourd’hui', '今天值得留意的一件事')
    ]),
  mode('monthly', 'fortune', 'five', localized('The month ahead', 'Le mois à venir', '未来一个月'),
    'Explore priorities and manageable actions for the visitor’s coming month. The timeframe is an area of attention, not a prediction deadline; do not assign cards to invented dates or predict events.', [
      position('month_focus', 'Your main focus', 'Votre priorité', '这个月的重点'),
      position('month_attention', 'What needs attention', 'Ce qui demande de l’attention', '需要多加留意的事'),
      position('month_opening', 'An opening to explore', 'Une piste à explorer', '可以尝试的机会'),
      position('month_support', 'A resource to draw on', 'Une ressource à mobiliser', '可以借助的资源'),
      position('month_action', 'A practical next step', 'Une prochaine étape concrète', '可以落实的行动')
    ]),
  mode('seasonal', 'fortune', 'five', localized('A new season', 'Une nouvelle saison', '季节里的新开始'),
    'Use the change of season as a reflective checkpoint: what to carry forward, release, protect, explore and try. Do not present the seasonal theme as astronomical calculation, a precise event forecast or a reason to purchase anything.', [
      position('season_keep', 'What to carry forward', 'Ce que vous souhaitez garder', '值得继续保留的事'),
      position('season_release', 'What to leave behind', 'Ce que vous pouvez laisser', '可以放下的负担'),
      position('season_protect', 'What to make space for', 'Ce qui mérite de la place', '需要留出空间的事'),
      position('season_explore', 'What to explore', 'Ce que vous pouvez explorer', '可以开始探索的方向'),
      position('season_step', 'Your first small step', 'Votre premier petit pas', '第一步可以怎么做')
    ])
];

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
const MODES = deepFreeze(Object.fromEntries(records.map(record => [record.id, record])));
function getMode(id = 'open') { return typeof id === 'string' && Object.hasOwn(MODES, id) ? MODES[id] : null; }
function publicModes() {
  // Commercial access is intentionally absent until verified accounts and real
  // billing are connected. A client-provided plan can never grant membership.
  return records.map(({ id, category, spreadId, title, positions }) => ({ id, category, spreadId, title, positions }));
}

module.exports = { MODES, getMode, publicModes };
