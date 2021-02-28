- Tooltip box (for seeing info when you click on golems / players / spells)
- Spell pool (3 circles)
  - Shows plus sign when it's in add mode (to add a card)
  - Otherwise shows the number of modifiers and if you click on it it explains in the tooltip box
- Cards (for choosing spell modifiers)
- [Seeded random](https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript)

```
var random = require("random")
const seedrandom = require('seedrandom')

// change the underlying pseudo random number generator
// by default, Math.random is used as the underlying PRNG
random.use(seedrandom('foobar'))
console.log(random.float())
console.log(random.float())
```

- New turn phases:
  - Pick (both players apply "cards" to their spells (one at a time alternating))
  - NPC (golems spawn and/or advance)
  - Cast (players cast one at a time)
- Change casting to highlight home row cells and cast them in a line instead of on a chosen cell
- Allow rejoining with saved client id
