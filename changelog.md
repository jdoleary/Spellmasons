## 1.30.0
- Feature: "No Gore" mode - removes gore from the game if desired
- Feature: Purify now works on Cursed Mana Potions
    - Thanks @Koliostro for this AMAZING idea

- Fix: prevent network messages from old levels from executing
on a new level.
    - Thanks @ReddPine, @Raven, @MrMarblz and others for reporting

- Fix: player stamina unexpectedly getting set to 100
    - Thanks @Innonminate for reporting

- Fix: Potions spawned from Urns with Last Will from appearing at 0,0
    - Thanks @Innonminate

- Fix double decoy scaling

## 1.29.0
- UI: Add hotkey numbers to side card holders
    Update hotkeys of spellbar if they change in controls
    Closes: #494

- Fixed Server Crash due to broken kill switch (#490)
    Fixed kill switch and server crash

- Await Cleanup for ProgressGameState (#484)
    * fix: await changeToHotseatPlayer call
    in changeToFirstHotseatPlayer
    
- fix: Ally deathmason not summoning
    units on levels with Natural blue portal pickups.
    Fixes: #486

- Deathmason On Death Event Fix (#467)
    * Boss spawns with originalLife = True
    * Ensure Deathmason gets onDeathEvent

- Waves Fix (#460)
    * Improved Handling for GameLoop and Waves
    * No longer waits for frozen players to enter portal

- fix: Players suddenly at -1000,-1000
    
    Old code was attempting to let players rechoose their
    spawn if they got out of bounds
    but this unfortunately just would make them
    be not-choosing spawn and at -1000,-1000.
    
    I also tried just setting isSpawned to false
    to let them rechoose spawn but that results
    in all the enemies dying.
    So let's just not do anything if they're out of bounds.
    
    Fixes: #457

## 1.28.0
###  Major
- Added Spell: Potion Shatter
    - Shatters a potion to apply its effect to all nearby units
    - The area of effect increases with each stack of the spell
- Mana Vampire Changes
    - No longer reduces maximum mana
    - Steals up to 40 mana from its target with each attack
    - Can spend up to 40 mana each turn to heal itself
- Deathmason
    - Spawns after the players have taken their first turn, as to not reveal his location early
    - Has a sick intro animation
- Steam Overlay
    - Pressing [Shift+Tab] in the Steam verison of the game will open the steam overlay
- Tutorial Improvements
    - Players start the tutorial with Target Cone, Slash, and Push
    - Stat points earned in the early stages of the tutorial are auto-allocated to Max Health instead of being removed entirely, as to not make players' first sessions more difficult
    - Many other Tutorial fixes: Most listed at the bottom of the changelog
- Huge Game State Refactor: This refactor encompases many different game systems and fixes. It should make the game much more stable and prevent softlocks
    - The end turn logic accounts for unspawned players, players that can't act (due to being frozen, dead, etc.), and should handle other edge cases more consistently
    - Players can end turn without needing to enter the portal and should never have to end their turn multiple times to progress the level
    - Fixes an issue that sometimes caused players to choose their classes at different times - Thank you @Moonlighter
    - Ally units have their end turn effects applied at the end of their turn, instead of at the end of the enemy turn
    - Improved unit turn order. Ex. Ranged units will always complete their action before Priests take their turn
    - Smart targeting factors in unit turn order, making it much more predicatble
    - Units are much less likely to make targeting mistakes, such as targeting an enemy unit that's already been killed by another unit
    - Planning view attention markers consider smart targeting, fixing an issue that rarely caused false prediction markers, especially with decoys around
    - Additional waves spawn the turn after all enemies are killed, instead of spawning immediately - Thank you @BrewBreuw
    - High scores are reliably tracked in online multiplayer, and for all hotseat players
    - Completing a level and dying within the same series of events should favor the player and progress the level, instead of ending the game immediately
- Rework for client ID's, which should
    - Improve lobby handling for online lobbies to prevent issues such as duplicated players
    - Allow saved hotseat games to be loaded in an online multiplayer lobby
    - Ensure spells and network messages always target the correct player in hotseat (I.E. Freeze and admin commands)
    - General stability improvements

#### Other Changes
- Fixed an issue that allowed players to skip the Deathmason's second phase. Deathmason now enters the second phase via the OnDeath event - Thank you @Tennun
- Fixed an await issue that prevented "Slash" from resolving correctly, which could sometimes lead to desync
- Fixed an await issue that prevented "Arrows" from resolving correctly, which could sometimes lead to desync
- Fixed a pathing issue that caused desync in online multiplayer games where gripthulus or resurrections were involved
- Modifier keys are ignored if there isn’t a bound action. I.E. [Shift+A] will move the camera to the left, unless you have [Shift+A] specifically bound to something else - Thank you @Innonminate
- Fixed a bug that caused the some tutorials to not be completed when they should
- Fixed multiple tutorial display issues, such as explain prompts not showing up, completed tasks not appearing, and the tutorial not appearing correctly in multiplayer
- Fixed an issue that caused urn explosions to disappear too quickly - Thank you @Blue
- Improved debug and logging
- Temporarily removed LoS targeting lines in preparation for an AI Refactor

## 1.27.0
a11y: Add font selector for accessibility
    
    #365
    @Tatapstar

Jan 10 Fixes (#370)
    
    * Burst VFX Fix
    
    * Some distance optimization
    
    * Targeting spells sort added units by distance
    
    * Swap targets last unit instead of initial
    
    * Distances and Optimization
    
    * Distances and Optimization 2
    
    * Target Similar and Kind consistency
    
    - Target Similar ignores factions when targeting dead units
    - Target Kind uses the same logic target similar does, and removed multiple filter overlap to make it more readable
    
    * sortClosestTo Function
    
    * Removed Sqr Calcs for code clarity
    
    - SqrDist and SqrMagnitude have been removed. Turns out they provide negligible levels of optimization, and is not worth the maintenance/readability of the codebase

menu: Add Privacy Policy and EULA popup

keybind: Add Reset button to return
    to defaults.
    Allow 'Esc' to clear current key
    Thanks @BigRedCat

i18n: Fix missing localization
    
    Note: the " spellmasons " class upgrade has spaces so as to not conflict
    with the summon spellmason upgrade so I had to add
    an extra line of localization

Impact Damage Fix (#353)
    * Arrow speed fix and slight optimization

fix: Health potion capping blood curse health overflow
    Note: Regular healing over max is still denied in the takeDamage function.
    Tested with health potions and the healing spell
    Fixes #346

Further QA and Quick Fixes (#351)
    * Fixed Ice/Poison urns pushing units
    * Re-enable gripthulhu
    * Fixed blue circle issue
    * Gripthulhu uses LOS and correct movement/mana
    * Fixed poisoner using incorrect mana
    - Temp fix, used same workaround as the priest
    - Needs better fix in the future
    * Orient to match other LOS enemy behavior

fix player teleporting back to cast location when moving
    
    during long-lived cast in multiplayer.  This ocurred because MOVE_PLAYER is handled syncronously (in queue) on all clients and the server except the client of the player whose moving and by the time they are triggered the SYNC_SOME_STATE occurs and resets the player position.
    
    Now MOVE_PLAYER is handled immediately so players can move while casting on all screens (but still handled without the MOVE_PLAYER message on the current client for their own player to prevent stuttering while moving themselves).
    Fixes #329

fix: awaitForceMoves timing out for long arrow spells
    
    Now that projectiles work with the forceMove system, and because stacked arrow spells can continue to add force move projectils over time, the awaitForceMove timeout must be reset
    everytime a new forceMove is added since its completion can last an arbitrary amount of time, but it still needs proecting against an erronous forcemove that never ends.
    
    Fixes #352


UI: Fix missing spellIcons
    Closes #320

fix: Prevent tooltip stutter when scrollbar appears
    Fixes #211

src: Allow backups of the same day and name
    to overwrite each other.
    Tested in multiplayer.
    
    Closes #345

clean: Prevent meaningless error on client
    `process is undefined`

content: Add spell icon recall

fix: runTurnStartEvents should complete for all units
    before moving on.
    This was not previously a problem because there weren't any onTurnStart events that were using async code, but
    to support that potential, all onTrunStart events should be
    awaited and completed before moving on in code execution.
    Thanks MattTheWaz
    Closes #326

a11y: Choosing default outlines saves your setting
    Closes #338

admin: Add admin tools for testing desync
    Closes #315

admin: Warn about needing a selectedUnit
    for admin functions that require one.

content: Add images to upcoming spells

Force Move Improvements (#341)

Quick Fixes (#342)
    
    * Max mana no longer scales with strength
    
    * Bone Shrapnel doesn't appear in first damage list
    
    * Bone Shrapnel predicts correctly
    
    - Fixed an issue where the foreach loop would cause a chain reaction of bone shrapnels in predictions as the units die to previous bone shrapnels
    
    * Resurrect sets endedTurn to false
    
    - Sources of resurrect could use additional cleanup

api: Add `pull` and `makeForcePush` to the api
    Thanks MattTheWaz
    Closes #326

log: Send events to server hub
src: Support sending events to Server Hub
fix:  Refactor Force move projectile (#303)
    * src: Add Event.onProjectileCollision
    
    * src: Projectile:
    - Support pierce
    - Clean up image when done
    - Fix firing multiple arrows in sequence
    - Clean up projectile on collision
    
    * ref: Rework arrow spells to use forceMoveProjectile
    
    * src: Add gameloop delta time to forceMoves
    
    * log: Report loop count limit
    
    * fix: Headless not having element.querySelector
    
    * fix: Pull typing after refactor
    
    * clean: Remove unused import
    
    * wip: Build system for using setTimeout in headless and prediction
    
    * fix: pull distance due to  forceMove refactor
    
    * balance: ForceMove impact damage scales a lot
    stronger than it used to
    
    * log: Remove dev logs
    
    * fix: Restore timeoutToNextArrow
    
    which was changed for testing purposes
    
    * fix: ArrowEffect takes the card id
    
    so it triggers the right projectile collision function
    
    * fix: pierce hitting the same unit multiple times
    
    * fix: arrow not being awaited
    
    * fix: shove magnitude after forceMove refactor
    
    * fix: velocity falloff should take deltaTime into account
    
    so that regardless of the deltaTime passed into
    runForceMove and the number of times it's called, it will
    have consistent results between clients

fix: Significant movement desync
    
    Where if units started their turn already with a path, on headless,
    as soon as they got stamina they'd start and complete their movement,
    all before unit.action was invoked.  This is different than on
    client because the server executes the gameLoop all at once.
    The solution is to always clear the unit's path at the start
    of their turn so that they don't start moving unless unit.moveTowards
    is invoked inside their .action function.
    
    log: reduce logging noise for server
    
    Related #291

fix: Dark priest and ghost archer action desync
    
    Closes #291

menu: fix codex UI issues
    
    Closes #311

menu: Disable multiplayer game name
    and password fields
    once the client has joined the room
    since changing them won't have any effect
    
    Closes #297

balance: Reduce with of collision radius for
    ghost arrow
    It was far too wide

fix: Clear inventory
    in new underworld without calling syncInventory which requries a globalThis.player
    Fixes #305

npm: @websocketpie/client@1.1.3
    Fix clientId being set to '' on roomLeave
    Fixes #292

Colorblind support (#314)
    Ref: #293
    
    * src: Customizable color and thickness outlines
    
    * fix: Handle removing outline if thickness is 0
    
    * fix: hexToString to properly
    convert smaller numbers like
    0x0000ff
    which was turning into '#ff'
    instead of '#0000ff'
    
    * menu: Add outline accessibility controls
    
    * src: Persist accessibility outline to disk

Fixed Target Similar (#307)
    * Fixed Target Similar
    * Removed workaround and prediction copy
    * Updated pickups to match unit behavior
    * Initial Targets [] for multi-initial targets
    Fixed target similar adding the same target multiple times
    Fixed clone not adding pickups to target list
    * fix: Restore use of lastPredictionUnitId
    predictionUnitIds should be incremented differently from
    unit ids.
    This is because prediction loops can run different amounts on
    different clients, but all clients should call create for real units
    the same number of times, keeping the unit ids in parity.
    
    fix: planningView graphics shouldn't use the prediction unit id to
    find the corresponding real unit id, so I added `real` as a reference
    to the original just like pickups.
    

End Turn Sfx plays when an ally ends their turn as well (#309)

Resurrect requires a valid corpse (#308)
    Res requires a valid corpse
    Fixed an issue where you could resurrect a unit after using bone shrapnel on them, which could lock the game in the case of a player character

src: Reset out of bounds players
        This should never happen but to prevent
        the game from getting stuck,
        if a player gets out of bounds, reset them.
        Closes #277

fix: Multiple priests targetting the same corpse
    Fixes #247

fix: Prevent target similar from
    mutating targets array while iterating targets array which resulted
    in undesired extra targeting because the targets array is refreshed inside of
    every loop.
    
    Fixed #299

fix: Timemason on Hotseat
    loses mana when other player is active
    
    Fixes #302

feature: Clones added to target list (#298)

refactor: Added ignoreRange flag to ICard (#296)
    * Set to true for arrow spells
    * Updated check in isAllowedToCastOutOfRange to use ignoreRange

Contaminate Exclude Corpse Decay (#287)
    * Contaminate exclude corpse decay
    * Corpse Decay can't affect players/living


Polished Power Bar (#279)
    * Polished Power Bar
    
    - Fixed an issue that caused level up to give too much xp
    - Fixed an issue that caused options to not get updated when opening the power bar, and caused an admin command different than what was selected to run
    - Your previous selection will stay even after closing the bar, letting you quickly run the command several times (good for level up, regenerate level, spawning enemies, etc.)
    - Tab will now increment the selected index
    - Selected index will now reset when you start typing (since the selected command will likely change anyway)
    
    * Update globalTypesHeadless.d.ts

Send Mana Id (i18n) (#278)
    
    Update send_mana.ts

admin: Add arrow keys to navigate power bar
admin: Add "Give Card", "Level up"
    and new level skip admin commands
admin: Add powerbar
    Accessible via Ctrl + Space

fix: Undefined element on server error
log: Silence wsPie logs

npm: Update wsPieServer for enhanced statistics

src: Add spell: Bone Shrapnel
    - Destroy corpses to damage nearby enemies
    - Thanks Ry for inspiration 


## 1.26.5 Hotfix
- big fix: Resolve multiplayer issue where force movements such as explosions (bloat, urns) caused positional desync.
- balance: Resurrect Weak brings resurrected units to full mana so that it isn't useless when used on casters
- fix: Allow Explosive Archer (from mod) to have soul captured

- Big thanks to Couls for doing the code for the following UI changes:
    - UI: "End Turn" button becomes a "Ready" button in Multiplayer
    - UI: Add damage to description of Sacrifice Card
    - UI: Prevent chatbox from opening in singleplayer


## 1.26.0
- feature: Waves added in Plus levels, each subsequent Plus level gets one extra wave before the Portals appear
    This should make end game much more challenging.
    Also: Units in the Plus levels get "Corpse Decay" so their corpses don't stick around long
- feature: Added In-game chat (accessible via the "t" key)
    - Thanks Couls for this awesome feature!
- content: Add "Teleport" spell
    Thanks Meme_Man

- balance: Target Similar and Target Kind
    Thanks Meme_Man
- balance: Significant Mana Steal rebalance
- balance: Heal Alllies now requires Heal Greater instead of fully replacing it when upgraded.
- balance: Send Mana: Cost is now increased to 30 and it scales in cost when used like other spells.
- balance: Improve Contaminate, stacks now cause the curses to continue to spread
    also contaminate now overwrites lower level curses with higher level curses when it spreads, instead of ignoring already inflicted units.
- balance: Significantly rebalanced Stat gain amounts: health, stamina and cast range are now greater per point spent.
- balance: Casting Blood Curse on an ally Spellmason no longer grants them the Blood Curse spell
- balance: Buff suffocate and poison
    - Also they now proc at the end of a unit's turn instead of the beginning
- balance: Repel and vortex now require push and pull (respectively)
    - Repel and vortex mana cost increased slightly
- balance: Target cone now increases it's arc much more when stacked.
- balance: Target column now extends farther when stacked
- balance: In Plus levels, units no longer get "Immune"
- balance: Target Similar, Target Kind
- balance: Reworked Connect spell algorithm for better targeting
- balance: Enemy Mana Adjustments

- improvement: Rejoining existing games should be much more reliable
The clients have been improved to use the same clientID between reboots.  This means that if you rejoin a game after a disconnect (or a saved game - after version 1.26.0) it should automatically give you back control of your original character instead of making a new one.
- i18n: Russian translation
    Thanks sevagog and tatapstar!

- fix: Prevent ending your turn while you're picking upgrades
- fix: Multiple issues on Hotseat Multiplayer with major refactor
- fix: Cloned or Summoned Spellmason now correctly deals the damage listed in their tooltip
    Also stacking a summoned spellmason increases it's damage output
    Thanks Meme_man
- fix: Purple portals stick around after a player enters one.  This resolves the occasional issue where one player would trigger both portals in multiplayer and the other player would have to end their turn to recreate a new purple portal so they could proceed
- fix: The back button on the Load menu going to a multiplayer lobby menu even if you were in singleplayer.
- fix: Spell smuggling between new games
    Thanks WildBerryBlast
- fix: Vampires keep blood curse on death
- fix: Split hack allowing infinite splits
- fix: Incorrect damage dealth when combining Dash then Burst
- fix: darkPriest sometimes displaying with wrong colors
- fix: bugs where client's local player state would get overwritten by server
    I believe this will resolve the issue where summon spells would sometimes disappear
- fix: Ensure clientId remains consistent, even in singleplayer
- fix: Persist removing cards from toolbar
- fix: desync in slash
    Where slash would return before all damage
    was done being dished out.

- visual: Added suffocate display to health bar
- visual: HP and MP bars now have a dark, partially transparent background and healing / gained mana is displayed in a spell prediction in addition to damage / spent mana.
- visual: Spells in inventory are more sensibly grouped together
- visual: Urn explosion radius now shows when selected
- visual: Fixed urns losing red tint if damaged/killed
- visual: Fixed issue where sometimes blood golem, blood archer, dark priest, etc didn't get properly tinted and appeared to be vanilla units
- visual: Add Spell details to Unknown cards in the codex so you can see if they require other cards to get them or if they belong to a mod.

- a11y: Darken background colors even more when the option is enabled
- a11y: Added dedicated accessibility menu.  If you need additional accessibility options, please let me know!

## 1.25.0
Staff update!
Soul Muncher has joined the team as a developer and is doing awesome work!

feature: Some card upgrades now "require" other cards in order to appear as upgrades but will not remove them when chosen.
feature: New Spell: Long Arrow
feature: New Spell: Send Mana
    Thanks @meme_man for the suggestion!
feature: New class: Witch!

balance: Necromancer's Capture Soul now costs a static 38 hp instead of 90% health so you can upgrade your health to make it less dangerous to use.
balance: Target Column now increases in length when stacked making it a viable targeting spell.
balance: The mana cost of summon spells has been completely rebalanced, making many of the summon spells much more viable than they were before
balance: Timemason has been reworked so that you get double mana and lose mana over time rather than gaining mana over time and losing health.  This increases pressure and challenge rather than encouraging stalling and waiting.

big fix: Prevent clients from timeing out from servers due to idleness.  This has been a big issue in multiplayer games where lots of folks were getting disconnected.  Big thanks to @WhiteScythe , @Gumby and others for reporting this
fix: Manual camera controls that skip the camera cinematic at the start of each level now allow you use to choose your spawn immediately rather than waiting the same amount of time that it would take for the cinematic to finish.
    Thanks @Skillo for uploading a video that showed this issue
fix: Resolved issue where dashing to a pickup caused it to just disappear on multiplayer
fix: Burst now deals the max damage when you are close enough to touch another unit rather than having to be right on top of them
fix: Dash spell desync where dashing to multiple targets would cause a desync.  Now dash only dashes to the first target if multiple targets are selected.
    Thanks @TheyCallMeWitch for reporting
fix: Harvest + Push causing a crash
    Thanks @White Rider for reporting

improvement: Explains why saves may fail due to lack of space
enhancement: Add speed run time to game over screen
    Thanks @WildBerryBeast and @Skillo
improvement: New spells are now chosen via a level up button (shown where the "End Turn" button usually is), so that leveling up doesn't cover the screen just as your cool spell is finishing.

stats: Gather stats for language use
stats: Gather stats for upgrade choices so I can determine which spells are so unpopular that they need reworking.  Your vote counts!

## 1.24.0
- balance: Deathmason
    - Deathmason now actually uses mana and can be prevented from spawning portals if he has insufficient mana
    - Deathmason no longer casts slash
- Fix red portals not disappearing
- Fix network messages being missed when game is alt-tabbed
- Completely redid pickup code to resolve desyncs when colliding with pickups especially when using movement spells
    - Handles if client triggers pickup but server does not
    - Ensure if server triggers pickup that it doesn't trigger on client until the correct time
    - Thanks WildBerryBlast
- fix: joining saved games so that you automatically assume control over your old saved player character
- fix: resurrect weak so that you can cast it on yourself
- fix: After a wipe and restart the play is in the game but not "lobbyReady" and so no one else can join and they can't continue in their own game
- Improve rejoining with same name


balance: Revise Deathmason behavior
    so he can't teleport via a red portal and then attack
    in the same turn (from the new unwarned location)

ref: join game as player
    Joining a game with the same
    name as a disconnected player who has a different clientId will now
    automatically switch that player to the other one.
    This drastically improves the experience of joining saved games
    where you're trying to assume control of your saved player
    but your clientId has changed.

fix: Resurrect weak
    unable to rez self
    due to it decreasing your mana

ref: Pickup
    Handle edgecase where player touches pickup on client before server has.
    Usually server processes the touched pickup first because it triggers
    all it's movement loops immediately; however, it's possible due to a desync
    or maybe due to large latency while a player is moving that the player
    passess through the pickup on the client before it does on the server.
    In that case, if the server adds to the aquirePickupQueue after the
    client unit has already passed through then it won't trigger on the client
    (it will timeout), so this edge case has the client trigger the pickup for
    everyone. (so there's no desync).

fix: Pickup id collisions during sync
    where removed pickups were still in the array and then new loaded
    pickups could have id collisions.
    This would happen if the arrays of pickups (ids only) looked like
    [1,2,3] and [0,1,2,3]; so none of the pickups matched, it would remove them
    all and then try to load but they were just marked as flagged for
    removal so then it would fail to load them.

ref: Pickups
    Headless server is the source of truth for pickup collisions.
    However, this is complex because headless server processes forceMoves
    instantly, we don't want pickups to trigger on the client side before
    the animations have completed.  Therefore, when headless sends the
    QUEUE_PICKUP_TRIGGER message, the clients store the pickup info
    in a queue.  And once, on the client, the unit collides with the pickup,
    if the pickup information is in the queue, it THEN triggers the pickup.

fix: lobbyReady state after game restarts
    due to wipe.
    To reproduce old issue, start a multiplayer game with one player,
    they die and the game resets after 10 seconds, then join with another
    player and they're stuck in the lobby.
    This is because the previous lobbyReady code was getting clobbered
    by the SYNC_PLAYERS queued message that came from ensureAllClients...

fix: occasional invisible portals
    Thanks Skillo

optim: Reduce server logging
    Server logging whole payload was causing huge server
    slowdown for endgame where every spell
    sends SYNC_SOME_STATE which prints the whole game state.
    log: Also improve logging labels for onData logs

fix: do not recreate pickups that are flagged
    for removal.

log: Add logging to pickup error for better investigation



## Spellmasons Update v1.23.8
Some of you may have noticed that servers have been unavailable here and there or have crashed.  I just found the a second cause of the server crash problem (first cause was resolved on 11/17), I will put out a patch tomorrow morning.  I also added an extra check to make sure that this kind of crash is impossible.
So server reliability will improve!

fix: Backwards compatibility issue with old save files

fix: bug where sometimes no units spawn on the first level
Thanks Skillo from Discord

fix: Ally npcs carrying on to fight after player has died
## Spellmasons Update v1.23.5
fix: Infinite server loop that occurred after you summoned
an urn and then died

fix: Cards in your inventory not decrementing in cost
when your turn ended
Thanks Matt_97 for help debugging this

fix: Resurrect Weak sometimes leaving enemy health and mana
at non-whole numbers

fix: Upgrade random number generator when you get multiple
upgrades on one level from showing the same upgrades

## Spellmasons Update v1.23.4
fix: Spell predictions not working or being unreliable

fix: Server incorrectly calculating movements from movement spells
or explosions

## Spellmasons Update v1.23.0
content: Tweak arrow upgrade spell cost and rarity
content: Add arrow spells
content: Add heal upgrades
    Support arrows hitting targets not in their center
    Add Arrow upgrades
content: Add "Resurrect" Variations
    Thanks TonyFTW, Skillo and Mattmellow
content: Stacked summons make bigger, stronger units

perf: When moving with spell queued,
    only call runPredictions when idle to
    prevent lag while moving with spell queued
UI: Fix size of cards on smaller screens
    Thanks Lemming Jesus
UI: Prevent tooltip from hiding right spellbar
    Thanks LeoninoMalino from the Steam Community
balance: Make summon decoy scale in strength when
    stacked like summon_generic.
balance: Remove cooldown for Summon Decoy now that AI targeting is improved and wont
    target about-to-be-dead units

Thanks Chase from Discord for this idea
fix: longstanding bug with arrow spells 
    predicting that enemies will die and then they wouldn't die
fix: urns that had too many onDeathEvents
    due to their init function not being idempotent.
    Fix urn cleanup cornercase where the urn image would be
     left behind (and red) due to the image being restored in a sync.
     By changing Image.cleanup to allow maintaining the position x,y
     so that the other onDeath events such as bloat can still use it but
     the image is still cleaned up
fix: Freeze UX when player is frozen
    especially by urn so that it shows the the player
    is frozen even when it skips their turn
fix: Game failing to save if you save while a spell is being cast
fix: Improve saving so if you try to save during the enemy turn, it will wait until the start of your turn to save the game
fix: Bug where you're unable to join a multiplayer game after dying in hotseat multiplayer
fix: multiplayer menu bug where
    when the game restarts, it reset player.isReady so it was
    showing the wrong menu on esc

## Spellmasons Update v1.22.0
Improvment: New experimental improved server running on US-West and Europe servers
chore: Improved logging for debugging
src: Add unit stats to summon cards
    Thanks Lemdoran
fix: Spells from Rene's Gimmicks not showing up in multiplayer thought bubbles
fix: Auto-rejoining doesn't work if the game has a password
    Thanks Manman
chore: Use server-bun on us-west
fix: Summon card descriptions update
    when difficulty or language changes
fix: Urns don't take poison damage
    Add Doodads to action loop so that their
    onTurnStart triggers which is used by poison
    and other modifiers
fix: urns' additional onDeath events (such as bloat)
    not working because the unit was cleaned up before
    it triggered
fix: Skipping player turn on load
    when you load into a saved game and choose
    "join game as player"
perf: Wrap movemouse runPredictions in
    requestIdleCallback to greatly enhance perf
fix: Hotseat players not getting mana back
    after one player died
    Thanks Genthru
fix: could not choose Spellmasons mageType
    due to duplicate upgrade name.
    Add check to log error if there are multiple upgrades with
    the same name
fix: rand: handle gracefully when min > max
fix: Decoy raceTimeouting on hit
    because it would early return if image didn't change
    without resolving
fix: blood_size_mod using randFloat wrong
    log: Fix warn when randFloat and randInt have arguments
    switched
fix: Not being able to capture soul ally spellmason
fix: Hotseat players not getting stat upgrades
fix: prevent calamities from affecting Urns
    Thansk PandaPhilly for reporting
fix: Prevent friendly npcs from attacking
    urns (doodads).
    Thanks MattMellow
fix: prevent ally npcs spawning from Blue Portals
    that are supposed to be used for teleporting
## Spellmasons Update v1.21.2
Thanks to Pandize for general feedback!

feature: Teleport Trap!  After level 5, at least 2 blue portals will spawn
    that will allow players to teleport around the map. 
    Thanks Skillo
feature: Add urns

balance: Increase poison base damage to 18
balance: Reduce probability of trap pickup
balance: Increase number of pickups along with level size
balance: Immune units CAN be targeted
    but cannot be damaged or recieve modifiers
    (like curses)

src: Experimental server optimizations for faster networked messages

i18n: Update Portugues Translation
    Thanks to Iwashi kan ツ

fix: Clones and split units don't provide experience
    when killed
    Thanks enigmaticbacon for reporting this
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
fix: valid spawn logic for blue and red portals
    it was denying valid spawn for portals that were close to walls that
    should've been valid
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
fix: big bug in random number choice function favoring certain choices over others
fix: killing a clone of a deathmason from incrementing your "games won" stat
fix: UI: Ensure spell costs are up to date in the inventory
    Thanks Mattmellow and Lemdoran for reporting this
fix: Ensure Pickup's emitters follow them
    if they move (like pushing a portal)
fix: Attempt to fix duplicate pickup
    issue on multiplayer
    where a recently triggered pickup
    is recreated.
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
fix: hiding broken tooltip images


UI: Allow modifier keys (ctrl, shift, alt) in hotkeys
    Assign hotkeys to side bars
    Thanks Lemdoran and Skillo
UI: Hide broken images in Jprompt


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