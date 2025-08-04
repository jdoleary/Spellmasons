## v1.65.2
- fix: Prevent Unit health from doubling when loading a multiplayer game on Impossible difficulty
- fix: Allow changing wizard type at any time
    since multiple players have gotten stuck unable to change wizard after quitting a game
    (Note: Wizard type should not intentionally be changed _during_ a game)
- balance: Arrow Multi is now worth the cost
- balance: Giant Slash now only costs 1 soul instead of 2 to be worth the upgrade
- QoL: Make Winter's Chill trigger on turn start instead of end

- legal: Simplify and clarify Privacy Policy and EULA
- legal: Add menu button to opt-out of remote logging / data sharing (note: it is not opted-out by default)
- fix: polymorphing dead units doesn't restore soul fragment
- fix: polymorph to maintain power of pickups and strength of units
- fix: Whirlpool only runs while wizard is alive
- fix: maintain difficulty on restart after losing
- fix: maintain wizard choice on restart after losing
- fix: lock icon position on floating card holders for Deathmason
- fix: Darken background so there's no white flash on startup
- fix: resurrecting unit removes floating soul particles
- fix: Remove Necromancer for Goru and DM since it doesn't decrease cost for them


## Patch
fix: merge combines soul fragments
fix: Free souls on Golemancer
    Thanks Spododo
fix: Miniboss summons have more soul fragments than they cost
    Thanks @Shleo
fix: Unspawned goru can pickup souls
    Thanks @NordKaiser
fix: Death animation playing over and over
content: Fair is Fair
    Thanks Skillo and Kain Valkin
QoL: Remove remaining floating souls on end of level so player doesn't feel compelled to pick them up
menu: Add restart button
    Thanks @Flounder
mod: Improved some spell icons, Thanks Weedybird!
content: Nukitsuke 2: Damage scales by distance

## 1.61.2 Patch
content: Add Deathmason specific runes
Balance: Adjust soul fragments based on number of player's connected to balance goru difficulty
    Thanks MrMagician
Balance: Summon Trap
    Much cheaper but cannot be placed ON a unit
    Allow it to stack so stacks summon a larger, more dangerous trap

Optimize: Soul particle effects
    Thanks Martin_Talzor

fix: Decoy 3 requirement
    Thanks Chumler!
fix: bounty portal to be yellow
    Thanks Spododo
fix: Prevent soul sharding a unit that is a soul shard owner
    Thanks Dorioso Aytario
fix: prevent soul collection desync on distant servers.  Now a goru will only trigger soul collection on a corpse once until the souls are recieved
    Thanks Dregenbern and Skillo!
fix: Prevent multiple goru players from collecting
    souls at the same tiem from the same corpse and causing duplication
fix: stamina draining before spawning in
fix: Fix particle radius to match radius
    Add floating text to stamina nova
    Allow novas to scale with stacking
    Allow Plus Radius to affect nova radius
    Thanks Ekuland
fix: tooltip for Deathmason and Goru
fix: maintain deathmason cards when upgrading a card replaces that card.
    Thanks Spododo
fix: Maintain wizard type when loading a game
fix: Submerge so it is removed on death. This ensures corpses are visible and not "under water"
    Thanks Spododo

## 1.60.13 Major Update
Major Feature: Deathmason as a playable character.
The Deathmason uses cards to cast.  You draw up to your max cards each turn and you can discard and redraw half of the discarded cards during your turn. You can lock favorite cards so they don't get discarded until the end of the level.

Major Feature: Goru as a playable character.
Goru uses souls to cast.  You must aquire more souls by picking them up from corpses to keep casting.  You can spend into soul debt but it'll cost you 5% health for every 1 soul debt each time you cast.

Goru and Deathmason unlock after finishing the tutorial

Content
There's a smattering of new spells to make some less popular builds (such as close range, and liquid) more viable, but I wont reveal them here and leave it to you to discover :)

Quality of Life changes
QoL: New cards get automatically added to side toolbars
QoL: Autounlock a rune when it is maxxed out
QoL: Turn off inventory glow once new stat points are seen
QoL: 3 toolbars on each side, all keybindable
QoL: Allow keybinding all hotkeys
QoL: Change mid-game teleport portal color to yellow
 Thanks Weedybird!
QoL: Add checkmark in upper left in-game player list to represent "ready for next turn"
QoL: Protect against accidental end turn when answering UI prompt
QoL: Multiple instances of floating text now share the same instance with a number to show how many times it's occurred
QoL: Explain to player why disconnection occurred
QoL: Update disconnected sprite to be a more obvious "broken internet" symbol

Balancing
balance: Difficulty scaling doesn't empower ally summons
    (This made necromancer builds OP in multiplayer compared to other builds)
    Thanks Autoquark for bringing this up
balance: Investment cost 30 -> 80
balance: Damage limiter: 30 -> 45 max damage dealt per instance
balance: Health cost from spells dont trigger onDamage events
    (shield can't be spent to use health cost spells)

UI Improvements
UI: Add "Are you sure" prompt for "reset tutorial"
    Thanks @Carlos
UI: Fix showing how much it adds to rune when maxxed
    (important for ones that only allow upgrading once like Icy Veins)
    Thanks Nikitasss
UI: Menu button secondary active state is now more
    obvious than hover state.

Bug Fixes
fix: Stamina bar not updating while another player is casting
fix: not being able to sell add_bounce and add_pierce spells
    Thanks Martin_Talzor!
fix: overheal rune: Health over maximum (like from sacrifice) doesn't contribute to overheal amount.
    Thanks bbott
fix UI: Allow for clearing out more than one custom keybind
fix UI: update health and mana UI bars on modifier add
    (for example potion barrier, spawning onto a potion showed the damage self warning box)
    and potion pickup
fix: Major bug where deathmason could overdraw cards after discarding
    if he had cards locked.
    Thanks Pizza Lover 2 and Kyonuma
fix: Enemy Goru getting undying back when cloned or split
    Thanks Martin_Talzor!
fix: encyclopedia show-card-large
    Thanks Superbaum
fix deathmason discard desync
    Thanks Pizza Lover 2 and Kyonuma
    https://discord.com/channels/1032294536640200766/1187826016463364156/1386187054391496845
fix: Back button getting stuck in loop
    Thanks Bogiac

## 1.59.1
-Network: Enable Steam Lobbies for improved multiplayer

-Balance: Restore "Undying" to Goru and modify Undying so it brings ressurrects with 50% health

-Quality of Life: F12 now takes Screenshots!

-Language: Pre-reform Russian

    Thanks @nikitasss

-Menu: Redesign menu appearance

-fix: Remove redundant runPredictions which occurs in deselectCard() which is triggered on click

-fix: Prediction forceMoves from bloat (or any onDeath) simlulating on the NEXT call to runPredictions.

-fix: confirm discard hotkey label

-fix: bone shrapnel only select corpses

-fix: Overspend Rune upgrade bug

    that resulted in negative SP

    Thanks @BlackCobra22113 and others
    
## 1.57.0
Quality of Life:
- UI: Add additional side spell holders
- Game: Add singleplayer difficulty options after you beat Deathmason on Normal difficulty

Balancing:
- balance: Remove `undying` blessing from Goru
- balance: Siphon cost
    to match the scaling structure of mana steal so it can't scale infinitely.
    Thanks @Carlos

Fixes:
- fix: p1p connection not working on firewalls
- fix: Poisoner + Sharp Teeth Imbalance
Thanks @Yasu
- fix: Infinite Loop Contaminate, rez, suffocate
- fix: Armor now allows reducing damage to 0
Thanks RAHHHHHH :3

## 1.54.0
balance: Adjust loop difficulty to scale
balance: Ensure bosses keep spawning on loop levels after +3
fix: Quicksave "Last Turn" From saving at the beginning of a level before any enemies are placed
fix: Prevent unspawned players from taking damage
    Thanks Piratesaur from Steam forums and others who reported this
i18n: Fix copy
    - Trap copy missing "Damage" text
    - Blood Archer copy: "Miniboss" -> "Champion"
fix: Targeting spells sometimes missing "Requires Following" Text when no non-targeting spell came after it
admin: Add "Give all runes" Admin command for testing
fix: Minion runes not working on automated summons
    Also fixes quantity power scaling so that sharp teeth and harden minions applies AFTER quantity power from stacking summons.
    Thanks @SquishyFishy
fix: Update player manaPerTurn when upgrading manaMax
    This didn't affect players since their stat refresh logic doesn't consider manaPerTurn but it DOES affect player clones.
    Thanks @Tingora!
copy: Add unitOfMeasure to town portal
    Thanks @IVI and @Tingora

## 1.53.0
- fix: Whirlpool desync
    Thanks @eps and @RAHHHHHH :3

- fix: Allow selling Targeting spells by themselves
    
- fix: Allow Precision to still work if you _had_ targeting spells
    but sold them.
    Thanks @DrHelixPHD, @SquishyFishy, and @Sophia

- fix: Precision should prevent targeting spells
    from being offered in the future

- fix: Rename summon decoy 2 and 3
    
    So that they match the unit id (which means they'll be correctly
    affected by Necromancer Rune)
    Thanks @Ace_Diamond and @Sophia
    
- fix: Alchemize maintains power level of potion
    Thanks @Hex Obsidian!

- Fix: necromancer + blood warlock
    from making capture soul free
    Thanks @Lost

- balance: "Investment"
    max is now 25%.
    upgrades by 5% at a time

- src: Decoy mana battery
    Thanks @Entchenklein
    
    Closes: #1301

- fix: Disallow overspending on health
        - You must be able to make use of mana gained during the casting of a spell (e.g. manasteal)
        - A spell that kills you shouldn't prevent you from adding more mana cost spells to the end if you still have the mana for it
        - You should be able to add health cost spells that kill you but not go farther
    
- fix: Freeze missing visual
    Closes #1287


## 1.52.0 
New Content

- Rune: Precision
    Thanks @PiElRoja

- Rune: Whirlpool

- Rune: Plague Doctor Mask
    Thanks @Arivia!

- Rune: Reflex

- Rune: Hardened Minions, Sharp Teeth

- Rune: Thorny Decoys

- Rune: Witch Bane
    Thanks @Monarch

- Rune: Blood Warlock

- Rune: Icy Veins
    Thanks @VinnickTalberot!

- Rune: Winter's Chill
    Thanks @VinnickTalberot!

- Rune: Investment
    Thanks @Akira!

- Rune: Blood Letting
    Thanks @Monarch!

- Rune: Town Portal
    Thanks Arivia!

- Rune: Last Stand, Contaminate of Kill, Hat of Despair
    
    Thanks Arivia for Hat of Despair!

- content: Add 2 new decoy upgrades

- Content: Upgrades to Poison
    Thanks @scobjo!

- balance: Plague Doctor Mask cost

- balance: Make Contaminate on Kill more expensive
    since it transfers the stacks of the curse too it's SUPER powerful
    
- balance: Make reroll runes cheaper

- balance: swap Rare -> Uncommon

- balance: Recall Uncommon -> Rare
    Thanks @Scobjo!

Bug Fixes
- fix: Desync re unit movement
    On headless, units that had a left over path were moving as soon as they received stamina.
    This change ensures that, at the start  of the units' turn, the path
    is cleared BEFORE they recieve stamina

- fix: Spellmason clone movement raceTimeout
    I solved the race timeout by making stamina change based on stepTowardsTarget instead of original position vs current position because due to unit collisions they could be trying to step and not stepping wwhich never changed their stamina which means they timed out. This is for AI units only so it won't be frustrating for players (wont spend stamina without moving)

- fix: Blood Curse + debilitate stage order
    Blood Curse must invert healing to damage before the Amount modifiers or else the amount modifiers will not take effect
    Thanks @Varion

- fix: Goru resurrected more than once
    Ensure undying always removes itself.
    Thanks @Weedybird

- fix: Freeze immune
    not working when freeze modifier is added by means other
    than spell.
    Thanks @Varion!

- fix: PlagueBringer still works even when dead
    Thanks @AlchemyExists

- fix: Missing mana sfx for `send mana` and `steal mana`

- fix: taught clones casting `clone` on enemies
    Thanks @RAHHHHHH :3

- fix: menu: privacy policy shows over floating logo

- fix: Attempt to fix changeling cast delay

- fix: Prevent spawning out of bounds
    when a spell that "ignores range" is queued up
    Thanks @Rampantegecko!

- fix: Purple Portal clearing shield and mana overflow

- fix: Purple Portal resetting quicksave onLevelStart
    Thanks @Lost and @eps
    
- optim: Improve recall so
    it doesn't pack everyone together on the same exact spot
    
## 1.51.0
    - fix: Runes getting skipped when locked runes
    were unlocked
    - fix: Runes shuffling when you lock them without a reroll
    - tutorial: Rerecord tutorial gifs
    and add 2 new tutorial tasks for editing spells
    - fix: Overly aggressive floatingText optimizer
    - fix: Hide onKillResurrect for prediction
    This has been confusing to me every time I've seen it in a prediction.
    Chance based runes like Black Coin and onKillResurrect shouldn't show in prediction
    - menu: Improve quicksave menu
    to sort by date
    - fixed: Infinite mana bug with "mana on kill" rune
        Thanks @Remlek!
    - fix: Shatter working on "Feeze Immune"
    units.
    Thanks @Varion!

## 1.49.0
    - content: Add 3 new Champion modifiers
        Curse Immunity, Unstable, and Double Damage
        - Thanks Hex Obsidian for "Displace" Champion Modifier idea
        - Thanks Xulqulyat for "Curse Immunity"
    - content: Add "Sell" spell which allows you to exchange spells for SP
        Thanks to @Vintage the skulldog @Xulqelyat @Cake
    - Balance: Remove random discount on Runes.
        Per feedback from the community,
        discounts incentivise un-fun min-maxxing where players wait for the perfect discount and feel back about buying runes when there is no discount.

        So i'm removing discounts entirely and I will make more ways to get extra SP instead.
    - optimize: Siphon Spell (Bogiac's Spells mod)
        - optimize: Community Servers now have a unit and pickup limit (currently 1000 and 500 respectively which should be pleanty) to prevent crashes from affecting other player's games
        Self hosted servers (LAN or other means) will not have any limit.
        When limit is reached, rather than just preventing new one's spawning, first dead bodies will decay, secondly if there are no dead bodies, units will be merged.
    - UX: Show mana cost for clones of taught spell
        Thanks @Brian for this suggestion
    - UI: Improve mana badge icon
    - **major fix**: Determine rune cost on client
        Fixes "runes being undone" in multiplayer.
    - fix: Prevent Connect from targeting already targeted units (this spell is now more effective)
    - fix: Dead units no longer block spawning
    - fix: Clones not using mana to cast
    - fix: Audio for ancient
    - fix: Prevent Goru and Priest from resurrecting decoys which is confusing for players who assume the decoys are on their faction
        Thanks @Yasu

    
## 1.48.1
    fix: summoner, goru and last will spawn locations
    fix: Cloning pickups multiple times
    fix: Deathmason not spawning portals
    juice:  Make unit outlines relative to zoom so they stay the same
      size regardless of zoom level
    juice: Add drop shadow and movement to cards
    juice: Add glow to prediction graphics.
    menu: fix space in save name ends turn
    
    You could open the save modal and then press escape and it would go to View.Game, then if you pressed space in the name of the save modal it would advance the turn.
    
    Now escape closes all modals.
    
    Fixes #1186
    fix: Changeling not working
    Thanks Haze and Bogiac
    fix: Death Wager to work when
    greater than full HP.
    Thanks @Xulqelyat
    
    fix: Book glow to only occur
    when player has stat points.
    Before, DareDevil would make the book glow which was an obnoxious exception.  Now it will only show as glowing
    if you have points unspent.

## 1.46.0
content: Add `Teach` Spell
    You can now Teach any spell to NPC Spellmasons
mod: Bogiac's Spells
    Thanks @Bogiac!
mod-api: Expose Obstacle in the API
mod-api: Expose seedrandom in the rand export for the API
mod-api: Add Upgrade.ts to spellmasons api
    so that modded spells can grant other spells to player
    Thanks @Rosan
mod-api: onLiquid event
    The onLiquid event is called when a unit either first enters liquid, starts a turn in liquid or exits liquid.
    For the first two scenarios `currentlyInLiquid` will be true, when exiting liquid, it will be false.
    This is for the modder Rosan!
admin-toolbar: Add hotbar shortcut to give all cards
    from a mod

optimize: Clone FPS
optimize: Target Similar and Target Kind
optimize: Connect
    Vastly improved framerate with requestAnimationFrame

juice: Animate characters on menu
juice: Improve resurrect with outer glow (lightsaber style)
juice: Add a small pause after merge
    and swap

fix: BountyGolem's not triggering bounties
when they kill an enemy with a bounty.
    Thanks Scojbo!

## 1.45.2

This patch contains LOTS of FPS optimizations and bug fixes!

Optimizations:
- Optimize: floating text so if there are more than 20 of
    a single kind it will just aggregate a message
    Thanks Xulqelyat!

- optimize: Target Circle

- optimize: Target Column

- optim: Throttle skybeam
    This massively increases efficiency for when lots of enemies are teleported to the same place all at once.
    Hugely reduces lag.

- optimization: Update server to run entirely on bun.sh
    rather than just websocketpie (this should make many things on the server faster)

Gameplay Balances:
- balance: onKillResurrect Rune
    to make it less high %.  It was way too high (50% max is too much)
    and you could get there too cheaply.
    Thanks Xulqelyat!

- balance: Exploit: Repeated self rez for infinite mana
    Prevent resurrecting player units more than once in one turn to disallow infinite mana exploit where resurrecting yourself gives you mana

- balance: Change Death Wager cost
    "Reset all spell costs back to their default.  Sets your current health to 1.  You must be at max health to cast.  This spell must be cast alone."
    
    So it will no longer affect max health (no permanent effect).
    I think this will make it much more viable and strategic.
    
    fix: Always updateCardBadges after cast so spells like DeathWager that affect card costs will show the proper badges.
    Thanks Jace, SquishyFish, Monarch and Xeno!


Bug Fixes
- fix: Un "frontload" plus radius
    because it is in contradiction to how the spell's copy describes it and also users may want to use it more surgically.
    Thanks Darth_Dan!

- fix: last will to only notify if it's able
    to spawn a potion.
    Thanks Darth_Dan!

- fix: prevent projectiles from colliding with caster
    (because you can step in front of your own stream of arrows)
    Thanks Xulqelyat!

- fix: Prevent infinite recursion with takeDamage events
    Once the takeDamage events start to process, any further damage cannot retrigger takeDamage events
    This ensures that a unit's onDamage events can't reflect damage back on itself which would cause infinite recursion
    Removes `hasRedirectedDamage` which is no longer necessary due to this new method of `takingPureDamage` which covers
    that case too
    Also fix prediction units from having a ref to themself via prediction copy, only real units should have that ref.
    Thanks Xulqelyat!

 - fix: Prediction purify from actually removing
    soul shard haver from units when soul shard owner was hovered
    with prediction purify.

- fix: Far Gazer not showing stamina change on upgrade

- fix: Res immune applies to players only

- fix: Update mana badges when clearing
    queued spell.

- fix: Logging death on prediction instead of only on real
    Thanks Darth_Dan!

- fix: Increase potion spawn radius on alchemist so it
    doesn't spawn on top of you

- fix: Increase spawn radius for purple portal
    so that it doesn't spawn too close to you causing it to trigger immediately
    In multiplayer, this made the game advance as soon as you cast the last kill spell.
    Thanks @Jackson

- fix: findValidSpawn to use hex
    so we don't get unexpected far-away clones

- fix: Remove "Choose a place to spawn" if player is already spawned on load

- fix: Prevent competing Goru's from using each other's
    primed corpses.
    Thanks FfrankF!

- fix UI: Unit attack range circle not moving with them

- fix: Server Loop: "Could not find valid spawn..."
    To address infinite loop that reported 'Could not find valid spawn point in radius'
    over and over, if no spawn point is found just return the center.
    
- fix Server Crash: If headless has to emergency exit force moves
    clear all force moves so that they don't continue to emergency exit next time the function is called.

- dev: Drastically speed up starting up headless server using bun.
- chore: Save remembers camera location

## 1.44.4 - FPS Optimization
**Backwards Compatability warning**
Some of the optimizations in this update are not backwards compatible with
old save files.  If you still want to play on an old save, you can do so by
right clicking on Spellmasons in your Steam library, choosing "Properties" >
then "Betas" then v1.43.4 and restart Steam. This will ensure your client is
on the last update instead of this one.


FPS Optimizations:
The game now runs a lot better when there are tons of units on screen.
A few notable changes went into this:
1. Individual sprite outlines have been moved to outline the entire unit container. 
Not only does this look much cooler in crowds but it also makes a MASSIVE difference in
FPS when there are over 1000 units on screen.  If you still want individual unit outlines
(optionally with different colors and custom thickness, it is still available in the Accessibility
2. Dynamically colored sprites (such as Blood Golem, Blood Archer, Dark Priest, etc) now have their
own sprites instead of being dynamically tinted at runtime.  This saves on FPS.
menu but it will slow the game down when there are many units on screen.)
3. Spellmasons is constantly predicting what will happen next turn.  When there are over 1000 units 
on the screen, this would really bog down the FPS.  Significant prediction enhancements have
been made for enemy unit targeting to resolve this issue. 
4. Card mana and health badges are no longer updated when predictions run.  This was a totally superfluous
function call left over from long ago and will improve FPS.  They are still updated when they need to
be like when a spell is added, removed, etc.

Other changes:

Content: New spells "Give bounty" and "Target bounty"

fix: removePickup actually removing
    pickup emitter and doing other cleanup even when `prediction = true`
    
    Thanks Hex Obsidian

fix: Prevent multiple runPrediction calls from triggering simultaneously

fix: Don't change player unit movespeed when slowed, only stamina
    otherwise it makes their movement jittery due to how multiplayer handles player movement.
    Fixes super speed when units were "slowed"

    Thanks Monarch and Xulqelyat

fix: conserve to not always working correctly

fix: Fully overwrite players array
    when loading a saved game.
    This fixes the case where playing a game with more players and then loading a game with less would leave you with ghost player objects that would softlock the game.
    Allow multiplayer saves to be played in a singleplayer context (as hotseat).

fix: Add protections to prevent changing a player unit's faction to enemy
    Thanks FfrankF, evilcuttlefish and HeyShadowPhoenix

fix: Black Coin desync on Multi
    Any time getUniqueSeedString is called with globalThis.player on the server it will desync compared to clients.

fix: Show prediction markers on prediction units
    This fixes the issue where cloned units wouldn't show
    prediction markers because the unitsPrediction array wasn't
    the one being iterated.

fix: runPredictions while player is spawning
    
    Otherwise predictions don't update while choosing a spawn location

fix: unit attention markers persisting after death

fix: infinite mana merge exploit
    
    Limit changeling to 1 max.
    Prevent stacking teleport in the same location to spawn a bunch of changelings
    and make units that recieve merge immune for 2 turns to prevent infinite mana growth
    
    Closes #1108


## 1.43 - Balancing Patch

content: Add Black Coin Rune
content: Add Near Sighted Rune

balance: Cursify cost to exponential
    mana_steal to nlogn
balance: Discounts from 20%/40% to 10%/20%
balance: Creeping Death max 3 upgrades to
    prevent cascading.
    Thanks Wizzersquirrel for pointing this out
balance: Enable excluding some champion modifiers
    until later levels like slime and growth which are too hard early on
balance: Heavy Toxins and Inflict Poison
balance: nerf mana barrier
    Especially since you can overflow mana this is super OP
balance: Merge cost to "exponential"
balance: Limit Heavy Toxins to 30% slow

fix: Middle Mouse Camera lag
fix: Doodads should not provide EXP
fix: Ally units sometimes skipping attacking
    champions with modifiers.
fix: Quicksaving after death
fix: Ally Goru can resurrect dead players
    Thanks Sluethen from discord!
fix: Run predictions when a game is loaded
    so that everything is freshly calculated.
fix: Summoned allies are now able to trigger bounty
fix: Prevent slow from going to 0
    Which messes up purification
fix: Add animation to onKillResurrect
fix: Prevent recall point from intersecting
    with wall.
    Also warn if it will fizzle due to spawning out of bounds

mod: Fix `requires` array for target HP cards in Dai Nekolchis Tome

menu: Add option for "always on health bars"
menu: Prevent logo from being draggable
UI: Add "·" Spacer to Runes menu between Rune name and value
admin: Add Modifier hot menu
    now correctly adds the quantity per upgrade


## 1.42.9 - RUNES

Major Feature: Runes

You can now upgrade Runes in the spellbook.  Runes deeply expand the possibilities of your run:  For example, "Inflict Poison" adds 1 stack of poison every time you deal damage.  If you're going for an archer build this makes all of your arrows poisonous. Combine that with "Endless Quiver" which ensures that your arrow spells do not scale in cost as you use them and you've become quite deadly!  I'll leave it up to you to discover more unique and clever rune combinations to elevate your build!

Major Feature: Champions

Champions (quietly released in the last update) provide a novel challenge, especially to seasoned players.  They are larger, stronger units with special modifiers (like Damage Limiter, Slime, Target Immune - and more).  You'll have to be extra clever to deal with them

Official Change log:

- Features:
    - Runes can be locked so that when they reroll each level (or when you manually reroll), your favorite runes will stay put so you can continue to invest in them.
    - Runes have a chance to be discounted for 20% or 40% off
    - Deterministic events.  Events (like poison on turn end) now trigger in deterministic order.  This means regardless of which order curses or blessings are added to a unit they will trigger in a sensible order.  This should prevent confused expectations
    - Bosses (Goru and Deathmason) now spawn as Champions in the loop levels.  Yikes!! Good luck...
    - Healthbars now only appear if a unit is damaged (or an ally so you can tell they're an ally).  I think this makes the game a lot prettier and less cluttered especially when there are tons of units on screen.  Please let me know what you think of this.
- Enhancements
    - Removed shader that was causing FPS drops
    - Note: I have LOTS of planned FPS / Optimization improvements that will be coming in the following update.
- Fixes:
    - Swapping with pickups no longer triggers the pickup.  Thanks @Liese!
    - Displace's teleport location is now unique to each player
- Balances:
    - Bolt has been rebalanced. It now starts with 1 chain and gets +1 chain per stack
- UI:
    - Fix menu buttons highlighting on hover in the main menu
    - Fix the alignment of the caution "Self damage / will die" popup underneath queued spell

## 1.41.5

- src: Temp: Disabling explosive arrow
    It does not handle async with onProjectileCollision
    yet which is necessary for explosion.
    Also it doesn't get extra radius from plus radius

- i18n: Fix copy on Shatter ice since freeze cannot stack more than once anymore

- balance: Extra skillpoints per level
    to account for classes

- admin: Support 1000 skill points
    and give card in multiplayer

- UI: Prevent inventory from being occluded
- UI: Fix capitalization of runes
- UI: Temp: Remove lock icons from runes for 1.41.5
- Translate: Target Disk

## 1.41.4

Content:
- New Spell: Cursify
- New Spell: Add Ricochet
- New Spell: Add Pierce
- Split works on pickups
- New mod! DaiNekolchis Tome of Spells!
- New attributes for minibosses (Now named "Champions")
    which make them much more formidible especially in the late game
    - Target Immune
    - Defiance
    - Confidence
    - Slime
    - Damage Limiter

Improvements:
- Improve smoothness of camera when moving it with WASD
- Upgrades are now always available in the Spellbook via the yellow bookmark on the right
- Add Crown sprites to minibosses so they are easily identifiable
- Improved targeting prediction (#894)
- Frontload cards like "Plus Radius", "Add Bounce", and "Add Ricochet" so they can be added to the end of a spell instead of undoing the whole spell queue to put more at the beginning
- Protect user from accidentally ending turn while inventory is open.  Inventory must be closed to use Spacebar to end turn.
- Show selectedUnit's prediction unit range
    instead of the unit itself so that if you move them
    with a movement spell it shows what their range will
    be
- Lots of missing translations added
- Modifiers now have an explicit order so any given set of modifiers (e.g. Debilitate and Split) will have the same effect regardless of in which order they were added

Balance:
- Increase the number of minibosses on loop levels
- Make minibosses having multiple modifiers; probability increase drastically for each loop level
- Bolt deals more damage when more units are targeted

Music: 
Normalized volume of tracks
Added "Spellmasons Theme" to soundtrack!!
(Theme plays only on the menu screen)

Sound:
Normalize all sound effects

UI:
- "Class" upgrades are now available in the persistent Upgrade Menu in the Spellbook
- Add modifier descriptions to tooltip content
- Color Blessings Gold and Curses Purple in tooltip
- Show inventory book icon glow if you are able to purchase an upgrade

Fixes:

- **BIG FIX**: unit and pickup id desync
    HORRAY! This has been the cause of many-a-desync.
    underworld's lastPickupId and lastUnitId are now only updated
    if !prediction.  This ensures that the headless server and the clients
    always have synced ids.
- fix: Loading Hotseat Multiplayer games
    in a singleplayer context.
    Thanks Sippy for reporting!
- Modifier.Init wasn't using prediction in load unit (#823)
- Cards wont reappear after reroll within the same upgrade selection. Omitted cards reset each time an upgrade has been picked.
- Fixes an issue where player could get "No upgrades to choose from" even when there are upgrades left to get.
- Prevent showing upgrade button if there are no upgrades to choose from.
- modifier subsprites and visuals missing on load
    Refactors modifier `init` to `addModifierVisuals` to better
    describe what it does.
    It is separate from `add` because `add` setup up state that
    is still present on save/load, whereas visuals such as
    subsprites or particles have to be reinitialized on load
- Fix shield and bloat not persisting through loads / mutliplayer late join
- Fix player being unable to cast while immune to freeze
- Polymorph preserves currentHealthRatio (#841)
- Clone supports pickup power property
- Fix: RecalcDifficulty no longer overrides Unit Stats
    - Overriding unit stats based on source stats would cause modifiers and other stat changes to be "undone" any time the game difficulty was recalculated
- Blood Curse guarantees integer stats
- Fix an issue where the scale modifier applied by split was not changing properly with quantity
- fix: Soul Shard Owner purification from making soul shard havers invulnerable.
- fix: Consistent camera movement speed.  Camera will move and lerp at roughly the same speed across all reasonable framerates
- fix Player Health/Mana bar visuals (#869)
    - The value of incoming shield is now displayed during prediction
    - Changes to max Health/Mana are now shown in the lower UI bars the same way they are shown in the overhead prediction bars (i.e. blood curse shows as doubling current hp and preserving max health ratio)
    - Health/Mana gain visuals were swapped such that increases give a "fuller" looking bar, and decreases give an "emptier" one
    - Fixed an issue where overfilling mana would always display mana cost bars, even when no prediction was running
    - Fixed inaccurate and overlapping mana cost bars
    - Overfilling mana is now much more clear, and you can see each stage of mana bar as it appears, instead of mana just appearing "full" until post-prediction
    - The Health/Mana bars now look the same in prediction as they will after the effect occurs (predicting blood curse no longer shows hp going to full, overfilled mana displays correctly, etc. healing/damage and mana gain/loss visuals are still present)
    - Fixed "sheild" typo
- fix: Player clones now deal damage
- fix: Don't restore freeze sprite
    when in "freeze immune" state
Docs:
- Improve Modding Documentation (#870)
- Doc: Clarify why split does not affect max mana

## 1.39.0
ref: Remove cooldowns
    After considering, I've determined that the idea of a cooldown itself is
    against the design of Spellmasons.  This was just a bandaid to
    a few select spells being overpowered.  I've found it better to
    alter the spell logic itself (in the case of freeze to not allow stacking)
    and to make them more mana expensive (in the case of resurrect)
    which will prevent them from just being cast turn after turn.
    
    Also the modifier itself can prevent the unit from being
    refrozen (see freeze) which is much better than cooldowns
     because it also prevents refreezing in multiplayer.

Balance: Freeze
    Removes cooldown
    Freeze no longer stacks

Balance: Increase Merge rarity

fix: Prevent empower from targeting players to prevent confusion
i18n: Clarify that Empower does not affect players

art: Add slightly new cast animation

audio: Only play "endTurn" sfx once per turn
    Thanks Hazzie and Nord from Youtube for   
    this suggestion!

fix: Backfill stat upgrades for players who
    join late.
    Thanks Waterbending Squirrel!
    Fixes: #567

audio: Smoothly switch songs
    Don't switch songs every time a level is beaten, switch
    when the song is done
    Closes #805

content: Add Ultra Clone as upgrade to clone
    in order to balance out the clone + merge exploit which
    was mainly possible because clone with adding the clone as a target
    yields exponential results when stacked.  Now the basic clone does
    not add clones as a target

fix: Intercept END_TURN message
    and do not send the original.  Send a new END_TURN message as client with playersTurnEnded attached.
    (Note: this already worked except it still sent through the original END_TURN message, this fixes the original from being
    sent through and only sends the transformed one through)
    Resolved: #811

log: Improve error message for proper aggregation
    on remote logger

experiment: MultiColorReplaceFilter
    Decrease epsilon for blood golem to see if
    it resolves #695

UI: Fix default "Refund" text
    Before if no text was provided, none would appear for refund.


balance: Exclude Execute from starting damage spells (#807)
    - Since it cannot deal damage on its own

## 1.38.0 - Patch

fix: NPCs not ending their turns
    Big thanks to Un4o1y, Xeddar and Adriller
    Resolves #737

ref: Remove client side timeout for cards.
    When there are many enemies on screen the game's fps can slow
    which can cause cards to timeout which means the result of a cast may not match the prediction.  This is bad.
    Instead, I will just leave the timeout on the serverside
    so the server will not hang.

perf: Optimize ancient attack for FPS
    also optimize Blood splatter.
    Thanks @Whisky

ref: END_TURN syncing
    Now when a client sends END_TURN, the server
    will append the list of client ids of all clients that
    have ended their turn.
    When clients recieve END_TURN they will now
    sync to the server's END_TURN state.

i18n: Translate card rarity
    Update Polish
    Thanks @Whisky!

fix: Bolt radius increases for submerged units (#797)
    Thanks R?c??l?sc?nc?/recoalescence

fix: Teleport pickup prediction (#787)
    Fixes an issue that cause displace, teleport, and similar "set location" spells to trigger real world pickups while in prediction mode
    Thanks @Whisky

fix: Primed Corpse particles not reinitializing on units that recently had them

fix: Player channelling animation while dead (#781)

src: Plus Radius can now be cast on its own (#786)
    * Plus Radius can now be cast on its own
    - To let players increase Urn Radius
    * Add refund for plus radius

ref: Change up order of color replace colors
    to see if it affects #695

copy: Fix modifier name "Primed Corpse" since it is visible to players
    Thanks Chumler

optimization: Save function to not have duplicate (#777)
    units, pickups, players arrays

src: Guard spellmason NPC action
    with timeout

menu: Server list will be sorted by version number so servers on the latest version will be at the top

menu: Readd enemies to the codex
    Close #746


## 1.37.0 - Patch
fix: Softlock fix attempt 2
All spells now have builtin timeouts with error reporting to prevent
softlocks (where the game is working but the turn wont continue).
This *should* resolve the softlock issue or in the least tell me what's
causing it.

fix: large memory leak
HUGE THANKS to DeathmonkeyJ (Github) and @Jace (Discord) for pointing me in the right direction

fix: Force Move desync fix
All spells that use force move (push, pull, etc) should be MUCH more reliable
in multiplayer now

## 1.36.0 - Patch
ui fix: card-inspect scale
    where cards had greatly varying sizes
    (slash was super small)

menu: Update default ally unit outlines to be 2px
    consistent with enemy default outline

fix: NPCs casting on wrong faction units
    - Thanks @Viz and @CandyKiller

fix: All bolts play at once

fix: Burst quantity damage (#736)
    Stacks of burst were being double multiplied

fix: Protect specific spells from hanging server
    Burst: 52
    Bolt: 46
    merge: 28
    Connect: 11
    Triple Arrow: 8
    Multi Arrow: 4
    clone: 4
    Phantom Arrow: 4
    meteor: 1

fix: Add end turn protection
    
    Many players have been experiencing issues
    where all players have turn ended on their clients
    but the game does not progress
    
    It seems there are multiple causes
    > Re-readying up would have one of a few effects for us:
    1: It unlocked for us
    2: It made the noise over and over before unlocking after a 15-40 sec wait
    3: It was completely stuck requiring us to save and restart the server completely (because when we would try to rejoin some players were in the game alone at the starting map even while others were still in the game)
    4: A few of us had full whitescreens with a force quit required
    ~Wispy
    
    This commit handles Cause 1, where somehow the
    clients have that everyone is readied up but the
    server is missing one.
    A client, when ending turn, also sends an array of
    all clientIds that have ended turn.
    If any of them are endedTurn == false on the
    server is will end their turn.
    
    This should prevent players from having to re-ready up

fix: Arrows being slow to cast in multiplayer

fix: typos
    Thanks to WestonVincze for contributing!

## 1.35.0 - Patch
- Fix Card size for various resolutions and zoom levels
    Thanks Moonlighter, MaitrePhoenix, Monarch
- Balance max scale of units that have been merged and reset player scale between levels
    Thanks Monarch
- Fix remove "reroll" button from Class selection screen
- Improve Camera max movement so you can move freely but not so far off screen that you get lost

## 1.34.0 - Patch
- Balance: Merge 
    Merge: Players gain current stats instead of max
- Balance: Soul Shard
    - Soul Shard can now only target allies
    - Now resurrects players with full hp/stamina/mana, since resurrecting without these resources felt bad/hopeless and resulted in some unexpected deaths.
    - Soul Shard modifier is no longer cleared from all other sharded units when the shard owner gets revived, while this old behavior created some sense of balance, it also felt really buggy and causes some unexpected interactions and deaths. It also gives the spell an artificial limit, which goes against the core design of Spellmasons.
    - Thanks @Monarch for bug reports
- fix: Crazy unit size scaling bug
- fix: Player unit self damage not showing on healthbar
- fix: Remove soul bind on death
    - Thanks @chrillo
- fix: ProgressGameState and LevelRegen
    Thanks @Elvarien, @Viz, and Caiden from SteamCommunity
    - Fixed bug that caused levels to be skipped
    - Fixes an issue where old health bars would persist into new levels until you moved your mouse
    - Fixes an issue where spawning portals would be prioritized over moving to the next level
- fix: Don't show "disappear particles"
    for pickups that are already flagged for removal
- fix: Prevent forceMove from
    acting on units and pickups that are flagged to be removed
- fix: Polymorph no longer works on recall points (#689)
    - Thanks @Whisky and @Viz
- fix: Polymorph
    - Thanks @Whisky
    - Polymorph: Persist death and modifiers
    - Fixes a bug where polymorph would revive dead units
    - Fixes a bug where polymorph would not persist modifiers
- UI: Fix card scaling
    - Thanks @Chumler
- UI: Soul Bind Visuals
    - Thanks @Monarch
- camera: Sensible camera clamp limits
    so that the camera doesn't get lost.
    'z' centers camera on map if not spawned.
    - Thanks @Viz


## 1.33.0 - One Year Anniversary Update!
New Boss!
Goru the Corpse Warlock

New Spells!
- Alchemize
- Execute
- Merge
- Meteor
- Polymorph
- Recall
- Shatter
- Soul Bind
- Soul Shard
- Stomp
- Target Curse
- Target Injured
- Empower
- Enfeeble
- Bolt
- Dark Tide
- Blood Bath
- Fling

New Music!
2 new songs for the anniversiary release

New Trailer!
https://youtu.be/NNAzAQcNUXc?si=PsdDjUjowZFW0B1a

Other changes
- content: Remove cursed mana potion
    because it is anti-fun.
    Thanks to Kyte from Steam Community
- i18n: Save dialog, modifiers, undying
- menu: Deduplicate previousCustomUrls
- ref: Allow purple portal to be used mid-game (#653)
- fix: Upgrades work in the + levels
- fix: shadows overlapping newly spawned units
- fix: Prevent units disappearing when too close to Wall
    Thank you @Viz for reporting
- mods: Remove broken explosive archer mod
- fix: Protect against MessageQueue softlock
    Thanks @JCDreamz for reporting


## 1.31.0 - Stability update in preparation for big content update!
- i18n: Polish
    Update Polish translations with Whisky's translation
    Closes #602
- art: Add particles to skyBeam
    and reposition it slightly to better cover the player's feet
- art: Default to 1px unit outline
    Closes: #400
- art: Add shadows below walls
    so they feel more connected to the environment.
    Closes: #581
- art: Update animated tombstone
- art: Spellmasons play the bookIdle animation
    when viewing their inventory.
    Fixes bookOpen from playing every time a spell is cast in multiplayer
    even if no other player is casting
- fix: poison undefined bug
- fix: clone
    Too many stacks would break the game due to the
    absurd number (limit to 10).
    Fix clone prediction badges, it now shows the actual number of
    cloned units because they no longer overlap
    Closes #587
- fix: SYNC_SOME_STATE (#584)
    * fix: SYNC_SOME_STATE
    to send the state in the same message as
    SPELL so there's no network delay which
    presumably was overwriting newer messages
    * chore: Use new bun sever that
    allows for modified messages.
    * chore: Restore @websocketpie/server
    so that players can run a server locally with node
- fix: forceMove timeouts when multiple (#575)
    force moves were added to a unit or pickup
    Closes #571
- fix: Async damage on flamestrike
- fix: contaminate extras (#573)
    * fix: radiusBoost refactor for mods
    Closes: #572
    Closes: #546
    * fix: Contaminate not spreading modifier "extras"
    Fixes soul shard, bloat, etc
    Closes #570
- fix: Targeting Unspawned Players (#551)
    * Underworld param for addTarget()
    Fixes a bug that allowed unspawned players to be targeted, which could cause a desync in the game over state, and adds further support for additional universal targeting catches by passing underworld through as a parameter to the add target function
    * Fix Target Similar Targeting Unspawned Units
    * Added warning for future bug catching
    * Fixed prediction discrepancy
- fix: "Good Looks" upgrade filters out Doodads now (#559)
- fix: Units being removed for being "out of bounds"
    when they were just close up against an upper wall.
    Unit's center point is the center of their image, and since this game is 2D but
    allow's "tile overlap" because it is appearing as isometric, the pathing bounds
    are pulled up by 10 (-10) and so when checking if a units' center point is
    inside a wall, we need to + 10 (down) to account for the fact that they can overlap
    by 10 with a wall that is above them.
- fix: Squiggly force move lines (#527)
    when multiple forces were applied to the same object.
    Now forces get summed.
    
    Also fix prediction and headless fully processing
    forcemoves between units dying instead of letting all units die and then
    processing all the force moves (like the regular game client always has)
- fix: await endPlayerTurn (#509)
    This is not in response to a bug, but I noticed that endPlayerTurn
    is async and not being awaited.
    Based on a visual inspection this only effects hotseat
- fix: contaminate now spreads extra properties of modifiers (curses) such as expanded range
    - Thanks to @theytookmysoul aka Wisky
- fix: Good Looks no longer explodes urns
    - Thanks @Elvarien
- fix: Game soft locks if whole party is froze
    - Thanks @Waterbending Squirrel for reporting
- menu: Add "recent custom server urls"
    Closes #514
- menu: Support quicksave at beginning of level
- menu: Add bookmarks to menu (#588)
    * menu: Add bookmarks to menu
    Closes #358
- i18n: Poison "start" -> "end"
    Closes #513
- menu: Style Accessibility menu so it's more organized
    Add gore options to a11y menu in addition to
    graphics menu
    menu: Make actively selected buttons more obvious
- npm: @websocketpie/client@1.1.4
- optim: makeManaTrail to lower particles
    if number of trails gets large
    Fixes: #519
- Optimization: Only run prediction calculations
    if the player is hovering over the game space.
    If they are hovering over the spellbook or toolbar,
    it will not run predictions and thus not bog down
    the experience of picking new spells when
    the prediction calculation is hefty.
    Thank you @Whisky for this idea!
- chore: Add unit.predictionCopy to real units (#577)
    so that you can reference their latest prediction unit.
    Sometimes predictionUnit ids and unit ids will not match
    `id: prediction ? ++lastPredictionUnitId : ++underworld.lastUnitId,`
    This is because predictions can create lots of units that don't
    exist yet (like from clone) and each of them need to be distinct
    This property serves as an easy way to access the associated prediction
    unit



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