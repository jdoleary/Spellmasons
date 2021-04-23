## Critical Path

- How could spells better interact?
  - Moreso than just updating targets?
- Critical Path
  - Gameplay Core 2
    - Functional Overworld
    - MVP Character Select
  - Gameplay Sprinkles
    - Should the board size scale over time as levels move on
    - **More creative, more difficult enemies**
    - **More Spells**
      - Add tiers that only unlock with upgrades?
    - More Upgrades
    - Some sense of player progression (items / inventory??) (or are upgrades enough?)
    - Level Progression (which enemies, how is it random, etc)
  - Polish
    - Overworld with meaningful decisions
    - Finish all TODOs
    - Add menu
    - Add tutorial
      - Introduce unit types
    - Add quicksaves
    - Make sure pie-client isn't still linked and uses most up-to-date version on NPM
    - WebsocketPie: Make clients receive their own messages immediately?
      - So that when a player is alone they can just keep clicking to move?
    - Art
      - Pixel art tool
        - [Aseprite](https://www.aseprite.org/)
      - Artists
        - [DeviantArt](https://www.deviantart.com/topic/pixel-art)
        - https://www.fiverr.com/harsimarjit_
        - Rachel says look on instagram
        - [Reddit](https://www.reddit.com/r/PixelArt/comments/mvod6w/oc_my_first_speed_art_im_still_figuring_out_how/)
      - Pinterest board for inspiration
      - Add Juice! tools:
        - [Juice FX](https://codemanu.itch.io/juicefx)
        - [Spells / Pixel FX Designer](https://codemanu.itch.io/particle-fx-designer)
        - [Smear](https://codemanu.itch.io/smear-fx)
        - [Hit animations](https://codemanu.itch.io/impacthit-fx-animations)
        - [Bundle containing the above tools](https://itch.io/b/814/gamedev-pro)
    - SoundFX
    - CoverArt
    - Better Game Name
      - Think of "Into the Breach", "Binding of Isaac", and "Faster than light". They all communicate seriousness
      - Tower/Guild of Spell Makers? (don't use the word "weavers" due to name conflicts with other bad games)
      - Journeyman Spellmaker
      - Council of Spell Smiths
      - Guild of Spellmasons
      - Forbidden spells
  - Chores
    - Make executable with Electron
    - Include WebsocketPie and make hosting for friends simple
  - Publish via [Humble](https://www.humblebundle.com)
  - Publish via [Steamworks](https://partner.steamgames.com/steamdirect) / Itch.io
    - Trailer
      - "The most creative spell-weaving game you've never heard of"
      - Make sure it's CLEAR what is going on in the trailer (don't be like StitchCraft)
      - Also make the "trailer" tom francis style where you just walk it through, doesn't have to be and should be an attempt to be "epic"
    - Keys to streamers and youtubers

## Elements

Elements as building blocks for combined spells:

- time
- position
  - Aura / AOE
  - Adjacent
- state
  - wet / poisoned / etc
- unit attribute
  - e.g. health, strength, etc
    - e.g. has effect relative to health remaining
- movement / collision
- random chances

## Plan

- Iterate as much as possible through playtesting
- Refactor as necessary to keep the codebase robust and simple to work in

## Game values and Pillars

(via [Charlie Cleveland](https://www.charliecleveland.com/game-pillars/))

- Pillar: True creativity in spell-making
