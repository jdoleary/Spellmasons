## Low hanging fruit
- small bugs:
    - should be able to disable UI without admin mode on
    - dead units in front of walls render behind walls
    - swap then damage hurts yourself also, it shouldn't be this way it should hurt the target
    - after swapping I got stuck in a wall
    - missing vampire hurt noise (when you push them into lava)
    - Mana burn should show via prediction mana bar how much it'll take away
    - if you pull something into you and you're standing on the edge of liquid you take damage as if you fell in the liquid (on blood level)
    - mana burn sfx and animation plays one at a time instead of all at once so if you have multiple targets it's annoying, also it doesn't wait for the animation to be done before playing the next spell so burn then hurt overlap
    - spells like mana burn and hurt shouldn't play on dead units
    - no summoner sound effect when cast?
    - sometimes when you walk you get stuck on a wall and it wastes stamina
## Today
- fix multiplayer sync issues
- record new screenshots and footage (zoomed in, no music)
- Add gifs to steam page
- push bloat hurt prediction resulted in weird prediction lines

# Bugs
- Permanently fix liquid
- chain through pickups?
- Bug: Should sync portals when syncing units if all enemies are dead
    - I think just sending pickups to sync would work here
- weird liquid : 0.5211362200270263
## Tasks
- getting unit sync issues in multiplayer
- Need UI sound interactions
    - Think of warcraft 3 frozen throne
    - **not** for hover states
    - button clicks
    - left click
    - spells
    - book opening for inventory
    - volume plays as you change sound settings
    - a "you died" (gta wasted)
    - quieter end turn in multiplayer
    - sounds that lets you know everyone is waiting on you
    - warnings: out of stamina, no target, out of range (see breath of the wild)
    - missing sfx for vulnerable/debilitate
- cast line should connect to the feet not your center
- Feature: perks
- Feature: "Soul bind" - bound units share applied effects
    - Use PIXI.SimpleRope https://pixijs.download/dev/docs/PIXI.SimpleRope.html
- Standalone server backlog
    - (fixed?) stand alone server goes into infinite loop when all players leave
    - When does stand alone server remove a room?
    - Test standalone server with friends
- use card background for upgrades with different colors depending on rarity
- rework expand, it's predictions are often way off.  Maybe it would do better to just increase the radius of all spells?
- Spell Modifier effects visual representation to stay on units
    - debilitate
    - blood curse
- If player joins mid enemy movement it will force reset them
- on refresh (with only 1 client in room) the server reseeded level but my position stayed the same
- rework exp
- bug: when i quit a game and start over it gives me the resurrect optoin
    - or it maintains some state, like all the spells in my inventory
- Ensure hurt is presented in first spell picks
- game slows down when there's a lot of blood on the screen and it's painint more
- How does endgame scale now that strength doesn't depend on the levelIndex?
- Show modifiers in UI somehow, not just on player, especially when you have the modifier on you

## Stretch Content
- "overwatch" where some archers can shoot even not on their turn if you walk in their LOS
- Upgrade: Start each level with 2x mana overfill (think of new upgrade "perks")
- What if potions drop from slain enemies instead of being just pickups on the ground, it would be more exciting if you needed one and it dropped.
- Task: An ally that has died at all (even if ressed) should lose their upgrade priviledge
- whole bodies of liquid should be selectable so that they can be frozen
    - freezable liquid to walk over
- Cannot be combined with other spells
    - Jump card- to jump over walls
    - card to temporarily increase cast range
- vortex card - to pull units in to a center location
- Content: Time crystal releases something when it breaks
- Content: An enemy that pulls you into danger
    - a blue poisoner
- Content: "Orge" enemies that get stronger for every ally of theirs that dies
- An enemy that consumes allies to get stronger
- Specific barriers or walls that can't be cast through
- Content: A spell to destroy corpses
- task: Spell to trade mana for stamina
- idea; one use bargains (deals with the devil) that mix up your max stats.  or have a50% chance of good or bad outcome
- Leave blood trails behind for dead units that are force pushed
- Card: An attack range minimum but not a maximum so you CAN"T attack if they are too close
- Casting curses on liquid should change the liquid type (lava/hurt, purify/water, poison)
- More "Quantity" implementations for spells beyond hurt
- Spell: grappling hook (pulls your towards something)
- Change AOE behavior so that it just expands radius
    - This radius expansion should work for ANY spell that uses a radius: vortex, bloat, chain, etc
    - Maybe it only modifies the spell directly after it
- Spell: Range, like aoe and chain but extends your range


## Misc
- **critical** Improve sending castCards with targeting based on id not position
- (wont do?) Make an overlay screen that blocks interaction while waiting for sync
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther