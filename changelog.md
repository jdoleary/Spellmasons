## Spellmasons Update v1.15
- content: Add new unit: "Gripthulu"
    - Thanks MrMarblz and scojbo for encouraging me to resolve issues with "enemies that move players"
## Spellmasons Update v1.14.0 - Wode's Grimoire
- content: Add new unit: "Ancient"
- content: Add new type of Calamity "Stat Calamity" that makes enemies more dangerous

- balance: Continue to allow gaining perks after looping
Thanks S4m for criticism that led to this balance

- src: Improve statCalamity percentages
- src: Choose available statCalamities based on
which units are in the current level so that the next level has
increased difficulty due to calamity.
- src: Add mana refunds for slash
and target_arrow without targets

- UI: Add attack range to tooltip
Add words ("mana", "health") to tooltip
- UI: Add visible level count UI when inventory is open to the top right corner.
Thanks MrMarblz for this suggestion!
Note: Levels past the Deathmason are now displayed with a trailing "+"
to denote that it's a loop level
- UI: Make "Spawn instructions" less obtrusive after level 3. Thanks Mr. Marblz for this suggestion
- i18n: Translate stat calamities

- api: Add pixi particle emitter to modding api

- fix: Prevent Last Will from stacking like the card says it doesn't.
Thanks to MrMarblz for pointing this out
- fix: Fix link to source code in Mods menu
- fix: desync issue
where player loses control of themself.
This was reproducable by having 2 players in a multiplayer came, killing one unit and then
casting Harvest on them. Then the underworld's units array would be
filled with a bunch of units that weren't cleaned up and some were
the player units that still shared the same id, but these 2 changes (changing the
id's of cleaned up units) and removing cleaned up units right
after a sync resolves this issue.
- fix: Support player thought spell icons from mods
Modded icons still have to be manually added to the sprite sheet.
- fix: Add SYNC_SOME_STATE
after every SPELL to attempt to remedy desync snowballing
that sometimes occurred on the same player turn when
multiple spells are cast by having the server only send a
SYNC_SOME_STATE message after every SPELL message
- fix: Archer movement bug
Thanks to scojbo and others (not recorded) for mentioning this issue
- fix: statCalamities not applying double whenever a 2nd or beyond
is chosen. When a new statCalamity is chosen, only apply that one an
extra time to already existing units
- fix: Prevent unspawed players from being targeted by ally magic.
This only impacts multiplayer. Thanks mrman227 and others to reported this issue
- fix: Allow Capture Soul for minibosses
Thanks MrMarblz for pointing this out
- fix: Ghost Archer doing 20 more damage than predicted. Thanks Jackson for pointing out this bug!
- fix: Admin "Regenerate Level" command
- fix: spell mana cost calculations
To allow for mana from manasteal to be used in the same spell.
This uses what mana is left from the prediction player
to see if they have enough mana to cast in the first place
Thanks TonyFTW and JamesGamesA_Lot
- fix: Desync caused by sending initialTargetedUnitId
or initialTargetedPickupId as array. They should be numbers.
Also; somehow in javascript `3 == [3]`

## Spellmasons Update v1.13.0

- Spellmasons source code is now public.  Check it out at https://github.com/jdoleary/Spellmasons

- Feature / Balance: Add cooldown to some cards to make players wait a number of turns before casting them again
- Balance: Make fortify more meaningful
- Balance: Made capture soul's cards more affordable (Necromancers rejoice!)

- fix: hotseat multiplayer skipping player turns after any player dies 
- fix: hotseat multiplayer loading and forgetting which spells were in the toolbar
- fix: Once you hit 0 health from using Death Wager you can no longer cast any spells. Thanks ObsuredCrow
- fix: errors in Copy
- fix: issue where game wouldn't change turn phase if a non spanwed player was disconnected from the game in multiplayer
- fix: Deathwager allowing player health to go to 0 and preventing them from casting (now it won't let you cast it if you have only 1 health) - Thanks ObscuredCrow
- fix: "Insufficient Mana" warning to allow for spells that give you mana to affect the chain.  For example, if you mana steal in a chain of spells you are now able to use that new mana in the rest of the chain - Thanks MuditaMan for reporting this issue.

- i18n: fix: newlines messing up localization for some languages

- UI: Add cooldown badge to cards that have a cooldown
- UI: Fix alignment of modifier icons in tooltip

- Menu: Add "Source Code" link to the Mods menu to take players to the github

- Mod: Expose Events.ts in API - Thanks Blood Spartan
- Mod: Allow F12 key to open console at any time
## 3.31.2023 Spellmasons Update v1.12.0
- Thanks to the following community members for reporting issues or making suggestions included in this update!
    - Blood Spartan
    - Vivid Empress
    - MrMarblz

- Quality of Life: Speed up target_kind

- fix:  Prevent choosing calamities that you've already chosen
- fix: Protect against unit being loaded in with null stamina
- fix: Spell displace sometimes pushing enemies into walls
- fix: Keep perks fresh when user is selecting multiple
    perks on one level, which can happen if player is joining a game late.
- fix: Perk labeling
- Fix: calamities not being given after you run out of spell upgrades

- UX: Don't show player thoughts when hovering over non-game space such as inventory or toolbar.
- mod: export cards/util to API
- mod: mod loading bug where only one mod with a spritesheet could be loaded or else it would error out
    

## 3.20.2023 Spellmasons Update v1.11.0
Thanks to Madgod, Spud Bud and Expresso depresso from Discord and Expirium from Steam Forums for reporting issues that have been resolved in this update!

Improvements: 
- Language Translations: Add missing translations in multiplayer menu and other miscellaneous places
- src: Auto save game on wsPie accidental disconnect
    so players don't lose their progress
- tutorial: Skipping Tutorial also skips all Unit introductions
- UI: Move player spells under their perks
    since the spells list can get rather long
- menu: Improve Disconnect handling
    - Fix: View.Disconnect doesn't show up if you are in the lobby when the server disconnects
    - Fix: If the server disconnects when you are in the lobby and then you ready up the map will be out of sync and you'll see units off map
    - Ensure that auto rejoin will only join an existing room and not
    host a new room if the server crashes.

Bug Fixes:
- fix: Prevent Hotseat Multiplayer from getting stuck in the Lobby Menu
- fix: Not enough portals bug in Hotseat Multiplayer, now if one player enters a portal, it will just move on to the next level.
- fix: Prevent "smoke" from cursed potions
    from emitting during a spell prediction involving Last Will
- fix: Insufficient Mana spell from actually
    casting on Server
- fix: calamity miscalculation in multiplayer
    where the calamity options would be chosen based on which player
    last cast instead of each individual player
- fix: Poisoner AI
    Previously, it was trying to move closer to a different
    unit than it was targeted which resulted in weird behavior where it
    would sometimes not attack.
    Standardized Glop AI too, mana check is built-in
    to canAttack
- Fix: UI tooltip showing last selected unit gif
    even when pickups are selected
- copy: Fix typo in multiplayer error message.

## 3.13.2023 Spellmasons Update v1.10.1
- fix: Target Arrow allowing infinite cast range
    - Thanks to hexingMagus from Discord for reporting this
- fix: Potions triggering effect multiple times
    - Thanks Jacobzeba01 and Madgod from Discord for reporting this
- fix: Issue where multiple levels would be generated simultaneously resulting in enemies appearing out of bounds
    - Thanks Jacobzeba01 for reporting this
- fix: Prevent Ally Priest from adding Summoning Sickness to resurrected player unit which made the player lose their next turn
    - Thanks Firecat from Discord for reporting this
- fix: Prevent Burst from timing out if cast on only dead units
## 3.10.2023 Spellmasons Update v1.9.1

- content: Restore contaminate
- content: Re-add Target Arrow
- content: Adds Cursed Mana Potion
- content: Last Will yields a higher than usual probability of returning cursed mana
    potions
- content: Introduce Calamity Perks after beating the Deathmason

- balance: Flat rate perks instead of %s

- AI: Improve ally Spellmason AI behavior so it will pursue and attack enemies

- balance: Make freeze and debilitate take longer to return to default mana cost.
    Thank you Scojbo from Steam for this recommendation

- translations: Implement language translations for perks and add misc missing translations

- fix: Stop dropping scrolls once players have all the spells
- fix: Protect against red portals spawning player out of bounds
    Thank you AlienSmoke from Discord for reporting this bug
- fix: Burst so that it uses the latest caster position so it will combine properly with movement spells such as dash
- fix: Dark Summoner explanation to match new behavior

## 3/3/2023 Spellmasons Update v1.8.0
- balance: Dark Summoners
    so they start with 40 mana out of 60 so it takes them
    one turn before they can cast and make them regen mana slower.
    Thanks to Sander and Shurimoo for the suggestions
- balance: Dark Summoner summons
    Dark Priests and Mana Vampires instead of more summoners
    to prevent overpopulation from crashing the game

- Translations (i18n): Add Japanese and French and Korean

- refactor: Scrolls to level up system
    Now killing enemies is what dictates how many spells you get.
    This solves for desync issues where pickups determined your spell-gets.
    Also, remove scrolls from disappearing.  Scrolls just trigger the spell-get
    early

- fix: desync: Update lastUnitId when loading Player
- fix: Extra desync protection, send lastUnitId along with SYNC_PLAYERS message
    When lastUnitId is out of sync it opens the possibility of a desync
    where there can be multiple units that share the same ID which can
    result in different results on different clients if one client has the
    shared id bug and another client does not.
- fix: Killing ally player allows scroll to drop
    Scrolls will only drop when killing enemies now
- fix: menu: Fix blank mods screen
- fix: Bug where freezing yourself would result in
    you missing 2 turns instead of one because
    your turn got ended before the modifier got added to
    your unit which meant when the onEndTurnEvent fn ran,
    there was no freeze modifier to remove and so it didn't get removed
    until the next turn.
- npm: @websocketpie/client@1.0.0
    Upgrade wsPie client so that it doesn't handle client messages immediately by default.
    Client messages will bounce off the server before being handled to
    alleviate desync issues
- optimize: Throttle PLAYER_THINKING messages
    Prevent messages from sending with no cardIds (unless it's clearing a previous thought)
    Before this change the server was being inundated with messages because
    every client was sending a player_thinking message on every mouse move

- UX: Give players immediate feedback if they send
    SPAWN_PLAYER while other messages are still processing
- UI: Fix updating unit health and mana bars
    at the start of player turns and after ending player turns.
    This is triggered manually so that the player doesn't have to move their
    mouse to get the updated prediction UI


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