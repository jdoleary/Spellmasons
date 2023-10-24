## Spellmasons Update v1.21
Thanks to Pandize for general feedback!

feature: Teleport Trap!  After level 5, at least 2 blue portals will spawn
that will allow players to teleport around the map.  They are one-use only
Thanks Skillo

fix: UI: Ensure spell costs are up to date in the inventory
    Thanks Mattmellow and Lemdoran for reporting this

UI: Allow modifier keys (ctrl, shift, alt) in hotkeys
    Assign hotkeys to side bars
    Thanks Lemdoran and Skillo

fix: Ensure Pickup's emitters follow them
    if they move (like pushing a portal)

fix: Attempt to fix duplicate pickup
    issue on multiplayer
    where a recently triggered pickup
    is recreated.

src: Optional support for server-bun

fix: if over max hp, ensure healthcost spells
    don't snap hp to max.
    It is unusual to go over max hp but sacrifice does it.
    Thanks enigmaticbacon

fix: If spellcost is refunded cooldowns are too
    
    Refund freeze if no targets
    Thanks Kekis!

fix: Prevent deathmason death from killing all AI
    unless it is the original deathmason.  Any summoned deathmason
    should not kill ai.
    Thanks H4D3S for reporting

UI: Hide broken images in Jprompt
fix: hiding broken tooltip images

src: Make urns spawn in some levels
    Prevent 0 probability units from spawning in getEnemiesForAltitude2
    
    Note: Urns are spawned separately from the unit budget

UI: make explosive urn damage visible on tooltip
feature: Add urns

fix: Clones and split units don't provide experience
    when killed
    Thanks enigmaticbacon for reporting this

i18n: Update Portugues Translation
    
    Thanks to Iwashi kan ツ

fix: Players that rejoin should have endedTurn set to false
    
    so they don't miss their turn when another player ends
    their turn.
    Thanks Kess from Discord!

fix: Ensure saves can only be made during
    the player turn so it doesn't save a corrupted game state

fix: After load, set all player.endedTurn to false
    so that loading a game wont skip the player turn
    if players rejoin the game in an order where the first
    person to join/load had ended their turn during the save

fix: Rerolling sometimes presents the same spell
    you just saw
    
    Thanks Lemdoran

feature: Spawn blue portals after level 5
    for player movement

fix: valid spawn logic for blue and red portals
    it was denying valid spawn for portals that were close to walls that
    should've been valid

balance: Reduce probability of trap pickup
balance: Increase number of pickups along with level size

balance: Immune units CAN be targeted
    but cannot be damaged or recieve modifiers
    (like curses)

fix: target_arrow granting infinite range if
    cast standing right up against a wall
    Thanks Stench and others from Discord for reporting this issue

fix: Extra stat points hack
    where you get extra lvl up stat points whenever
    you load the game
    Thanks Salazar for reporting this!

fix: UI: Ensure spell costs are up to date in the inventory
    Thanks Mattmellow and others for reporting this

fix: Prevent Deathmason brothers
    from attacking immediately after spawning if the original deathmason
    is slain by an ally npc.
    Thanks flowkrad from Steam and others for reporting this

fix: Ensure mage classes are visible on 1080p
    screen
    Thanks Coaldust Numbers and others for reporting this issue

## Spellmasons Update v1.20
feature: On loop levels, half of the enemies are
immune for 1 turn.
This is to address the one-spell-clear-level builds
and improve difficulty in later levels

balance: make Necromancer class summon spells 30% cheaper
Thanks Antonio! and Expresso Depresso and others for feedback

src: Ally deathmasons now summon
blue portals which heal you if you walk through them instead of
hurt you like red portals do.  (If you do not walk
through them,  they still spawn allies)

fix: Prevent Deathmasons from health-sapping each other.
Thanks Antonio! for reporting this!

fix: Calamities not increasing health and stamina stat of enemies
Thanks Antonio! for reporting this!

fix: findRandomGroundLocation
for summoner to make better guesses at potential
spawn locations within summoner attack range.
This fix prevents the issue where some of deathmasons brothers weren't
spawning because it was considering the entire level

fix: Cloned player blood cursed
also secretly blood cursed player without reporting in UI.
Thanks MeBeDerp for reporting this!

balance: Temporarily remove bloodmason class
until he can be properly balanced.

UX: turn off player damage sfx for timemason
so it's not annoying

UI: Add TIMEMASON_DAMAGE_AMOUNT to timemason card

fix: Enemy priest resurrecting Player
and changing player's faction.
Thanks Ian for reporting!

css: Fix size of mana badge
modified by usage when large in card-inspect

fix: deathmasons teleporting to the same portal
causing them to overlap

fix: Limit uiZoom lower bound to 0.1
Thanks Hagbard from Discord for reporting the issue
## Spellmasons Update v1.19
balance: Increase difficulty of early levels
balance: Make Ancients cost more in the level budget for spawning
balance: Increased damage of poison spell from 10 to 15 damage per turn

content: Add Mage Classes
content: Revise per level upgrades to be stats points rather than perks
content: Add 2nd stage of Deathmason battle
content: Change to lvl up / experience system instead of scroll pickups

performance: Add perf option to disable emitters
    Thanks to @XzeroAir on Discord

art: Fix target similar and connect lines
    animating father than they should
UI: Make level up progress bar in tooltip
UI: Add victory stats to class selections

fix: Bug where ancients
    spend mana per target instead of per cast
    which caused their mana to go negative at times.
    Thanks @Expresso Depresso for finding this bug!
fix: Undesirable smoke on pickups
fix: Priest should resurrect ANY dead unit into their faction
    not just corpses of allies

## Spellmasons Update v1.18
- balance: Prevent deathmason from purifying self
- balance: change decoy health from 20 to 70

- UI: Display Cast Range perk as %
    Thanks Krowbar for this suggestion!
- menu: Show mod contents in description
- UI: Add mod name to cards

- fix: Make lastWill immediate so it doesn't
    cause desync on multiplayer
- fix: mods registering multiple times
    which messed up probabilities (especially with pickups)
- fix: Prevent allowing rejoin to failed game
    by changing difficulty.
    Thanks Krowbar for finding this bug!
- fix: Prevent Split players from being permanently
    split when they die
    Thanks to sJacob for pointing this bug out!

## 2/17/2023 Spellmasons Update v1.7.0
- feature: Add mod support for Units, Pickups, Spells, Art, Audio
    - Supports singleplayer, multiplayer, saving/loading games with mods
- feature: Add Hotseat Multiplayer so players can play together on a single computer
    - Supports saving/loading games with hotseat multiplayer

- UI: Add scrolling to spell queue box for super long spells do it doesn't cover too much of the screen
- UI: Ensure "Game Over" button is always visible even in cases where stats are super tall.
- UX: Increase speed of "Slash" for super long combos
- UX: Limit how many visual stacks of "Rend" animate to prevent the player from having to wait too long for a super long "Rend" combo

- fix: Prevent player's turn from ending mid cast.  This addresses the desync that occurred when a player would resurrect themself at the end of a spell that killed them.
- fix: Prevent game over screen from popping up if you resurrect yourself
- fix: Gold circle under player character's feet not showing up sometimes

## 2/9/2023 Spellmasons Update v1.6.0
- fix: Desync occuring anytime "slash" was followed by a spell that took remaining health into account (such as "Bleed" or "Capture Soul")
- src: Fix desyncs involving spells' initial targets
- fix: Deathmason crashing after resurrecting, not spawning red portals, etc
- fix: prevent loading corrupted savefile
- fix: enter portal crash loop
- fix: Only living units can aquire pickups
- fix: Skipping a level when an NPC ally finishes a level while you're dead
- AI: Make ally AI spellmason follow you rather than pursuing enemies

- balance: Prevent cloning scrolls

- UX: Improve explanation if server is behind in version
- UX: Add special message for when servers are down
## 2/7/2023 Spellmasons Update v1.5.0
- balance: Units that remain in liquid at the end of their turn will take damage again
- balance: Make ranged units move out of liquid once it's their turn

- fix: Player sometimes clicking on spell upgrade and not getting it
- fix: "Target Similar" spell so it matches units of the same faction as the initial target (prevents accidentally targeting allies)
- fix: Desync issue where clients experienced random number generation drift
- fix: Add 70 character limit to player names
- fix: Make Deathmason's particles disappear when he dies
- fix: Prevent "Conserve" from being able to kill you
- fix: Issue where under some circumstances players could pick more than one spell upgrade for a single scroll pickup (was known to happen when a whole lot of enemies were killed at once and no enemies remained on the level) 
- fix: Sync health, mana, and stamina at the start of every turn (this fixes the issue where some changes to health/mana/stamina weren't reflected in the bars until the user moved their mouse)

- UX: Add glow to floating toolbars when dragging a spell to denote that they are available to recieve a spell
- UI: Prevent "no more spells" message from taking too long to clear out in late game after you clear a large number of enemies
- UX: Prevent camera from snapping to the center of the map after player dies
## 2/5/2023 Spellmasons Update v1.4.0

- fix: Resolve portal not spawning on tutorial level
- fix: Prevent the camera from snapping to center of the map after player death

- UX: Delay game over modal on death so it does not obscure how the player died

- feature: Any unit (including the player) that remains in liquid at the end of their turn will take damage from that liquid again

## 2/4/2023 Spellmasons Update v1.3.0

- Feature: Support auto reconnect attempts when client loses connection to the server
- Quality of Life: Increase arrow speed when firing an absurd amount of arrows (thank you Omni from Discord!)

- fix: **significant** Pickup (portals, potions, etc) synchronization by sending pickup creation over the network and stablizing pickup ids
- fix: Target Kind so it wont target you or allies
- fix: Deleted save files getting restored after reboot
- fix: Localization screen not showing all language options on some resolutions
- fix: When a player dies, their turn is now ended automatically since they're dead and can't take their turn

## 2/3/2023 Spellmasons Update v1.2.0
- fix: Overhaul unit and pickup syncronization issue.  This will address many (but not all) of the syncronization issues people have been experiencing in multiplayer
- fix: Summoner appearing submerged after he teleports out of liquid
- fix: Another sync issue with "Bleed" spell causing the server to pause for 10 seconds
- fix: Connect prioritizing the wrong unit / pickup / corpse connections
- fix: Multiple targeting spells not combining properly
    - This is a regression bug intoduced in v1.1.1.  With it fixed, now spells like "target cone + push + target circle" will work as expected

- UX: Limit length of multiplayer thought bubbles so they don't cover too much space if an ally is casting a large spell

- feature: Re-enable Loading saved games in Multiplayer
    - Note: This feature is still a little clunky if you are rejoining a save where the same players are not present.  It allows you to assume control of a different player character while in the lobby if, for example, you were to load your save game on another computer or with different friends than you saved it with.
    - I expect Loading multiplayer saved games may not work perfectly, but I put it back in so people can atleast try it.  Please let me know in Discord if you encounter any issues with it

- Quality of Life
    - Increase speed of high quanity arrows so the spell animation doesn't last too long

- i18n: Add support for 中文(简) zh-CN and 中文(繁) zh-TW.  Thank you Cie from our Discord Community



## 2/1/2023 Spellmasons Patch Report v1.1.0

- balance: Remove Nullify spell because it was way too powerful in the endgame (I may rethink a way to reintegrate it later)
- balance: Increase difficulty after "looping" (after level 12)
- balance: Increase clone expense scaling (it now takes longer to return to base mana cost)

- menu: Add link to "How to Host" youtube video in multiplayer menu
- UX: Make WASD camera speed relative to zoom level

- improvement: Handle multiplayer thought bubbles concurrently.  They no longer wait until other players are done casting to be processed and visible to the other players.
- optimize: mana steal particles

- fix(Multiplayer sync issues): Rend timing out
- fix(Multiplayer sync issues): Potion pickup discrepancies
- fix(Multiplayer sync issues): Red portal spawn locations and teleport locations
- fix(Multiplayer sync issues): Player location discrepancy between clients and server (off by decimal values)
- fix: prevent Deathmason red portals from overlapping which could cause more damage to the player character than expected
- fix: Soundtracks overlapping bug
- fix: "0.1%" to "10%" on Fortify spell description
- fix: Remove Priest unit's unused Damage stat
- fix: Prevent ally Deathmason from killing you with "Sacrifice"
- fix: Ally Deathmason now spawns new enemies on the correct faction
- fix: Prevent miniboss priest from going into negative mana
- fix: target + movement spells not combining properly
- fix: ensure particle emitters are cleaned up properly
- fix: Sometimes not enough Perk choices generating
- fix: Prevent ending your turn before you choose a spawn
- fix: Spell upgrade choices not refreshing between new games
- fix: "Ready" button not working in lobby if you quit and rejoin game
- fix: Allow overwriting save files with the same name rather than keeping duplicates
- fix: Temporarily disable "Contegous" until it's reliablity can be assured under any circumstance