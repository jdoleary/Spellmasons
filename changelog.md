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