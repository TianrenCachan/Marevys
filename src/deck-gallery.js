(function () {
  'use strict';

  // Decks change presentation only. The server remains authoritative for the
  // 78 card IDs, orientation, positions and retained draw.
  const KEY = 'marevys.deck.v1';
  const localized = (en, fr, zh) => ({ en, fr, zh });
  const decks = [
    { id: 'original', name: localized('Mineral Watercolour', 'Aquarelle Minérale', '矿物水彩'), tier: 'free', kind: 'original', description: localized('The original MARÉVYS collection: 78 illustrated cards.', 'La collection originale MARÉVYS : 78 cartes illustrées.', '保留原版 MARÉVYS 设计，完整 78 张插画牌面。') },
    { id: 'heritage', name: localized('Heritage', 'Héritage', '经典传承'), tier: 'free', kind: 'heritage', description: localized('The historical illustrated deck, with its traditional symbolism.', 'Le jeu historique illustré et ses symboles traditionnels.', '历史经典插画牌组，保留传统象征。') },
    { id: 'cute', name: localized('Little Companions', 'Petits Compagnons', '软萌伙伴'), tier: 'plus', assetKey: 'deckCuteAtlas', palette: ['#fcf1de', '#bf8579', '#5b7462'], description: localized('A gentle animal storybook: 22 illustrated majors and 56 ornamental pip cards.', 'Un tendre conte animalier : 22 arcanes majeurs illustrés et 56 cartes à enseignes décoratives.', '温柔可爱的动物绘本：22 张大牌插画，56 张装饰数字与宫廷牌。') },
    { id: 'fairytale', name: localized('Garden of Tales', 'Jardin des Contes', '童话花园'), tier: 'plus', assetKey: 'deckFairytaleAtlas', palette: ['#f4efdf', '#9b86aa', '#626d58'], description: localized('An enchanted watercolour garden: 22 illustrated majors and 56 ornamental pip cards.', 'Un jardin enchanté à l’aquarelle : 22 majeurs illustrés et 56 cartes à enseignes décoratives.', '水彩绘就的奇幻花园：22 张大牌插画，56 张装饰数字与宫廷牌。') },
    { id: 'realistic', name: localized('Human Stories', 'Présences', '真实人间'), tier: 'atelier', assetKey: 'deckRealisticAtlas', palette: ['#e9deca', '#85634c', '#59614b'], description: localized('Realistic painted scenes: 22 illustrated majors and 56 ornamental pip cards.', 'Des scènes peintes réalistes : 22 majeurs illustrés et 56 cartes à enseignes décoratives.', '细腻写实的绘画场景：22 张大牌插画，56 张装饰数字与宫廷牌。') },
    { id: 'christmas', name: localized('Christmas Starlight', 'Noël des Étoiles', '圣诞星光'), tier: 'plus', assetKey: 'deckChristmasAtlas', seasonal: true, startsAt: '2026-11-15T00:00:00+01:00', endsAt: '2027-01-08T00:00:00+01:00', palette: ['#faf1df', '#9b4e41', '#476c52'], description: localized('A members’ winter collection. Preview now; seasonal selection from 15 November to 7 January. 22 illustrated majors and 56 ornamental pip cards.', 'Une collection d’hiver pour les membres. Aperçu libre ; sélection du 15 novembre au 7 janvier. 22 majeurs illustrés et 56 cartes à enseignes.', '会员冬季系列。可提前预览，11 月 15 日至 1 月 7 日开放选择。含 22 张大牌插画及 56 张装饰数字与宫廷牌。') }
  ];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const registry = () => ({ ...(window.MAREVYS_ASSETS || {}), ...(window.MAREVYS_DECK_ASSETS || {}) });
  const catalog = () => window.MAREVYS_TAROT_CARDS || [];
  const language = value => ['en', 'fr', 'zh'].includes(value) ? value : (window.MarevysStudio?.getLang?.() || 'fr');
  const nameOf = (value, locale) => typeof value === 'object' && value ? value[locale] || value.fr || value.en || '' : String(value || '');
  const raw = id => decks.find(deck => deck.id === id);
  function inSeason(deck, now = Date.now()) {
    return !deck.seasonal || now >= Date.parse(deck.startsAt) && now < Date.parse(deck.endsAt);
  }
  function get(id) {
    const deck = raw(id);
    if (!deck) return null;
    const assets = registry();
    const atlasUrl = deck.assetKey ? assets[deck.assetKey] || '' : '';
    const sheetPrefix = { cute: 'deckCuteSheet', fairytale: 'deckFairytaleSheet', realistic: 'deckRealisticSheet', christmas: 'deckChristmasSheet' }[deck.id];
    const sheets = sheetPrefix ? [0, 1, 2, 3].map(index => assets[sheetPrefix + index] || '') : [];
    const ready = deck.kind === 'original' || deck.kind === 'heritage'
      ? Boolean(assets[deck.kind === 'original' ? 'tarot00' : 'tarotClassic00'])
      : sheets.every(Boolean) && sheets.length === 4 || ['cute', 'fairytale'].includes(deck.id) && Boolean(atlasUrl);
    return { ...deck, name: { ...deck.name }, description: { ...deck.description }, atlasUrl, sheets,
      coverUrl: !ready && deck.assetKey ? atlasUrl : undefined,
      cardCount: ready ? 78 : 0, targetCardCount: 78,
      artworkStatus: ready ? (deck.assetKey ? 'digital-illustrated-majors-and-pip-minors' : 'complete') : 'concept-preview',
      available: ready && inSeason(deck), inSeason: inSeason(deck), previewOnly: !ready, locked: deck.tier !== 'free' };
  }
  function list() { return decks.map(deck => get(deck.id)); }
  function getSelected() {
    let stored;
    try { stored = localStorage.getItem(KEY); } catch {}
    const deck = get(stored);
    // A browser value never grants a subscription. Paid selection is enabled
    // only when a future account-backed implementation replaces this gate.
    return deck?.tier === 'free' && deck.available ? deck.id : 'original';
  }
  function select(id) {
    const deck = get(id);
    if (!deck || !deck.available || deck.tier !== 'free') {
      if (deck?.tier !== 'free') window.MarevysDiscovery?.openMembership?.();
      return false;
    }
    try { localStorage.setItem(KEY, id); } catch { return false; }
    document.dispatchEvent(new CustomEvent('marevys:deck-change', { detail: { deckId: id } }));
    return true;
  }
  function resolveCard(input) {
    const id = typeof input === 'string' ? input : input?.id;
    let number = Number(String(id || '').replace(/^TAROT_/, ''));
    if (!/^TAROT_\d{2}$/.test(String(id)) || !Number.isInteger(number) || number < 0 || number > 77) number = Number.isInteger(input?.number) && input.number >= 0 && input.number < 78 ? input.number : 0;
    return { ...(catalog()[number] || {}), ...(typeof input === 'object' && input ? input : {}), id: `TAROT_${String(number).padStart(2, '0')}`, number };
  }
  function suitFor(card) { return ['wands', 'cups', 'swords', 'pentacles'][Math.floor((card.number - 22) / 14)] || 'wands'; }
  function rankFor(card) { return ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'page', 'knight', 'queen', 'king'][(card.number - 22) % 14]; }
  const roman = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  const suitShapes = {
    wands: '<path d="M20 36 40 4M22 33 31 32M28 22 23 14M33 15 43 14"/>',
    cups: '<path d="M16 7h28v9c0 10-6 15-14 15s-14-5-14-15V7Zm14 24v8m-9 1h18M16 10H9v7c0 5 4 8 9 8M44 10h7v7c0 5-4 8-9 8"/>',
    swords: '<path d="M30 3 35 12 32 32h-4l-3-20 5-9ZM20 32h20M30 32v11m-4 0h8"/>',
    pentacles: '<circle cx="30" cy="23" r="19"/><path d="m30 8 4.5 10.5H46l-9.5 7 3.5 11-10-7-10 7 3.5-11-9.5-7h11.5Z"/>'
  };
  function pip(suit) { return `<svg viewBox="0 0 60 48" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${suitShapes[suit]}</svg>`; }
  function atlasStyle(url, index, columns = 6, rows = 4) {
    const x = index % columns, y = Math.floor(index / columns);
    return `background-image:url(&quot;${escape(url)}&quot;);background-size:${columns * 100}% ${rows * 100}%;background-position:${x * (100 / (columns - 1))}% ${y * (100 / (rows - 1))}%;`;
  }
  function cellStyle(deck, index) {
    return deck.sheets?.length === 4 && deck.sheets.every(Boolean)
      ? atlasStyle(deck.sheets[Math.floor(index / 6)], index % 6, 3, 2)
      : atlasStyle(deck.atlasUrl, index);
  }
  function presentationDeck(id) { return get(id) || get('original'); }
  function renderFace(first, second, third) {
    let deckId, cardInput, options;
    if (typeof first === 'string' && raw(first)) {
      deckId = first; cardInput = second; options = third && typeof third === 'object' ? third : { locale: third };
    } else {
      cardInput = first;
      options = second && typeof second === 'object' ? second : { locale: second, deckId: third };
      deckId = options.deckId || getSelected();
    }
    const deck = presentationDeck(deckId), card = resolveCard(cardInput), locale = language(options.locale);
    const name = nameOf(card.name, locale), reversed = card.orientation === 'reversed';
    const classes = String(options.className || '').replace(/[^a-zA-Z0-9 _-]/g, '');
    if (deck.kind === 'original' || deck.kind === 'heritage') {
      const key = deck.kind === 'heritage' ? 'tarotClassic' + String(card.number).padStart(2, '0') : card.number < 22 ? 'tarot' + String(card.number).padStart(2, '0') : 'tarotOriginal' + String(card.number).padStart(2, '0');
      const url = registry()[key] || registry()[card.number < 22 ? 'tarot' + String(card.number).padStart(2, '0') : 'tarotOriginal' + String(card.number).padStart(2, '0')];
      return url ? `<img class="marevys-deck-original ${classes}${reversed ? ' is-reversed' : ''}" src="${escape(url)}" alt="${escape(name)}" loading="lazy" draggable="false">` : `<span class="marevys-deck-fallback">${escape(name)}</span>`;
    }
    if (deck.previewOnly && !deck.atlasUrl) return `<span class="marevys-deck-fallback">${escape(nameOf(deck.name, locale))}</span>`;
    if (deck.previewOnly) return `<span class="marevys-deck-concept ${classes}"><img src="${escape(deck.atlasUrl)}" alt="${escape(nameOf(deck.name, locale))}" loading="lazy"><small>${escape(nameOf(localized('STYLE PREVIEW', 'APERÇU DE STYLE', '风格预览'), locale))}</small></span>`;
    const [paper, accent, ink] = deck.palette;
    let markup;
    if (card.number < 22) {
      markup = `<span class="marevys-atlas-scene" style="${cellStyle(deck, card.number)}" aria-hidden="true"></span><small class="marevys-card-numeral" aria-hidden="true">${roman[card.number]}</small>`;
    } else {
      const rank = rankFor(card), suit = suitFor(card), court = ['page', 'knight', 'queen', 'king'].includes(rank);
      const count = rank === 'ace' ? 1 : court ? 1 : Number(rank);
      const courtTitles = { page: localized('PAGE', 'VALET', '侍从'), knight: localized('KNIGHT', 'CAVALIER', '骑士'), queen: localized('QUEEN', 'REINE', '王后'), king: localized('KING', 'ROI', '国王') };
      markup = `<span class="marevys-atlas-scene minor-ground" style="${cellStyle(deck, 23)}" aria-hidden="true"></span><span class="marevys-pip-field pip-count-${count}${court ? ' is-court' : ''}" aria-hidden="true">${court ? `<span class="marevys-court-mark">${rank === 'knight' ? '♞' : rank === 'page' ? '✧' : '♛'}</span>` : ''}${Array.from({ length: count }, () => `<span class="marevys-pip">${pip(suit)}</span>`).join('')}${court ? `<small>${escape(nameOf(courtTitles[rank], locale))}</small>` : ''}</span><small class="marevys-card-numeral" aria-hidden="true">${rank === 'ace' ? 'I' : court ? '' : roman[Number(rank)]}</small>`;
    }
    return `<span role="img" aria-label="${escape(name)}" class="marevys-deck-face deck-${deck.id} ${classes}${reversed ? ' is-reversed' : ''}" style="--deck-paper:${paper};--deck-accent:${accent};--deck-ink:${ink}">${markup}<span class="marevys-card-caption" aria-hidden="true">${escape(name)}</span></span>`;
  }
  function renderBack(id, options = {}) {
    if (typeof id === 'object' && id) { options = id; id = undefined; }
    const deck = presentationDeck(id || getSelected()), url = deck.atlasUrl || deck.sheets?.[3];
    const classes = String(options.className || '').replace(/[^a-zA-Z0-9 _-]/g, '');
    if (deck.previewOnly && url) return `<span class="marevys-deck-concept ${classes}"><img src="${escape(url)}" alt="${escape(nameOf(deck.name, language(options.locale)))}" loading="lazy"></span>`;
    if (url) return `<span class="marevys-deck-back deck-${deck.id} ${classes}" style="${cellStyle(deck, 22)}" aria-hidden="true"></span>`;
    if (deck.kind === 'heritage') return `<span class="marevys-deck-back heritage-back ${classes}" aria-hidden="true"><span>✧</span></span>`;
    const original = registry().tarotBack;
    return original ? `<img class="marevys-deck-original ${classes}" src="${escape(original)}" alt="" draggable="false">` : '<span class="marevys-deck-back heritage-back" aria-hidden="true"><span>✧</span></span>';
  }
  const css = `
    .marevys-deck-face,.marevys-deck-back{position:relative;display:block;isolation:isolate;width:100%;height:100%;min-height:0;aspect-ratio:2/3;overflow:hidden;border-radius:4px;background-color:var(--deck-paper,#f4eddf);background-repeat:no-repeat;color:var(--deck-ink,#405748);box-sizing:border-box}
    .marevys-deck-original{display:block;width:100%;height:100%;object-fit:cover;border-radius:4px}
    .marevys-deck-face.is-reversed,.marevys-deck-original.is-reversed{transform:rotate(180deg)}
    .marevys-atlas-scene{position:absolute;inset:0;display:block;background-repeat:no-repeat;background-color:var(--deck-paper)}
    .marevys-card-numeral{position:absolute;top:4%;left:0;right:0;margin:auto;width:max-content;padding:1px 6px;border-radius:20px;background:#fff9e5d9;color:#514d3c;font:9px/1.3 Georgia,serif;letter-spacing:.1em}
    .marevys-card-caption{position:absolute;bottom:0;inset-inline:0;padding:7% 4% 5%;background:linear-gradient(transparent,var(--deck-paper) 40%);font:clamp(7px,.7vw,12px)/1.35 Georgia,'Noto Sans SC',serif;text-align:center;color:var(--deck-ink);overflow-wrap:anywhere}
    .marevys-pip-field{position:absolute;inset:14% 14% 17%;display:grid;grid-template-columns:repeat(2,1fr);align-items:center;justify-items:center;gap:1% 8%;color:var(--deck-ink)}
    .marevys-pip{display:block;width:100%;max-width:42px;line-height:0}.marevys-pip svg{display:block;width:100%;height:auto}
    .marevys-pip-field.pip-count-1{display:flex;align-items:center;justify-content:center}.pip-count-1>.marevys-pip{max-width:none;width:75%}.pip-count-3>.marevys-pip:last-child,.pip-count-5>.marevys-pip:last-child,.pip-count-7>.marevys-pip:last-child,.pip-count-9>.marevys-pip:last-child{grid-column:1/-1;width:45%}
    .marevys-pip-field.is-court{flex-direction:column;gap:6%}.is-court>.marevys-pip{width:52%}.marevys-court-mark{font:clamp(25px,3vw,60px)/1.1 Georgia,serif;color:var(--deck-accent)}.marevys-pip-field.is-court>small{font:8px/1.4 Georgia,'Noto Sans SC',serif;letter-spacing:.08em}
    .minor-ground{opacity:.62}.deck-cute .marevys-pip{color:#78916b}.deck-fairytale .marevys-pip{color:#867393}.deck-realistic .marevys-pip{color:#8b6e46}.deck-christmas .marevys-pip{color:#9b4e41}
    .heritage-back{background-color:#304d4b;background-image:repeating-linear-gradient(45deg,transparent 0 9px,#baa6712b 9px 10px),repeating-linear-gradient(-45deg,transparent 0 9px,#baa6712b 9px 10px);border:5px double #c8b889;display:grid;place-items:center}.heritage-back>span{font:60px/1 Georgia,serif;color:#e3d8b2}
    .marevys-deck-concept{display:grid;align-content:center;gap:8px;width:100%;height:100%;background:#f4eddf;border-radius:5px;overflow:hidden}.marevys-deck-concept>img{display:block;width:100%;height:100%;object-fit:contain!important}.marevys-deck-concept>small{font:9px/1.4 Arial,sans-serif;letter-spacing:.08em;text-align:center;color:#7b715f}.marevys-deck-fallback{display:grid;place-items:center;aspect-ratio:2/3;background:#f4eddf;border:1px solid #cfb994;color:#405748;font:15px/1.5 Georgia,serif;padding:12px;text-align:center}
  `;
  if (!document.getElementById('marevysDeckStyles')) {
    const style = document.createElement('style'); style.id = 'marevysDeckStyles'; style.textContent = css; document.head.appendChild(style);
  }
  window.MarevysDecks = Object.freeze({ list, get, getSelected, selectedId: getSelected, select, renderFace, renderBack, previewFace: (id, card, options) => renderFace(id, card, options), inSeason: (id, now) => Boolean(raw(id)) && inSeason(raw(id), now) });
})();
