# MARÉVYS RC23 theme decks

The theme renderer is `src/deck-gallery.js`. Visual selection never changes a
server card ID, its orientation, its position, its meaning, or the retained draw.

## Collections

| ID | Collection | Artwork | Intended tier |
| --- | --- | --- | --- |
| `original` | Mineral Watercolour / Aquarelle Minérale | Existing 78 MARÉVYS illustrations, unchanged | Free |
| `heritage` | Heritage / Héritage | Existing `tarotClassic00`–`tarotClassic77` historical artwork | Free |
| `cute` | Little Companions / Petits Compagnons | Original animal storybook gouache | Plus |
| `fairytale` | Garden of Tales / Jardin des Contes | Original fairy-tale watercolour and ink | Plus |
| `realistic` | Human Stories / Présences | Original realistic painted scenes | Atelier |
| `christmas` | Christmas Starlight / Noël des Étoiles | Original winter/Christmas scenes | Plus, seasonal |

Each new collection contains 22 distinct illustrated Major Arcana scenes and 56
code-rendered ornamental pip/court cards. The Minor Arcana are deliberately pip
cards, with exact suit/count/rank and localized titles; they are not advertised
as 56 separately painted narrative scenes. Descriptions in English, French and
Chinese disclose this distinction.

These are digital website artworks. Physical cards still require individual
production-resolution masters, trim/bleed preparation, colour proofing and
manufacturing review.

## Sprite mapping

Production uses four square WebP sprite sheets for each new collection:
`{style}-sheet-0.webp` to `{style}-sheet-3.webp`. Each sheet
has exactly three columns and two rows, without gutters; every cell is a 2:3
portrait illustration. All 16 selected sheets are 1254 × 1254 pixels, so a
cell is 418 × 627 pixels. The renderer addresses cells using CSS background
positioning. The WebP encodings preserve the full source canvas without cropping.

| Sheet | Cells 0–5, left to right and then next row |
| --- | --- |
| 0 | Fool, Magician, High Priestess, Empress, Emperor, Hierophant |
| 1 | Lovers, Chariot, Strength, Hermit, Wheel of Fortune, Justice |
| 2 | Hanged Man, Death, Temperance, Devil, Tower, Star |
| 3 | Moon, Sun, Judgement, World, symmetric card back, blank ornamental minor-card ground |

Runtime keys are `deckCuteSheet0`–`deckCuteSheet3`,
`deckFairytaleSheet0`–`deckFairytaleSheet3`,
`deckRealisticSheet0`–`deckRealisticSheet3`, and
`deckChristmasSheet0`–`deckChristmasSheet3`, supplied through
`window.MAREVYS_DECK_ASSETS`. Existing art keys are available there or through
`window.MAREVYS_ASSETS`.

`deck-cute-atlas.webp` and `deck-fairytale-atlas.webp` are earlier complete 6 × 4
study sheets. They are validated fallback sources, used only if the four newer
sheets are absent. The earlier `deck-realistic-atlas.webp` and
`deck-christmas-atlas.webp` are concept studies with a different layout; the
renderer **never** treats them as valid complete decks. Realistic and Christmas
require all four selected sheets before the collection can report 78 cards.

## Creation and visual checks

The raster scenes were generated with the built-in image generation tool on
22 October 2026, without any Tarotap artwork, book illustrations, or third-party
visual references. Each selected sheet is inspected for the grid, scene order,
presence of all six compositions, typography absence and appropriate symbolism.
The free historical deck has its own existing attribution files under
`THIRD_PARTY_LICENSES`; it is not AI-generated MARÉVYS artwork.

The generation prompt for the six-scene sheets uses this common layout brief:

> Production website art sprite sheet. A square canvas, exactly three equal
> columns and two equal rows: six separate portrait 2:3 illustrations. Every tile
> reaches the boundaries of its equal rectangular cell. No gutters, page margin,
> card borders, text, names, numerals, letters or watermarks. Layout 3 × 2 is
> mandatory, not a collection of physical cards. Keep all compositions
> self-contained, with no objects crossing cell edges.

Six individual scene descriptions follow the order listed in the mapping table.
The key poses are specified explicitly: Magician and four tools; priestess and
two pillars; Strength with lion; Justice with scales and sword; Hanged Man
upside-down; Temperance pouring between vessels; Tower and lightning; Moon with
two dogs; Judgement and trumpet; World and wreath. Death is non-graphic and
Devil is symbolic/family friendly.

Style supplements:

- **Cute:** Original soft kawaii storybook gouache, rounded rabbit and cat
  characters, tactile paper, warm cream, dusty rose, sage and butter yellow,
  gentle sophisticated editorial illustration, clearly readable scenes and
  light backgrounds. Human tarot roles are performed by the animal characters.
- **Fairy tale:** Original European fairy-tale picture-book watercolour and fine
  ink; graceful human characters, enchanted woods, castles, flowering plants and
  luminous mist; warm ivory, dusty mauve, antique gold and sage. Intricate but
  legible, with no existing commercial characters.
- **Realistic:** Original realistic paintings with soft natural light, tactile
  textures, human faces and timeless clothing, physical gardens/mountains and
  restrained ivory, umber, olive and antique gold. No copied artist or brand.
- **Christmas:** Original festive winter tableaux preserving tarot symbols:
  snow, fir branches, candles, knitted clothing, gold stars, warm ivory/sage and
  restrained red. No existing commercial character.

## Availability and access

Christmas preview is available before its season. Its selection window is
15 November 2026 through 7 January 2027, Europe/Paris time; these dates are
explicit configuration and should be updated for a later campaign.

Premium membership labels are intended entitlements, not proof that a payment
service has been activated. The helper grants no paid membership from browser
storage. It currently allows only complete, free collections to be selected;
premium collection previews remain visible and selection leads to the membership
information panel. A future account-backed entitlement integration must replace
the selection gate before paid subscriptions can activate these styles.

Saved readings keep the selected deck ID so a later visual choice does not
silently change the appearance of an earlier draw.

## Web delivery encodings

The public repository and website contain the WebP encodings (quality 88) of the
complete sheets, preserving the same dimensions and cell coordinates. No cell is
cropped or repainted by this encoding step. Browsers load only the sheets required
by the selected gallery view; the build does not depend on PNG files.

All 20 original PNG source images remain unchanged in the complete handoff
archive `Marevys-RC23-Ready-to-Upload.zip`, under `marevys/assets/decks/`, and in the
local source workspace. They are intentionally excluded from the public
repository. `manifest.json` retains each original PNG filename, byte count and
SHA-256 alongside the production WebP hash and source-availability metadata.
