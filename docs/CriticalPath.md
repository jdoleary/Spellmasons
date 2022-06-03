# Critical Path
- Big Tasks
    - Polygon2 - Refactor Line Segments
    - Implement new tile "sewing" with Che's assets
    - Restore unit "crowding" once all linesegments (pathing, liquid, walls) are finalized with Che's tileset
    - Liquid "magnets": if you get close enough to the edge you "fall in"
    - Standalone server
- Final Steps
    - [Tutorial](https://www.youtube.com/watch?v=-GV814cWiAw)
    - Optimize
        - Support large maps
        - Round of wall corners so it doesn't stair step??
            - May depend on art, but would help with optimization
        - Support huge numbers of mobs (100? 500? 1000?)
            - Profile and figure out where the weak points are
    - Multiplayer Community Servers
        - Stress test droplets to see how many users they can support
    - Convert from wsPie to standalone server
        - Enable simultaneous turn taking for players
    - Improved Menu
    - Aesthetic
        - Juice / SFX / Music
    - (Lastly) Package as Electron App
        - [Storage and Persistence](https://cameronnokes.com/blog/how-to-store-user-data-in-electron/)
        - [AutoUpdate](https://github.com/vercel/hazel)
    - Stretch Goals
        - Pvp mode
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
- Core Gameplay done by 5/30
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