# Clearer readings and useful follow-up questions

The reading starts with a short answer to the visitor's actual question and a practical next step. Card meanings, connections and source notes remain available under an expandable explanation.

## Writing rules

- Use everyday language in Chinese, French and English. Replace abstract jargon with concrete choices and observable behavior.
- Give a reasonable recommendation or conditional tendency. Do not invent certainty, another person's feelings, dates or probabilities.
- Keep the opening brief. Each card adds a distinct, short reason relevant to the question instead of repeating the conclusion.
- Ask one optional factual question only when its answer could change the advice. Do not ask questions just to keep the conversation going.
- Treat reversed cards in context rather than assuming every reversal is negative.

## Conversation behavior

- A short answer to the guide's question is accepted, including replies such as “没有”. Free follow-up questions keep their existing minimum length.
- A follow-up uses the original question, cards, orientations and positions. It does not redraw the cards.
- Earlier exchanges are sent as bounded, untrusted context. Earlier assistant speculation is never treated as verified fact.
- The latest clarification replaces the previous pending question; a null clarification ends that prompt.
- The initial reading and local conversation remain available when saving or reopening the reading. Existing saved records remain readable.

## Verification

Backend tests cover response limits, source and card integrity, short guided replies and history validation. DOM integration tests exercise the public application bundle and tarot API, including guided replies, free follow-ups, saved records and request-size limits. Provider fixtures verify the interface contract; they are not evidence of live model writing quality.

The reference PDFs are research inputs and are not part of the public site or repository.
