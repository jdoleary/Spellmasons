## Critical Path

- Critical Path
  - Gameplay Core (Due April 21, 2021)
    - **Really polish synergies** (chaining dead bodies, obstacles, etc)
    - Make units clickable to see detail view
    - Tab to bring spell combo to backburner and tab to bring it back so you can see detail view
    - Better movement for players
  - Gameplay Polish
    - More creative, more difficult enemies
    - More Spells
    - More Upgrades
    - Some sense of progression (items / inventory??) (or are upgrades enough?)
    - Level Progression (which enemies, how is it random, etc)
  - Polish
    - Add tutorial
      - Introduce unit types
    - Make sure pie-client isn't still linked and uses most up-to-date version on NPM
    - WebsocketPie: Make clients receive their own messages immediately?
      - So that when a player is alone they can just keep clicking to move?
    - Art
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
  - Chores
    - Make executable with Electron
    - Include WebsocketPie and make hosting for friends simple
  - Publish via [Steamworks](https://partner.steamgames.com/steamdirect) / Itch.io
    - Trailer
    - Keys to streamers and youtubers

## Elements

Elements as building blocks for combined spells:

- time
- position
  - Aura / AOE
  - Adjacent
- orientation / direction
  - e.g. facing twoard or away (example: Medusa stone)
- state
  - wet / poisoned / etc
- unit attribute
  - e.g. health, strength, etc
    - e.g. has effect relative to health remaining
- movement / collision

## Plan

- Iterate as much as possible through playtesting
- Refactor as necessary to keep the codebase robust and simple to work in
