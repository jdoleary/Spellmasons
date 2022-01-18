# Critical Path
- Gameplay
    - Collisions
        - What if the collision system figures out the units of concern ahead of time for a move so it only has to loop through the ones that it will interact with.  Draw the moment line, find the units close enough to it for them to matter and draw their movement lines in response, then move everyone
    - Gameplay Balance
- Start a following (Tom Francis style):
    - Youtube Alpha version video
- Playtest with friends
- Content
    - More spells
    - More monsters
- Security
    - Since I'm using electron, I should evaluate my dependencies for safety: https://www.electronjs.org/docs/latest/tutorial/security#security-is-everyones-responsibility
    - [Security Recommendations](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations)
- Add endgame: Think Nuclear Throne or FTL, should it loop?
- Polish
    - [Add Juice](https://itch.io/b/1219/gamedev-pro)
        - Tools
            - [Fluid FX](https://codemanu.itch.io/fluid-fx)
            - 
        - (M) Animate cards
        - (L) Add shaders (see branch "shaders-yay")
        - Some kind of visible error mechanism to show when cards don't apply
            - Don't let players cast fizzle spells (AOE or chain without damage)
            - Like if you cast "Protection" on yourself and then AOE it does nothing because there are no targets to AOE off of
            - Or if you cast cards out of order like Dicard without a card after it
    - Make executable with Electron
    - Finish all TODOs
    - Tutorial
    - Art
    - Music
    - SFX
    - Menus
- Publicity
    - Publish on Steamworks
    - Social Media stuff

## Deadlines
- My part (gameplay) should be finished end of Feb 2022
## Thoughts
Don't get stuck on feature creep.  Finish the game and get it out so you can move on
