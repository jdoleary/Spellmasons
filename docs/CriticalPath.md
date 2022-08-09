# Critical Path
- Milestone | **Trailer-ready Alpha**
    - Test standalone server with friends
    - Fix environment background
    - Need sfx
        - 3 types of player casts
        - death sounds
        - heal
        - aoe
        - bloat
        - blood curse
        - chain
        - clone
        - contagious
        - debilitate
        - delay
        - freeze
        - mana burn
        - mana steal
        - poison
        - protection
        - pull/push/swap
        - purify
        - resurrect
        - shield
        - summon decoy
    - Need spell effects
        - aoe
        - bloat
        - blood curse
        - chain
        - contagious
        - debilitate
        - pull/push/swap
        - purify
        - shield
        - summon decoy
- Milestone X | **Juice**
    - SFX
        - Unit Sounds
        - Spell Sounds
        - Consumable Sounds
        - Splash Liquid Sounds
        - UI Sounds
    - Art Integration
        - 10%: Cover Art / Steam Page
        - 20%: Biome Tiles
        - 0%: Liquid Splash Animation
            - Lava, blood, Water
        - 0%: UI
    - Master music (Brad)
- Milestone | **Marketing** | Planning on September 1
    - See Marketing.md for more info
    - Trailer
        - Need HUD removal and music mute button
        - Need biomes
        - Need sfx
        - Need spell effects
    - Steam Page (waiting on art)
    - Website Presskit page
        - Note: Website should just redirect to steampage
- Milestone X | **Perfect Prediction Attacks**
    - I got bit by a vampire but it didn't accurately warn me he would
        - wrap this in with preventing units from changing targets from their prediction even if the decoy dies (lobber move then throw?)
    - Resurrect icon didn't show in prediction when it was buried in a trap that I pushed someone into (in prediction)
    - Units should NEVER change target from their prediction. A case where this happened is when a decoy died from other units attacking it
    - Grunt attack predictions are not perfect. See branch 'perfect-predictions'
    - Move predictionUnits and predictionPickups out of globalThis so they don't get clobbered when multiple instances on a single server
    - Known issues:
        - bloat doesn't show prediction damage
        - push predicted taht a lobber would fall in lava and die but it didn't
            - that same lobber when resurrected just crawled over lava so it must've been inside but just didn't take the damage
- Milestone X | **Doodads**
    - More interactable doodads (explosive barrels, movable cover)
- Milestone X | **Beta Testers** | Planning on October 1
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
- Milestone X | **Package as Electron App** | Planning on November 1
    - Menu for community server selector
    - Allow running local standalone server from inside app
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
    - Rework "Expand" / AOE so that if affects the radius of any radius using spell (e.g. Bloat)
    - More enemies
        - Color enemies different colors and give them different behavior. For example, a blue "poisoner" could be like the "smoker" from left4dead

## Philosophy
    - "rules for copy"
        1. Does the word suggest more than what really happens. (ex: bite != damage)
        2. Numbers are meaningless, use percentages instead. (ex: "Increase cast range by 10%")
    - Explain everything, use popups more than once with a "do not show again" button
    - This game will live or die on the reviews, make sure (like rustlang) that everything is explained well.

## Definition of Done
- DONE Stable Multiplayer
- Supports 1000 units
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