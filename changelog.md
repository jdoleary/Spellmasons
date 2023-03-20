## 3.20.2023 Spellmasons Update v1.11.0
- fix: Prevent "smoke" from cursed potions
    from emitting during a spell prediction involving Last Will
    Thank you Madgod for reporting this issue!
- tutorial: Skipping Tutorial also skips all Unit introductions
    Thank you Madgod for reporting this issue!
- copy: Fix typo in multiplayer error message.
    Thank you Madgod for reporting this!
- fix: Insufficient Mana spell from actually
    casting on Server
- src: Auto save game on wsPie accidental disconnect
    so players don't lose their progress
- UI: Move player spells under their perks
    since the spells list can get rather long
- fix: calamity miscalculation in multiplayer
    where the calamity options would be chosen based on which player
    last cast instead of each individual player
    Thank you Madgod for reporting this!
- fix: Poisoner AI
    Previously, it was trying to move closer to a different
    unit than it was targeted which resulted in weird behavior where it
    would sometimes not attack.
    Standardized Glop AI too, mana check is built-in
    to canAttack
    Thanks to Spud Bud and Expresso depresso for reporting this.
- UI: Fix tooltip showing last selected unit gif
    even when pickups are selected

- menu: Improve Disconnect handling
    - Prevent auto save on disconnect from saving more than once
    - Prevent intentionally quitting to main menu showing View.Disconnect
    - Fix View.Disconnect doesn't show up if you are in the lobby when the server disconnects
    - Fix **BIG** If the server disconnects when you are in the lobby and then you ready up the map will be out of sync and you'll see units off map
    - Ensure that auto rejoin will only join an existing room and not
    host a new room.  If the server crashes, a new room with brand new state
    should not be automatically created.  Have the users create a new
    room so they know they need to load their auto saved game.
    - Fix menu keeping track of isInRoom state.  Now isInRoom
    is set to true onClientPresenceChanged and false
    onConnectInfo's disconnect message

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