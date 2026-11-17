# Look and voice

The game should read as if one particular person wrote every form and drew every
desk. The quickest way to lose that is to take the most likely choice every time:
the names, quest titles, interface patterns and phrasing that generators and
templates give everyone. Those are what make a game read as AI-made. These rules
apply to content in `src/data/`, to the desk from milestone 3 on, and to the
player-facing text in the docs.

## Words

- **One naming culture.** People are named from medieval English parish rolls
  (Agnes, Hob, Wymarc, Gilbert), and surnames come from trades, places and
  nicknames (Gotobed, Catchpole, Wildgoose). Avoid smooth, vowel-heavy fantasy
  names. If the frontier gets a second culture, write its rules down here before
  adding a single name.
- **Clients are people.** Write "Agnes the dyer", not "a merchant".
- **Requests are in the client's voice.** "Wolves took four ewes off the high
  pasture", not "Cull a wolf pack". A request names a place, a thing, a number. It
  can understate the danger, because clients do.
- **Plain over grand.** Don't write "ancient", "shadow", "whispering", "forsaken",
  "fate" or "destiny". A charnel house that won't stay shut is scarier than an
  "ancient evil".
- **Reports sound like a clerk.** Short, specific and dated, and never dramatic. A
  death is described plainly. The weight comes from the facts.
- **No hype.** Tooltips, menus and store text say what a thing does.

## Avoid

The content test (`tests/content.test.js`) fails if any of these appear in
`src/data/`. Add to the list as new ones turn up.

- **Names:** Elara, Elias, Thorne, Kael, Lyra, Seraphina, Aria, Zephyr, Mara, Voss,
  Nyx, Aldric, Elric, Ember, Wren, Ashdown, Ironside, Shadowmere, Stormwind.
- **Words:** whispering, shadow, ancient evil, forsaken, mystical, ethereal,
  tapestry, realm, destiny, chosen one.

## The look (from milestone 3)

The desk is a working desk made of paper, ink and wood. It is not a dashboard.

- **Things on the desk, not cards in a grid.** A posting is a sheet of paper with
  ruled boxes, pinned slightly crooked. A stamp leaves an inked mark that isn't
  perfectly square. A ledger has lines.
- **Type:** a serif body face for forms and reports, and a handwriting face only for
  what the clerk writes in. No Inter, and no monospace "terminal" look.
- **Colour comes from materials:** paper, iron-gall ink, red sealing wax, brass,
  stained wood. Rarity colours are the one exception, and they always come with a
  word.
- **No emoji as icons, no gradients, no glass blur, no glowing dark mode, no
  rounded "app" buttons.** Buttons are things: a stamp, a bell, a drawer.
- **Placeholder art looks like placeholder art.** Use plain shapes and text
  portraits, never generated images standing in for finished ones. Players spot
  leftover placeholders and generated art quickly, and it costs trust.
- **Imperfection on purpose.** Slight rotation, smudges, wear on the most-used
  stamp. Hand-made unevenness is what generated interfaces lack.
