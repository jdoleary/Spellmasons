# Critical Path
- Collisions
    - What if the collision system figures out the units of concern ahead of time for a move so it only has to loop through the ones that it will interact with.  Draw the moment line, find the units close enough to it for them to matter and draw their movement lines in response, then move everyone
- Stresstest gamestate sync:
    - If you delay messages on the backend are you sure they'll arrive in the right order?
    - Can collisions cause desync
    - If a client becomes desynced
        1. How will they know?
        2. How does it resolve?
- Terrain
    - Trees (chainable, destroyable?)
    - Rocks (non chainable, non destroyable)
    - Lava
    - Water (iceable); Could lava and water be shaders applied to polygons? too complex?
- Gameplay Balance
- Playtest with friends
    - Verify gamestate integrity between clients
- Start a following (Tom Francis style):
    - Youtube Alpha version video
- Content
    - More spells
    - More monsters
- Endgame with Boss (Fruit Wave style?)
- Security
    - Since I'm using electron, I should evaluate my dependencies for safety: https://www.electronjs.org/docs/latest/tutorial/security#security-is-everyones-responsibility
    - [Security Recommendations](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations)
- Polish
    - [Add Juice](https://itch.io/b/1219/gamedev-pro)
        - Tools
            - [Fluid FX](https://codemanu.itch.io/fluid-fx)
            - 
        - (M) Animate cards
            - https://3dtransforms.desandro.com/perspective
            - https://3dtransforms.desandro.com/card-flip
            - Use transform3d functions to trigger hardware acceleration: "In essence, any transform that has a 3D operation as one of its functions will trigger hardware compositing, even when the actual transform is 2D, or not doing anything at all (such as translate3d(0,0,0)). Note this is just current behaviour, and could change in the future (which is why we don’t document or encourage it). But it is very helpful in some situations and can significantly improve redraw performance."
        - (L) Add shaders (see branch "shaders-yay")
        - Some kind of visible error mechanism to show when cards don't apply
            - Don't let players cast fizzle spells (AOE or chain without damage)
            - Like if you cast "Protection" on yourself and then AOE it does nothing because there are no targets to AOE off of
            - Or if you cast cards out of order like Dicard without a card after it
    - Make executable with Electron
    - Finish all TODOs
    - Tutorial (Mario style, don't make it explicit)
    - SFX
        - Special sfx for when ally dies
- Hire Out?
    - Art
        - Do what you can with Juice and shaders before hiring and artist
        - Calculate the value of your time for making art and music yourself vs the cost of hiring
    - Music
        - Have special music for intense moments (low health, boss fight)
        - https://www.fiverr.com/categories/music-audio/session-musicians?source=gallery-listing
- Menus / Options
- Publicity
    - Publish on Steamworks
    - Social Media stuff

## Deadlines
- My part (gameplay) should be finished end of Feb 2022
## Thoughts
Don't get stuck on feature creep.  Finish the game and get it out so you can move on
