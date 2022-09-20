- graphics bug under health status bars, colored line
- clone, connect, pull didn't work on pickups: connect doesn't work on pickups
- when recording, don't play turn sfx
- player gold circle underline renders over top of player
- trailer copy: "Each spell influences the next"
    - Noita 1.0 trailer as reference
- Record trailer footage
- Implement Jake's UI design nplayer ready states
---
## next up
- melee prediction is still off
- attack range shouldn't be red when explosion radius is red
- bug: Brad got "invalid target" when trying to cast on the top of a wall but he was using "expand" so it shoul've been valid cause there were targets in the radius
- Improve out of range targeting: if any part of a unit is in range, then targeting it must be allowed
- small bugs:
    - Sometimes it tries to path around things and wastes stamina if there isn't a straight line path
    - when your main mana bar has 0 mana left it doesn't show the diagonal lines
    - sometimes when you walk you get stuck on a wall and it wastes stamina
# Bugs
- Permanently fix liquid
    - weird liquid : 0.5211362200270263
- chain through pickups?
## Tasks
- art: Spell Modifier effects visual representation to stay on units
    - debilitate
    - blood curse
- Ensure hurt is presented in first spell picks

# Long Term
- How does endgame scale now that strength doesn't depend on the levelIndex?
- What if cards could cost you things other than mana, like health, or even speed?? 0.o
- Make pickups destructable (even portal - which could spawn in at another location if you destroy it - aim to plesantly suprise players)
- Security
    - Since I'm using electron, I should evaluate my dependencies for safety: https://www.electronjs.org/docs/latest/tutorial/security#security-is-everyones-responsibility
    - [Security Recommendations](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations)
- Polish
    - [Add Juice](https://itch.io/b/1219/gamedev-pro)
        - (M) Animate cards
            - https://3dtransforms.desandro.com/perspective
            - https://3dtransforms.desandro.com/card-flip
            - Use transform3d functions to trigger hardware acceleration: "In essence, any transform that has a 3D operation as one of its functions will trigger hardware compositing, even when the actual transform is 2D, or not doing anything at all (such as translate3d(0,0,0)). Note this is just current behaviour, and could change in the future (which is why we don’t document or encourage it). But it is very helpful in some situations and can significantly improve redraw performance."

## Stretch Content
- Card: Mind Control (changes faction temporarily)
- Feature: perks
- Feature: "Soul bind" - bound units share applied effects
- Ghost archers: Arrow only hits target, no piercing
- Piercing arrows as default for archers
- perk: long range cast only
- Heavy damage spell: rend
- Idea: Level up spells along with perks
    - Leveling up could auto increase quantity / lower mana cost / speed mana recovery
- Idea: "overwatch" where some archers can shoot even not on their turn if you walk in their LOS
- Spell: A spell like AOE, but adds radius to existing spells
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


## Multiplayer Enhancements / issues
- if you choose a spawn position while another player is casting it waits and then spawns where you clicked, which can be confusing because it still looks like you can choose where to spawn
- if you can MOVE_PLAYER while a super long cast is being triggered.
    - you cannot, find a way to handle this for multiplayer so it's communicated that you have to wait to cast until someone else has finished casting
    - IMPORTANT: Change the store description:  `Spellmasons uses innovative faction-based turns: You and your fellow mages can all move, cast and act simultaneously.` if needed
- If player joins mid enemy movement it will force reset them
    - this is still an issue: as of 2022-09-16
## Misc
- **critical** Improve sending castCards with targeting based on id not position
- (wont do?) Make an overlay screen that blocks interaction while waiting for sync
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther