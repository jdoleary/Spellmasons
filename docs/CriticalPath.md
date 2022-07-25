# My Focus
    1. Frustration Free
    2. Fun (difficult, even in early stages)
    3. Well Playtested
    - Deprioritize
        - Juice
        - SFX
# Critical Path
- DONE - Milestone 1 | **Reliable Multiplayer** | July 22
    - Standalone Server
    - Simultaneous player turns
- Milestone 2 | **Biomes** | July 28
    - More interactable doodads (explosive barrels, movable cover)
    - Better liquid
    - Simpler tiles?
    - Unblock Che for tile art
- DONE - Milestone 3 | **Balance**
    - Increase difficulty
        - Difficulty is directly related to fun, it isn't a puzzel if you can just "hurt" your way through it over and over
    - Smaller levels
        - Since this is turn based, super large levels are obnoxious
- Milestone X | **Movement & Spell Quantity** | Due Date Ongoing
    - Pack 14 | Spell quantity
        - What happens when multiple, identical spells are cast in sequence?
            - Pass a quantity var to the spell and have each spell handle it manually, do not allow them to be .effect() back to back
    - Pack 15
        - Improved force movement
        - Blood trails - use stealth'emup's code, or figure out how to streak blood
- Milestone X | **Juice** | Due Date Ongoing
    - SFX
        - Unit Sounds
        - Spell Sounds
        - Consumable Sounds
        - Splash Liquid Sounds
        - UI Sounds
    - Art Integration
        - 100%: Unit Animations
        - 100%: Projectiles
        - 100%: Use Potion animation
        - 13/15: Spell Animations
        - 20/21: Spell Icons
        - 10%: Cover Art / Steam Page
        - 20%: Biome Tiles
        - Shader animated liquid
        - 0%: Liquid Splash Animation
            - Lava, blood, Water
        - 0%: UI
        - Fix units taking damage animation timing to be when the spell does damage
    - Master music (Brad)
- Milestone X | **Marketing** | Due September 1
    - Trailer
        - Need HUD removal, music removal
    - Steam Page (waiting on art)
    - Website Presskit page
        - Note: Website should just redirect to steampage
- Milestone X | **Beta Testers** | Due October 1
    - Tutorial / Explain prompts based on user actions
    - Optimize game
        - repelCircleFromLine is used for both unit crowding and wall physics and with wall physics it doesn't need a reference to underworld, that's only needed for unit crowding to make sure they don't crowd each other through walls
        - Memory Leaks: call destroy() on any Graphics object you no longer need to avoid memory leaks.
        - Stress test droplets to see how many users they can support
        - Check ImmediateModeSprites for leaks
        - Support large maps
        - Round of wall corners so it doesn't stair step??
            - May depend on art, but would help with optimization
        - Support huge numbers of mobs (100? 500? 1000?)
            - Profile and figure out where the weak points are
        - Delete line segments that are not accessable, like the very outside walls
    - Build following
    - Make survey
    - Send out to testers
    - [Tutorial](https://www.youtube.com/watch?v=-GV814cWiAw)
- Milestone X | **Package as Electron App** | Due November 1
    - Menu for community server selector
    - [Storage and Persistence](https://cameronnokes.com/blog/how-to-store-user-data-in-electron/)
    - [AutoUpdate](https://github.com/vercel/hazel)
- Milestone **Strech 1**
    - Hoist spells
        - Logic to avoid fizzle spells
            - Don't cast res on no dead
            - do this by hoisting and checking pre-cast
            - How to resurrect units you are standing on top of (blocking?)
    - Server customization
        - Turn time
        - Pvp mode (more factions)
    - (M) Standalone server
        - Standalone headless server should be able to be proven out using unit tests
        - No Images, no SFX
        - It should probably just use a global variable that omits visuals
    - Rework "Expand" / AOE so that if affects the radius of any radius using spell (e.g. Bloat)

## Philosophy
    - "rules for copy"
        1. Does the word suggest more than what really happens. (ex: bite != damage)
        2. Numbers are meaningless, use percentages instead. (ex: "Increase cast range by 10%")
    - Explain everything, use popups more than once with a "do not show again" button
    - This game will live or die on the reviews, make sure (like rustlang) that everything is explained well.

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