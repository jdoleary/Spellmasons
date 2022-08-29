# Parallel Focuses
- Prep for Multiplayer
- Record Trailer and start marketing
    - trailer should be more zoomed in
- Miscillaneous bug smashing
- thought: Again questioning the utility of this game as a roguelike.  What if you are just challenged to solve different scenarios?

# Desired Schedule
- August / September
    - Start Marketing
- October / November
    - Finish UI
    - Reliable Multiplayer
    - Package as Electron App
- December / January
    - "Explain Engine" (Adaptive Tutorial)
    - Beta Testing
    - More content depending on how marketing is going
    - Finish polish and reliability
    - Release
# Critical Path
- Milestone | **Ready for Multiplayer**
    - Fix sync issues
- Milestone | **Marketing** | Planning on September 1
    - Get mastered SFX from Brad
    - Improve the steam page with gifs and more description, see Marketing.md
    - Figure out how to separate audio tracks
        - https://obsproject.com/forum/resources/win-capture-audio.1338/
        - discord on phone
        - my voice on separate audio track in OBS
        - Game audio in OBS
        - Remember
            - Vary the amound of zoom, you should be close enough for those viewing on a small screen
            - Do you want your mouse recorded
            - Music OFF, **REMEMBER MUSIC OFF WHEN RECORDING**
    - Record multiplayer playtest
    - Make Trailer
    - Start marketing
- Milestone | **UI**
    - Inventory
    - Menu
    - Upgrade cards
    - Toolbar
    - Health / Mana / Stamina bars
- Milestone | **Final Content**
    - Perks
    - Fix liquid generation bugs
    - resurrection particles
    - add boulder
        - movable cover
        - deals damage when pushed
    - Need spell effects
        - aoe
        - blood curse
        - chain
        - pull/push
    - Liquid Splash Animation
        - Lava, blood, Water
    - Rework "Expand" / AOE so that if affects the radius of any radius using spell (e.g. Bloat)
- Milestone | **Beta Testing** | Planning on October 1
    - Tutorial / Explain prompts based on user actions
    - Optimize game
        - repelCircleFromLine is used for both unit crowding and wall physics and with wall physics it doesn't need a reference to underworld, that's only needed for unit crowding to make sure they don't crowd each other through walls
        - Memory Leaks: call destroy() on any Graphics object you no longer need to avoid memory leaks.
        - Stress test droplets to see how many users they can support
        - Check ImmediateModeSprites for leaks
        - Support huge numbers of mobs (100? 500? 1000?)
            - Profile and figure out where the weak points are
    - Build following
    - Make survey
    - Send out to testers
    - [Tutorial](https://www.youtube.com/watch?v=-GV814cWiAw)
- Milestone X | **Package as Electron App** | Planning on November 1
    - Menu for community server selector
    - Allow running local standalone server from inside app
    - Integrate Steam friends for joining the same server
    - [Storage and Persistence](https://cameronnokes.com/blog/how-to-store-user-data-in-electron/)
    - [AutoUpdate](https://github.com/vercel/hazel) Not needed because of updates through steam?
- Milestone **Strech 1**
    - Explosive barrels??
    - [Mod support](https://partner.steamgames.com/doc/features/workshop)
    - Hoist spells
        - Logic to avoid fizzle spells
            - Don't cast res on no dead
            - do this by hoisting and checking pre-cast
            - How to resurrect units you are standing on top of (blocking?)
    - Server customization
        - Turn time
        - Pvp mode (more factions)
    - Spell ideas:
        - A "Long Shot" Spell that increases your cast range (but maybe you can't cast close so you're only a sniper)
        - vortex
        - grappling hook
        - confuse
        - Auras that combine with other spells (poison + aura = thorns aura or DOT)
        - Bleed like blood seeker from Dota
    - Perks | "upgrades" with some random attributes
        - % chance to get more stamina on level start
        - start level with 2x mana
        - % chance to start level with mob on your faction
        - % chance that casting wont consume mana
        - % chance to freeze on damage
        - one time: 50/50 chance to incrase max stat or decrease it
        - make 1 random spell permanently more expensive and another permanently cheaper
        
    - More enemies
        - Color enemies different colors and give them different behavior. For example, a blue "poisoner" could be like the "smoker" from left4dead
        - Boss enemies

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