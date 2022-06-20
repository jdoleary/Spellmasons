# Critical Path
- Game Balance
- Clerical
    - Menu
    - Steam Page (waiting on art)
    - Website Presskit page
- SFX
    - Unit Sounds
    - Spell Sounds
    - Consumable Sounds
    - Splash Liquid Sounds
    - UI Sounds
- Art Integration
    - 90%: Unit Animations
    - 0%: Projectiles
    - 0%: Liquid Splash Animation
    - 0%: Use Consumable (potion) animation
    - 10%: Spell Animations
    - 0%: Spell Icons
    - 0%: Cover Art
    - 20%: Biome Tiles
    - 0%: UI
- Master music
- Tutorial
- Final Steps
    - [Tutorial](https://www.youtube.com/watch?v=-GV814cWiAw)
    - Optimize
        - Support large maps
        - Round of wall corners so it doesn't stair step??
            - May depend on art, but would help with optimization
        - Support huge numbers of mobs (100? 500? 1000?)
            - Profile and figure out where the weak points are
        - Delete line segments that are not accessable, like the very outside walls
    - Multiplayer Community Servers
        - Stress test droplets to see how many users they can support
    - Improved Menu
    - (Lastly) Package as Electron App
        - [Storage and Persistence](https://cameronnokes.com/blog/how-to-store-user-data-in-electron/)
        - [AutoUpdate](https://github.com/vercel/hazel)
    - Stretch Goals
        - Hoist spells
            - Logic to avoid fizzle spells
                - Don't cast res on no dead
                - do this by hoisting and checking pre-cast
                - How to resurrect units you are standing on top of (blocking?)
        - Restore unit "crowding" once all linesegments (pathing, liquid, walls) are finalized with Che's tileset
        - Server customization
            - Turn time
            - Pvp mode (more factions)
        - (M) Standalone server
            - Standalone headless server should be able to be proven out using unit tests
            - No Images, no SFX
            - It should probably just use a global variable that omits visuals
        - More content

## Definition of Done
- DONE Stable Multiplayer
- Supports extra large maps with 1000 units
- Complete Menu with options
- Bug Reporting built in (e.g. Save game state and send it to me)
- Packaged in Electron App
- Able to loop the game indefinitely with satisfying difficulty curve
- Enough random elements that different playthroughs feel somewhat unique

## Deadlines
Keeping to a hard deadline will ensure that I iterate and keep making more games and improving

- ~~My part (gameplay) should be finished end of Feb 2022~~
- ~~My part (gameplay) should be finished end of March 2022~~
- ~~My part (gameplay) should be finished end of April 2022~~
- DONE Core Gameplay done by 5/30
## Thoughts
Don't get stuck on feature creep.  Finish the game and get it out so you can move on

I will succeed with iterating on making many games similar to each other because I will continue to get better at them.  I must prioritize shipping and use hard deadlines to cut features so I don't get stuck with a forever project.

## Advice from Elon:
1. Make your requirements less dumb.  Everyone is wrong sometimes even smart people, and your requirements are definitely dumb
2. Try very hard to delete the part or process.  If you're not occasionally adding things back in then you're not deleting enough.
3. Simplify or optimize.  Note: It's the third step for a reason. Possibly the most common error of a smart engineer is to optimize a thing that should not exist.
4. Accelerate cycle time.  You're moving too slowly, go faster.
5. Automate

## Advice from GMTK:
- Players must be rewarded or forced to do something risky and fun or they'll do something easy and boring.
- If something is at the heart of your game, it needs to shine through in every aspect.