## Tasks

- Infinite loop with fortify
  - update card badges calls
  - composeOnDamageEvents

- Look into PartyBot for Discord

- stopping a local server is clunky

- server and game versions are out of sync is missing gif
- delete settings file if error occurs:

```
Electron: loadSettings SyntaxError: Unexpected non-whitespace character after JSON at position 870
    at JSON.parse (<anonymous>)
    at loadSettings (/Users/jordanoleary/git/Golems-Electron-Build/src/storage.js:31:29)
    at createWindow (/Users/jordanoleary/git/Golems-Electron-Build/src/index.js:129:3)
    at /Users/jordanoleary/git/Golems-Electron-Build/src/index.js:175:3
```

- Server browser
  - Table should include, game version, latency, region
  - Instructions for how to connect
  - List of community servers and server maintenance message should be hosted on
    website so I don't have to update the server browser app to change these
- **important** Cache targeting from spells before sending it in a SPELL network
  message to prevent desyncs in multiplayer

## Bugs

- cloned player AI is funky, notably with glop enemies
- head x5 + vortex if portal is out makes the portal smoke on prediction
- Desync during ally turn (as seen in brad playthrough)
- mana says it's being refunded but isn't for overkill arrows
- bug: He was able to have the spell continue to cast even after he went through
  a portal
- bug: Best spell wasn't accurate

## Content

- More interesting liquid effects for different kinds of liquids
- Endgame Looping (1/28)
  - (see branch `loop-tint-level`)
- explain that shields and other blessings are cleared when you go through a
  portal
  - This could be explained if you self cast after a portal is opened

## Balance

- **important** Improve difficulty scaling with over 4 players (1/20)
  - Wow used 10man and 25man variations
  - Increase unit quantity for over 4 players?
  - Introduce tougher enemies sooner?
  - Diversity of playstyle (classes?)
- liquid damage doesn't do enough??
- Extra work needed on mana refunds
  - bug: phantom arrow did damage but didn't subtract mana
  - add more spell refunds

## Final thoughts

- Remove save / load for singleplayer?

## Validate

- validate: Ending turn more than once
  - validate ending turn rapidly at end of level

## Performance

- Testing on worse devises
  - Test on worse processor
  - Test on less RAM
- Test in offline mode
  - Does Golems-Menu Playfair display font load

## Features

- Supporting app with Edge DB (1/19)
  - Stats in gameover screen (local, not in database)
    - Duration
    - Kills
    - Most effective spell
  - Leaderboards
    - userId
    - date
    - score: json
  - Multiplayer
    - Server Browser
      - schema
        - name
        - url
        - uptime
        - cpu
        - clients
        - rooms
  - Dynamic "Server Maintenance" notice
    - other dynamic "non deploy" notices

## Nice to haves

- Modding (1/30)
  - Include instructions from Modding.md
- MacOS / Linux support
- Hotseat multiplayer
- QualityOfLife.md
