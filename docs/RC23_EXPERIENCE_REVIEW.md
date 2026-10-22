# MARÉVYS RC23 — experience review

Date: 22 October 2026. Target: the existing `TianrenCachan/Marevys` application and its GitHub → Vercel deployment.

## Reference inspection

Reviewed Tarotap's public home, love, career, yes/no, free draw, daily/monthly/seasonal/year-ahead and membership pages, together with the 19 screenshots supplied for this request. No registration, purchase or paid reading was performed.

Reference pages:

- https://tarotap.com/
- https://tarotap.com/love-tarot
- https://tarotap.com/career-tarot
- https://tarotap.com/yes-or-no-tarot
- https://tarotap.com/fortune/seasonal
- https://tarotap.com/en/pricing

Observed patterns: clickable example questions, separate love subcategories, question-appropriate spreads, ongoing contextual conversation, membership comparisons, and selectable visual deck collections. Public pricing varies with currency and billing selection; competitor prices have not been copied into MARÉVYS. A Christmas deck is the user's additional requirement, rather than an observed Tarotap feature.

## Product decisions

1. Keep MARÉVYS branding and existing original card art. Use cream/ivory throughout reading flows, with dark ink for body text and green for buttons and selected controls.
2. Introduce an editable question composer with love, career, decision and period-based prompts. Selecting a question supplies a suitable starting mode; the reader can add their own context before shuffling.
3. Make love a primary entry. Include feelings, the relationship, reconnection and new connections, alongside personal relationship astrology and synastry.
4. Preserve server-generated card identities, orientations and the original draw when continuing a conversation. New themes have their own trusted, translated position definitions rather than only different headings.
5. Put a concise answer and practical next steps in conversational bubbles. Keep card-by-card details and calculated chart evidence available on demand. Keep basic reference and AI-generated content distinguishable.
6. Keep deck choice independent from card identity and interpretation. Freeze the selected deck within each reading and saved record.

## Initial mode map

| Mode | Cards | Focus |
| --- | ---: | --- |
| Open question | 1, 3 or 5 | Existing general layouts |
| Feelings | 3 | Observable connection, uncertainty, communication |
| Our relationship | 5 | Current dynamics, difficulty, support and next steps |
| After separation | 5 | Previous pattern, distance, reconnection and boundaries |
| New connections | 3 | Openness, repeating patterns and opportunities |
| A job offer | 3 | Fit, trade-off and next check |
| Changing work | 5 | Current situation, opportunity, obstacle and transition |
| A decision | 3 | Motivation, cost and next step |
| Today | 1 | A useful focus for the day |
| This month | 5 | Monthly priorities and action |
| This season | 5 | Seasonal reflection and direction |

## Membership rollout

The comparison is a proposed product structure, not an active payment offer. Existing free functionality remains available. New premium art can be previewed without claiming a paid entitlement. No browser storage value grants paid membership, and no checkout is simulated.

| Tier | Intended role |
| --- | --- |
| Free | Discover the core experience and existing decks |
| Plus | Broader themed exploration and additional illustrated deck collections |
| Atelier | Extended exploration and the complete art collection |

The final price, billing intervals, usage budgets and cancellation policy must be fixed alongside the real payment configuration. Avoid promising unlimited AI usage before measuring operating costs.

To activate subscriptions, connect the actual project and a payment merchant account, configure verified identity and server-side entitlements, and test checkout, subscription updates, cancellation and signed payment webhooks. The currently connected Vercel team did not expose the existing `marevys` project, and the CLI required sign-in. These are account prerequisites, not reasons to replace the existing repository or hosting.

## Deck and seasonal policy

The selector keeps original and heritage collections. New directions are cute, fairytale, realistic and Christmas. New art is original, not extracted from competitor screenshots or the uploaded books. Atlas-based new collections identify their illustrated major cards and pip-style minor cards accurately; the asset notes record the delivered scope.

Production and the public repository use complete WebP sheet encodings. The 20 original PNG source images are preserved unchanged in the full handoff archive, with their hashes and availability recorded in the deck manifest; they are not required by the website build.

Christmas artwork is previewable throughout the year. Its intended active season is 15 November through 7 January in Europe/Paris. Seasonal artwork and seasonal reading layouts are separate settings.

## Verification record

The final implementation and deployment verification is recorded in the Git commit and the handoff message. Local automated tests use isolated or simulated AI responses and do not by themselves prove a live AI provider or payment integration is working.

Local verification on 22 October 2026: the complete `npm test` run passed 122 test entries, followed by the online build verification; `npm run build:web` also passed. The compatibility tests contain additional source and archived-flow checks. Desktop and a real 390-pixel iframe viewport were visually inspected, including the light reading settings and the six-deck selector. The managed browser preview did not provide a reachable reading API, so browser-based live drawing was not counted as verified there; isolated HTTP integration tests cover that flow. Live production checks are reported separately after deployment.
