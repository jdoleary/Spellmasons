# Critical Path (4st deadline revision)
- Core:
    - Resolve desync
        - Write code that looks for desyncs but doesn't try to resolve them.
        - The trouble with my desync code until now is that it doesn't check what step of the game it was sent and received.  Is it turn 4 playerIndex 2?  IF it gets sent at that time but as it's going over the wire player 2 takes their turn, it will think there's a desync.
    - ✔ Resolve pathing
    - Ending your turn shouldn't feel like a chore
        - If no one else is alive, it should end your turn automatically
    - More random generation.  This isn't a rogue-like without the random element
        - Take queues from slay the spire
- Opt-outable Tutorial 
    - Button in the menu: "Skip tutorial"
    - Use doodads to communicate
    - What it teaches:
        - Level 1
            - Movement
            - The Portal
        - Level 2
            - Pickups
            - "hold shift to inspect"
            - Casting
        - Level 3
            - Chaining Spells
        - Level 4
            - Order of spells
- Finish Content / Endgame
    - More Spells
    - More enemies
    - Bosses
- Youtube Alpha version video / Post on social
- Menus
- Options
    - ✔ Volume
    - ✔ Cookies
    - If they didn't accept cookies, allow them to reaccept in options
- Homepage
    - Embedded video
    - News
- Art in Blender / Shaders / Juice
    - Tiles: https://opengameart.org/content/dungeon-tileset
    - https://opengameart.org/content/rogue-dungeon
- [SFX](https://www.asoundeffect.com/sound-library/metamorphosis/)
    - Adobe? https://www.adobe.com/products/audition/offers/AdobeAuditionDLCSFX.html
- [Tutorial](https://www.youtube.com/watch?v=-GV814cWiAw)
- ✔ Monitoring: Sentry.io
- April 30: Release
- Open Source
- Engage community in making new spells

## Deadlines
- ~~My part (gameplay) should be finished end of Feb 2022~~
- ~~Entire game should be ready to ship end of March 2022~~
- ~~My part (gameplay) should be finished end of March 2022~~
- My part (gameplay) should be finished end of April 2022
- ~~Entire game should be ready to ship end of April 2022~~
- Entire game should be ready to ship end of May 2022
- Keeping to a hard deadline will ensure that I iterate and keep making more games and improving
## Thoughts
Don't get stuck on feature creep.  Finish the game and get it out so you can move on

I will succeed with iterating on making many games similar to each other because I will continue to get better at them.  I must prioritize shipping and use hard deadlines to cut features so I don't get stuck with a forever project.
If I make the art myself (blender) and the music, I will both save my "runway" (dangerous game funds) and incrementally improve at those things too making me faster and more effective AND I will have assets that I can reuse.

## Advice from Elon:
1. Make your requirements less dumb.  Everyone is wrong sometimes even smart people, and your requirements are definitely dumb
2. Try very hard to delete the part or process.  If you're not occasionally adding things back in then you're not deleting enough.
3. Simplify or optimize.  Note: It's the third step for a reason. Possibly the most common error of a smart engineer is to optimize a thing that should not exist.
4. Accelerate cycle time.  You're moving too slowly, go faster.
5. Automate

## Advice from GMTK:
- Players must be rewarded or forced to do something risky and fun or they'll do something easy and boring.
- If something is at the heart of your game, it needs to shine through in every aspect.