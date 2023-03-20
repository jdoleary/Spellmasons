
## QA 1.11
- is it saving too many copies of saved game on network disconnect?
- bug in Hotseat multiplayer where player 1 keeps getting to choose spells every time it's his turn (3 players)
---
- Spud Bud — Today at 1:13 PM
We did test that a little. He would walk to stand on top of my friend and just stand there if he didn't move, without attacking. If I walked into his attack range, he would attack me on his turn
- Bug: Blood curse doesn't load in properly.  I cursed a golem and it had 40 health when saved, then I load and it has 20 health
- i18n: Cannot load multiplayer game over a game that is ongoing
- Got "Back to Lobby" menu and when I returned and resumed game then I was able to see the save button in multiplayer menu.
(menu desync)

- K̸̜̋ä̷͓́r̵̖͌p̴͙̚ḯ̵̖m̶̨̂u̴̫̓s̴̙͋ — Today at 3:50 PM
The person I was playing with said he would receive number messages showing he lost Mana when we started the lvl which caused him to have only his normal amount plus whatever he gained from stuff like x Mana per map. Whatever caused it was basically acting as if he was already past turn 1 I suppose.
-  general.catallion [has Spellmasons] Mar 12 @ 10:03pm
really fun, but the co-op has major bugs
me and my friends tried playing together and it was alot of fun working together to absolutely ruin the enemies, but enemies and drops were de-syncing, not everyone was getting spells when a scroll was picked up, and occasionally the game/server breaks and we get sent to the beginning of the run again. 
- Madgod — 03/13/2023 11:01 PM
Any time. The wall enemies and repicking all skills happen fairly often, the game reset and wrong level splash has only happened to us twice
- Jacobzeba01 — Today at 3:04 AM
Not sure if it was mentioned, but I found a bug in multiplayer where if you collect a potion and end your turn standing where the potion you collected was, you end up collecting the potion again next turn, that is what I have gathered at least, I will see if I can do it again to be sure.
EDIT: seems to have only happened once, maybe a connection issue on my end, I'll keep an eye out 
- see Madgod's videos https://discord.com/channels/1032294536640200766/1084206357072314480/1084979969417027715

- Sometimes, somehow people get sent back to the beginning of a run. STEAM general.catallion [has Spellmasons] 15 hours ago 
  - This can happen if the server crashes and reboots I think

- STEAM: Moth [has Spellmasons] Mar 11 @ 7:33pm
No upgrades in co-op
Don't know if this is the right place to post it, but my friend and I were playing co-op and after the third of fourth level my friend(he was the host) **just stopped receiving upgrades.** Anyone know anything about it?
His upgrades: https://i.imgur.com/sQoECQX.png
My upgrades: https://i.imgur.com/yvyQpJn.png	
NOTE: He's missing PERKS not cards

- Jacobzeba01 — Today at 2:20 AM
That's not supposed to be there, enemies and items seem to be appearing outside the map

Also we have noticed the mana potion seems to be giving more then what it used too, causing Aliensmoke to go into +200 extra mana from 1 mana potion.I'm noticing the levels seem to jump from different layouts when loading in until it settles on one, so I feel that may be causing this
- this is the 4th to 5th time it's done this, calamity seems to be picking phantom arrow only.
- Skip to ghost biome" admin tool doesn't work anymore?
- on EU server when chaning levels it lets the AI take an initial turn
  - **issue with multiple levels generating and making a level desync** on EU server.  Must be a race condition or something
---
- bug: when a spell drops on hotseat multiplayer, on next players turn, they just get to pick the spell
  - also player one's turn starts before the AI has finished with their turn
- bug: I cast a golem summon out of the inventory without closing the inventory and it didn't change in visible mana cost
## v1.9
- yewny — Today at 2:36 PM not sure if this is a bug or a design choice but overlays dont work on the game? i noticed the discord overlay (which i use every day) wouldnt open, but the discord overlay is finnicky so i thought it was just acting up again, but then when i tried opening the steam overlay that also didnt work, and it didnt work for my partner either. it would be really convenient for me to be able to use overlays in the game if there wasnt a reason for them to not be working
- BeePsychotic — Today at 11:00 AM Quick one that doesn't happen too often. Every once and awhile I'll be playing a bit fast and just clicking really quick between spells and even when I don't have enough mana it will let me cast. It seems like I got the next spell up too fast for some sort of calculation. I've had some coding projects where this has happened in the past, that's the only thing I could think of. I could see this being exploited. It's hard for me to recreate, but when it comes to high cost stuff it is a balance issue.
---
- todo: pickups check prediction but not headless
- Also please nerf debilitate and freeze. As they are, these spells break the game. Its particularly unsatisfying in multiplayer because players can infinitely cycle AOE freezes without breaking a sweat. from Scojbo steam review
- https://steamcommunity.com/app/1618380/eventcomments/3780245614663287146/ Found a new bug while playing multiplayer, my friend used a bunch of radius spells like splash, target kind, over and over and tried to nuke the map while everything was already dead. While we were waiting for everything to link together he got bored and I told him everything was already dead. He just hopped into the portal and we loaded into the next level. We could still hear the sound of the spell from the last level linking. All of a sudden I get nuked from a random spell while I was waiting for him to spawn. 
- scojbo — Yesterday at 8:48 PM
Any world in which we can add an option for increased difficulty?  Solo player gets pretty easy after a couple runs, and multiplayer does not scale well currently (its WAY WAY easier than solo).

Please dont take this as a complaint. I love the game! Genius concept and I've had a blast playing what content there is!
- BeePsychotic — Today at 4:41 PM
I've been taking more damage from enemies than what is stated when you click on them. One example was a ghost archer who was only supposed to do 40 damage and I had 48. It killed me. I noticed this before the current patch, but thought maybe I was just wasn't paying attention to some other damage source.
- Perks stop working once you have all the scrolls (Jseah on Steam Community)

- " Even further, using Target Kind + Connect + Target Similar to Vortex all the potions on to yourself can lag the game fiercely " 
  -  Adding Last Will to multi-target kills was a favourite tactic of mine, but this tends to slow the game down; especially when you Last Will-Sacrifice-Resurrect your own army...
  - (Jseah on Steam Community)
double-plus when you have dark summoners you killed and resurrected spamming things everywhere that all drop potions when you sacrifice them...
- bug: During AI battle when an archer is being resurrected it will slide across the ground
- bug: Desync issues:
  - if you do multiplayer and have one on the other screen you can miss things like player movement, where when player 1 walks into a trap they'll take damage on player 2 screen and the trap will disappear but the player 1 is still where they started on their screen.
  - stamina potions don't show, and when rejoining stamina potion didn't seem to trigger on server because stamina was back to where it was pre potion
- bug burst desync where it said it would do less damage than it did in prediction
- bug: v1.8 pickup desync, a scroll appeared and then disappeared
- bug: Casting freeze on ally player made their stamina go to 0 but they lost the freeze modifier
- bug: Sacrifice doesn't show the health gained in prediction
- I was able to induce a temporary desync when alt-tabbed (one game Fullscreen real exe the other a browser on another windows virtual space), the player that took damage's health was desynced but it corrected after ending turn
- Sometimes the first tutorial level will spawn a water pool and if you spawn in it it just takes you to the next level immediately
- TODO: Optimize replaceAll('BD2023') to consider lowercase so there doesn't have to be 2
Playtest notes:
- +75 single turn mana is probably too much
- +15 health capacity every level is too much
- TODO: update explain new spells to not include pickup turn limit
---
# Today
- Weavejester: A common issue we have is the first scroll appearing for different creatures. So player A will kill monster 1 and get a scroll, but this won't appear for the others. Player B kills monster 2 and gets a scroll, and this too is invisible to the other players. It sounds as if the randomization seed isn't being correctly propagated, or perhaps the order of the creatures is different.
- WhiteScythe — Today at 12:09 AM
It's me again : got a friend to join me and my brother for 3 person multiplayer; the first scroll we picked up gave one of us infinite spell selection. So they got every spell in the game. It was weird. Seashell, if that matters.
- **important** Fix slash and undead blade STILL don't wait quite long enough for all the take damages to take effect
- Fix trap so animations don't run on headless
- run predictions doesn't update when you start your turn
---
Weavejester — Today at 6:33 PM
Sure! My experience has been that desyncs have gotten significantly worse - I think starting from 1.6.1, but it might have been 1.5.2. Before on a 3 player multiplayer we got through maybe an average of 7 missions before desync. Now it desyncs on the 2nd mission pretty consistently. It might have something to do with casting a spell before everyone has selected a starting location.
We tried to be careful about casting spells before choosing starting locations, and then we got an issue where all spells targeted a single player, no matter what we were targeting in game. i.e. we'd push a enemy, and the player would be pushed. We'd damage the enemy, and the player would be damaged.
We've been playing as a 3 person group on the Lion European server.
That all said, the game itself is really fun, and I definitely appreciate the difficulty of testing multiplayer as a single developer! So please don't take this as a criticism - I know you're probably working your hardest on this 🙂
I'll definitely come back to this game once multiplayer is viable for us. Given that other people seem to be able to play Spellmasons, while for us its unplayable, could it have something to do with the Lion server? It's the only thing I can think of that we have in common.
---
- Treycore — Today at 2:27 AM
Playing Co-Op on the community server and when one of us would die, the game screen would freeze on their end and they wouldn’t even get too see their death animation… Also when they quit the game it spawned a duplicate character into the game for one of the other guys on our team
Blackjack Barret — Today at 3:26 PM
Top two spell slots on the right sidebar do not allow spells to be placed in them
Image
Blackjack Barret — Today at 4:00 PM
co-op on community server 1 - Seashell shows desyncs if a spell is cast before all players have picked a starting location. The frequency of desyncs also heavily increased at 6 players. At 5 players it is very playable with some desyncs but at 6 it appears to be very frequent with many spells showing the target of the spell as an enemy but instead the spell would desync and target a fellow player, this was a repeated occurrence and made the game unplayable unless players were out of range of each other. 
- discord bot to manage LFG `I think theres a bot for that Jordan like MEE6 reaction roles`
- Improve korean translation
```
 FaeOfTheFlesh [has Spellmasons] Feb 15 @ 4:30pm
Possible Bug. spells cast from spell book and not placed in a hot bar don't reduce in price
I was casting spells from the spell book (as my slots were full and hadn't discovered the side bars yet). I noticed any spell I cast from the spell book wouldn't cool down it's mana cost until it was placed into a spell bar slot and allowed to end a turn there.

is this intentional?

The spell book was also not updating the spell price for several spells including decoy and bloat when cast from the spell book and showed their minimum cost not their current cost.
Showing 1-3 of 3 comments
Spellmasons  [developer] Feb 16 @ 12:30pm 
This is odd, I don't encounter this when I cast from the spellbook. Does it happen always or only for specific spell combinations?
#1
High Drag Low Speed [has Spellmasons] Feb 16 @ 5:37pm 
I ran into this yesterday specifically with the Target Similar and Target Kind (I think that's what it is called, targets 5 of the same). Didn't appear with any other spells.
#2
FaeOfTheFlesh [has Spellmasons] Feb 16 @ 8:28pm 
It was happening everytime for me (I've gotten around it by using the additional sidebar spell slots).

```
```
 Pazuzu [has Spellmasons] Feb 7 @ 4:47pm
Bug: blood curse is permanently on, despite no cause for it.
Possibly caused by cloning myself?
Showing 1-3 of 3 comments
Spellmasons  [developer] Feb 8 @ 1:01pm 
Did you get bitten by a vampire? They will transfer blood curse to you
#1
Pazuzu [has Spellmasons] Feb 17 @ 3:04pm 
I did not

```
# for v1.7
- was able to create a desync with pickups (error and portal sticking around) when moving from one multiplayer game to another
- health perk is OP https://steamcommunity.com/app/1618380/discussions/0/3766734182339003642/
- Mana stealing entire map results in frame lag: https://steamcommunity.com/app/1618380/discussions/0/3766734182331523444/
- ```Late game optimizations to prevent crashes
Lashawnda Gandara — Today at 6:50 AM
so last will is op-
Image
that's enough spellmasons for today
it crashed after i cast the spell
```
- suggestion: Skier — Yesterday at 11:47 PM I think it would help if when summoners were spawned from dark summoners they didn't have full mana
- bug: does turn cycle carry on without you with a clone of yourself alive? https://discord.com/channels/1032294536640200766/1074491932220334080/1075048220331352175
- bug: Coaldust Numbers — Yesterday at 7:15 PM @Jordan - Spellmasons Developer I've noticed bugs in two spell components.  Vortex can no longer be cast without a target (e.g. to pull things toward a point on the ground, like repulse but in reverse).  Additional casts of suffocate also extend (instead of shorten) the wait for the enemy to die.
- bug: if a spell kills self and then rez you still die
  - bug: Game over screen will come up if you kill and res yourself
    - doing this with an ally npc causes SET_PHASE to re-kill you during sync, since the ending of the turn happens in Unit.die, it happens before the resurrect (before the spell is done casting)
- bug: Admin skip to lava biome doesn't work anymore until you end your turn,
  does entering a portal not end your turn??
- bug: Dash and burst doesn't work right
```
Lashawnda Gandara — 02/11/2023 12:04 AM
yall i just found this out
if you get single turn extra health, it heals you back to full health when you get it
its op with mana steal and bloodcurse omg
```
- IceCloud discord bug:
```
The spells cos tin the book doesnt get updated unless the spell is on the hotbar
icecloud12 — 02/10/2023 1:54 PM
so that really cause the confusion
icecloud12 — 02/10/2023 2:03 PM
Ah! spells not in hotbar don't decrease their mana at all after a turn even not in use
```
- Self kill with sacrifice cause HotThunder to come back to life
- "heal" saying "Stackable" is confusing (https://discord.com/channels/1032294536640200766/1032294537235812404/1073613840794779741)
but casting from the hotbar works (queuing spells denied).
- bug: resurrect after you die with allies makes the game not be turn based anymore? https://steamcommunity.com/app/1618380/discussions/0/3766733548885838682/
- hotkeys for sidebars (ctrl+ num) https://steamcommunity.com/app/1618380/discussions/0/3766733981708936047/
## validate v1.7
- EULA
# For v1.6
- Dash then burst doesn't work as expected,
  - i think movement spells that affect the caster should update the casterInitialPosition in the effectState (which is only meant to protect against walking movement)
    - but what about arrows
---
- add spells cast IDs to end turn and have the server query back to the client for the spell if it hasn’t recorded that it’s executed that spell message id  before executing the end turn
- bug: Displace can clip you into a wall if your location is really close to a wall
- bug: ally finishes the level for you, you don't get existing scrolls
- **important** if you end your turn while a bloat is still animating, it syncs and then the units keep moving with their velocity, make bloat's explosion awaited
- possible desync when ally npc (ghost archer) killed last enemy npc after triggering AI battle when an enemy killed me
- bug: glop position desync after getting out of water on it's turn
- bug: self cast a bunch of slow then split then went through portal and slow persisted
  - bug: People still experiencing split not being cleared after going trhough portals
- position desync in singleplayer after casting purify on myself and moving around
- bug: deathmason red portals don't get cleaned up if you die
---
- is `Cannot cast, caster does not exist` a source of desyncs?
- Spellmasons thoughts: is the server dropping messages? Could the message queue be getting dropped when a client in a different game sends and init game state message.
## validate for v1.6
- validate players not getting stuck without having ended their turn
  - try with multiple players


---
- bug: frozen players start their next turn with 0 stamina?
- bug: resuming a saved game resumes on AI turn sometimes, haven't reproduced yet
- fullscreen preference should be saved in settings (https://steamcommunity.com/app/1618380/discussions/0/3766733981704564168/)
- bug: Single player, if you end your turn while arrows are still flying enemies can start moving
- Player being dead and getting scroll due to end of level said "Player managed to choose an upgrade without being supposed to" but I do want players to choose an upgrade at this time.
- Translation issues
  - french target column translation is off (note French translations are underway by a real translator)
  - arabic `<h1>` doesn't translate right
  - korean "Forging spells' not translating right
- bug: I was able to go negative mana and when i cast it worked on the server (I could tell because a living enemy dropped a scroll) and I started channelling a book
- bug: Poison stayed on dead unit
- bug: Infinity stamina doesn't work for all players in multiplayer
- bug: killing last unit makes portals spawn early on multiplayer of screen of character who didn't kill the last unit
- bug: sacrifice isn't giving me quite enough health somehow
# For v1.4
- Fix perk limit 
---
- fix `split` as hard counter to summoner and priest and darkpriest
- Slow description, "by 20%" not "to 80%"
- Cache targeting
---
- Units going through walls might be caused by crowding of other AI (Tekyera)
  - also maybe split units can be pushed through walls
  - maybe has to do with smaller walls (the thin ones)
- No init modifier for key split
- Desync info: All players in the lobby see the same desync
- If you put any area targeting spell (even single) between unit and entity (consumables (potions, scroll), corpse), it will duplicate itself (is that how it should be?) (Tekyera)
- J'in — Today at 6:40 AM Post room clear, I was able to select myself with target kind and vortex and pull my teammates non existent bodies back out of the portals, then they were just floating health/mana bars and had to re enter the portals
- Deathmason lack of portals (https://discord.com/channels/1032294536640200766/1071697763743563836/1071697769116471396)
- Spud Bud — Today at 1:44 PM I noticed that when selecting the player unit, the information card that displays on the right, can sometimes get stuck adjusting it's size  to include/not include the scroll bar if the list of information is at an odd size.  I currently have two rows of cards, three every level perks, and one every turn perk listed and can see it occuring.
- Update copy of target kind
- Fix spell pickup pick not keeping bug
- no longer get perks after you have all the spells
---
- **important** desync thought: Maybe the server is just missing messages?
  - or do all players get the same desync??
  - could the server be sending messages out of order?
- Displace desync (end location doesn't show up on other players screens until end turn) (Jas-  Discord)
  - seemed like one client had a different seed because it displaced to a different location
- Clean up lobbies after a game over - Riinkusu — Discord
- Important changes for next
  - Change all pushes to pulls with a deterministic end point (this should resolve bloat issues)
    - Ensure shove still does damage
  - fix bloat with custom on death message
    - seems that it's just the scroll pickups that desync
  - Change reviews channel to thank you channel and describe my mission
  - Cache spell results with IDs for targeting and IDs and end location for pulls
    - network sent spells could look like
  - Pickup.real is lost when cloning
    - could clone be causing pickup desyncs??
  - make setPhase into state machine
  - split removes summoners and priests and dark priests abilities to cast due to not enough mana
```js
{
  firstTargetedUnitId:5,
  cards:[
    {
      card:'TargetCircle',
      targetedUnitIds:[
        3,6
      ]
    }
    {
      card:'slash',
      quantity:2
    },
    {
      card:'pull'
      data: [
        {unitId:5,pullPoint:{x:100,y:200}},
        {unitId:3,pullPoint:{x:100,y:170}},
        {unitId:6,pullPoint:{x:180,y:170}}
      ]
    }
  ]
}
```
- bloat seems to be a consistent cause of **desyncs**
- validate correct position of SavesDir
-  BUG: Selected Spells are not obtained. During some runs, selected spells are not added to the toolbar, nor the spell book. Once the bug happens, it persists through all runs until the application is restarted. (steam https://steamcommunity.com/app/1618380/discussions/0/3766733548888993966/)
- **important** Reroll deleting scrolls bug
- **rework description** or don't let it kill you; People keep being suprised that concerve kills them
- Tekyera (discord) rerolling spell makes them just disappear
  - also "Sparkle" on discord
- bug: corpses that recieve bloat and are attacked, explode
- idea: (Lancelot discord): some spells should use stamina
- Tekyera (discord) arrow indicates that opponent behind other will die but arrow hits front one twice
- Portal spawns before last enemy is killed on multiplayer with burst
- bug: killing self after level end with conserve cheat: https://steamcommunity.com/app/1618380/discussions/0/3766733548885838682/
- **BIG BUG**, if teammate goes through portal without ending their turn, the other player is stuck
  - if I'm out of stamina
- Deathmason missing picture in summon spell
- if you die and allies carry you to the next level the enemies get a turn before you do
- fix mana steal making mana out of nowhere
- Update deathmason description to explain his abilities
- Make spells always target via IDs after they are sent over the network
  - including the first spell.  You can test this by making a multiplayer game, moving an enemy to a different location via the console to simulate a desync, then casting on that enemy on the client that is desynced.  The spell should still trigger and select all the same targets, whether it's a simple "slash" or a bunch of targeting spells, it should be releative to the caster
# For v1.3
- bug: Getting a headless timeout: with target column + freeze?
- target cone + poison, then two arrows but he took out his book and was waiting
- **reproducable bug** if the server disconnects while players are playing and the server reboots, they reconnect but still have their old gamestate
  - then when they end their turns it will since units and pickups but not the level
- could summoner or summon spells (decoy) be desyncing unit id??
- optimize: FPS tanks when hovering over spells when you have a lot for some reason
- bug: SavesDir not saving in the right place to sync with steam cloud? C:\Program Files (x86)\Steam\steamapps\common\Spellmasons\SavesDir vs steamapps\common\Spellmasons\resources\app\src\SavesDir
- **important** could last pickup id be desyncing due to predictions??
  - yes it is, try last will + slash prediction and then check the lastPickupId
- bloat seems be a source of desyncs, it has wildly different calculations for where dropped scrolls go
- had player 2 load into a game after player one burst a bunch of enemies, the pickups are all scatterend in different locations and there's a random portal for no reason; 
  - all these pickups came from INIT_GAME_STATE that didn't make any sense, even a portal
  - THEY ARE THE PICKUPS FROM THE LAST LEVEL
- When killing the map simultaneously (or very large groups of enemies) it seems that the spell drop is multiplied. Me and a buddy was getting 5-10 spells per stage and had every spell in the game by like the 10th floor. Posted a video in general showing our strategy.
- scrolls disappearing desyncing
  - so when potions are dropping is not synced
    - sync cardDropsDropped and enemiesKilled?
    - **important** I should have Pickup.create trigger a network message from the host and have non hosts skip it
- possible to desync by casting on another player that's currently moving?
- potion desync still occurring (maybe fix this in today's update and wait to publish the card refactor)
  - potion mismatches should trigger because that means that one client at least saw it
  - test changing potion ids and make sure they sync
- validate:
  - if player client disconnects and reconnects mid game it should restore their vision to game view
## Delayed
- Rework spells to use unit ids instead of coordinates which will often miss if there is a desync
  - all animate functions should have a built in race timeout where they are invoked
  - validate "are you sure" if you end your turn without casting
  - validate prevent dead players from casting
  - Implement invoking these new functions:
    - mouseMove -> calculateCards().forEach -> cacheSpellInvokation(), showPrediction(realizedCalculation)
    - eventHandler click -> calculateCards().forEach -> cacheSpellInvokation() -> serialize -> pie.send(SPELL, realizedCalculation)
    - onSpell -> deserialize -> .forEach -> animate(realizedCalculation), effect2(realizedCalculation)
```
Isneverthere#3851
This is probably a sync issue but a big issue as of now is the first round in multiplayer, and a few others will have it where mobs die but then the game says no it didn't. Consistently does it first round and randomly for others after. Hope you find a solution, love the game.
```
---
J'in — Yesterday at 5:17 AM
A couple observations from my broken run earlier depicted in General:

1) The spell that sacrifices your health to steal mana from enemies has no limit to the amount of mana it can take from enemies, and will take more mana than the enemy has to give if stacked. I was able to achieve over 15k mana by sacrificing all my health with an AoE spam of this spell. Suggestion : this spell needs to be limited to the amount of mana an enemy has to offer.

2) A lengthy spell will continue to cast even after the targeted enemies are dead. It will continue to link to dead enemies that were killed during that same spell resulting in lengthy animation of connections to once alive (now dead) enemies. The same spell continued to cast when entering the next floor, and because I cast blood curse and a ton of heals on all of us, killed my teammates when the spell finally culminated even though we had moved onto the next floor. Suggestion : If a spell contains offensive (or defensive) components, have that spell end if all targets that will be hurt / helped have already died. ( no reason to continue to connect to a mass pile of bodies, or cast fortify on a dead teammate).  Also, have any and all spell effects in progress end when moving to the next floor.

3) When casting an ungodly amount of arrows, the arrows take a very, very long time to shoot. (the developer has already commented on speeding this up) and will continue to shoot after all enemies have died. (this loops back into the last point)
---
LoveLess#4376
Might want to make it more obvious that you have additional spell bars on the left and right. You'll only know they are there if you are looking while dragging spells. Perhaps while you have your spellbook open they are all highlighted? 
---
J'in — Today at 7:41 PM
After killing mass packs of mobs (in which the killing itself ran fine) it would still spawn several scrolls that would then fly to the player on level end, causing the game to seize up a little
so don't spawn new scrolls if the player has all the available spells
---
## Important for later
- Make turn_phase into a state machine so it can only transition from Stalled to PlayerTurns for example
---
- bug: Player clones no longer attacking
- "I didnt desync until there were dark summoner summoning summoner looool
Summoners"
- add bug report button to game that saves logs
- Chad's copy suggestions: https://docs.google.com/spreadsheets/d/1A_tnEzTPxkXGhh3KoLsuTAuIOeIqY5s6D-15SR6LUxI/edit#gid=0
- Units walking into walls, one user had it happen without movement spells so it must have something to do with spawning
- archers can "stall" out with pathing on the edges of water
- add a better notification for when servers are going down for updates
- pushing a unit through a trap caused a desync on multiplayer but after ending turn it resolved
- bug: stamina potions dont persist in multiplayer
- you can't tell that you lost connection from a server if the server dies while you're in lobby
- synced pickups are missing images
- Improve targeting in SPELL so that if you cast on a unit at a location but the unit is in another location on someone elses screen it will still work.
- **important** todo reset lastUnitid after sync
  - find where else units are syncronized and do the same
Attempting to figure out desyncs, i think they're largely related to misaligned unit ids and maybe now pickup ids.
I saved a sync state and my unit was killed and had a glop attack animation on it but I didn't see that when I saved it
- "no init with modifier for key freeze" when syncing
- entities that are flagged for removal get an image restored during a sync
# For v1.2
- was able to reproduce some weird behavior on multiplayer server by disconnecting one player and reconnecting
  - it showed game over screen until i reconnected and then it was stuck until i ended both of their turns multiple times
- I think desyncs are coming from unit id mismatches based on error logs
- https://sentry.io/organizations/jordan-oleary/issues/3911592323/?project=6306205&query=is%3Aunresolved&referrer=issue-stream
- Multiplayer players don't get "un-split" on new level
- **big** entering portal makes character vanish but not go to next level (singleplayer)
- bug: when you rejoin a game it plays the enemies turn first instead of resuming at yours
  - not always reproducable, maybe set all players to not endedTurn when it goes to stalled
- MOVE PLAYER appears to be processed AFTER spell finishes even if it occurs during
- perk % increase is way to weak early on and way to strong later on
- **big** if both players end turn while arrows are flying it causes desync
  - ending turn before cast animation finishes causes desync
- server hub should handle downed server status
- bug: radius+ column +target kind not optimized for concurrent animations
---
- thank and notify icecloud12 for suffocate report
- shove damage doesn't increase
- bug: blood archer shot after moving
- stamina resets after i end my turn in multiplaer after a stamina potion
- allies didn't carry on the battle after i died until i explicitly ended my turn
- predicting 'sacrifice' over a decoy shows pickup dissapear particles on all pickups in prediction
- bug: corruption particles appear unexpectedly on level 1 at 0,0
  - okay I think it had something to do with admin deleting a unit and then ending my turn
- after 2 of each curse + contageous: TODO fix contageous
```
suffocate.ts:98 Should have suffocate modifier on unit but it is missing
onTurnStart @ suffocate.ts:98
(anonymous) @ Underworld.ts:2024
initializePlayerTurns @ Underworld.ts:2021
initializeTurnPhase @ Underworld.ts:2469
handleOnDataMessage @ networkHandler.ts:317
(anonymous) @ networkHandler.ts:203
processNextInQueue @ messageQueue.ts:10
(anonymous) @ messageQueue.ts:15
Promise.then (async)
processNextInQueue @ messageQueue.ts:11
(anonymous) @ messageQueue.ts:15
Promise.then (async)
processNextInQueue @ messageQueue.ts:11
processNextInQueueIfReady @ networkHandler.ts:203
handleOnDataMessageSyncronously @ networkHandler.ts:195
onData @ networkHandler.ts:169
pie.onData @ wsPieSetup.ts:162
handleMessage @ PieClient.js:327
sendData @ PieClient.js:473
broadcastTurnPhase @ Underworld.ts:2380
tryEndPlayerTurnPhase @ Underworld.ts:1885
endPlayerTurn @ Underworld.ts:2146
await in endPlayerTurn (async)
initializePlayerTurns @ Underworld.ts:2030
await in initializePlayerTurns (async)
initializeTurnPhase @ Underworld.ts:2469
handleOnDataMessage @ networkHandler.ts:317
(anonymous) @ networkHandler.ts:203
processNextInQueue @ messageQueue.ts:10
(anonymous) @ messageQueue.ts:15
Promise.then (async)
processNextInQueue @ messageQueue.ts:11
(anonymous) @ messageQueue.ts:15
Promise.then (async)
processNextInQueue @ messageQueue.ts:11
(anonymous) @ messageQueue.ts:15
poison.ts:104 Should have poison modifier on unit but it is missing
```
- aquire pickup for red portals doesn't work in singleplayer
- "Waiting" spell book doesn't open when you're waiting on your own spells
- Make "bleed" copy simpler so people don't have to think about the math
- player unit's position seems to be rounding to whole number on server
- new networked trigger pickup makes a unit pushed into a trap have the trap
  trigger immediately instead of when they touch it on multiplayer only
- a bunch of errors:
  `wsPie Error: Cannot send data to room, not currently connected to web socket server`
  when the server disconnects but the player does not
- chain choice can be messed up because a recursive chain could see only a unit
  of another kind as an option where there are other options available earlier
  in the recursion
- post on itch.io
- Plan modding
- Demo
- look into Russian Ruble price discrepancy
- More requests for hotseat multiplayer
- idea: Change name color
- last will + clone allows infinite mana
- mana refunded but not really (see MacgyverTheDiver's video on discord)
- unreproduced: dash to scroll in lava didn't hurt player but they still got the
  scroll
- when you have all spells you stop getting perks?
- Connect is targeting self when there is another enemy available, see Reyna's
  picture in #general
- left off at "(sorry for my bad english i'm french) if you skip your turn
  before placing your character it will do the mob turn and after some skip you
  will die.")
- Add Amsterdam server after you fix multiplayer
- Deleted saves get restored (maybe because of duplicate names?)
- Experienced the following bugs in multiplayer both local and on the community
  server: Enemies would sometimes revive if killed, seems to do it consistent if
  hit with the bleed attack, if you somehow disconnect there is no way to
  reconnect and the runs has been lost. At last this isn’t a bug, but at the
  current state focusing hp is too powerful and will make you able to one turn
  every level (targets spell + manasteal)
- hotbar rebinding doesn't reflect in the UI


## Unanswered questions:

- How is it possible that the particle emitters didn't get cleaned up? How did
  castCards not finissh??

## Validation for 1.1.0

- Validate "how to host your own server" button link works

# Community ideas:

- Reyna: Would really appreciate the capability of viewing the map while picking
  a spell, maybe just minimizing the selector until I'm sure what will be able
  to help
- J'in: Suggestion: when losing a run, return to lobby instead of leaving game
- WellaWeiss — Today at 3:11 AM Really liking the game as well, can definitely
  agree with those suggestions, I also wish the we could directly control
  summons
- icecloud12: I think we need more spells that interupts enemies

## Notify people when languages get finalized:

- Japanese
  - @Char_841 via twitter

## outstanding small bugs

- multiplayer bug it was hard to get in and a portal and an image of one of us
  sspawned outside the map
- if an arrow kills a unit and you don't move your curser and it had an
  attention marker it will still have an attention marker until you move your
  cursor
  - this is just with arrow
- forcePush gets an extra false line if pushing into water

## Brad Playtest

He doesn’t think saving a loading is a good idea Overflow health is buggy? It
said he had health but he died unexpectedly After randoming he got 3 spell
choices again. “Pick your second spell” Text overflow on capture soul and plus
radius Advice: how do Pokémon cards work. Could represent damage or other info
differently Disable Ctrl zoom Test on 4k or 8k monitor Font size at 1024x768 is
too small Changing resolution permanently makes text smaller Stamina doesn’t
restore properly after a load Add visual or audio effect when perk procs Archer
pathing is messed up when there are walls in between Perks should show in your
spell book Killing himself, with no enemies, live, and an ally sent him two
levels ahead After casting a spell that kills himself and res himself in the
same spell, he has been able to go massively negative mana “Pick a
spell/upgrade”/“choose a place to spawn” isn’t translated Perks aren’t
translated

- UX: doesn't like the cinematic

---

## Brad playtest

- he moved and sync died issue at the beginning
- decoy spell copy overflows on small resolution
- some spells are lowercase in player tooltip
- if you die to poison "your turn" + "you died" overlap
- poisoner miniboss should do more quantity when poisoning
- displace desync - cast on wrong guy??
  - he was right next to him
- too many dark summoners
- bossmason purifying himself doesn't remove the animated poison
  - Server issue??
- resurrected sand vamp still had poison animation
- bossmason particles should go out when he dies

---

- add mana refunds for more spells (like slash)

---

    - plus radius overflows on 1920 x 1080 resolution full screen
    - Improve difficulty scaling with over 4 players
    - Check volume defaults
    - test all spells on multiplayer
    - bug: player 2 doesn't get cinematic
    - "waiting" book comes out too early

## 2023.01.11

- bug: Got "you cannot move while casting" but I was able to move anyway
- mention c.a.geary1@gmail.com in comments if he helps with copy

# Desired Schedule

- Bossmason is missing explain gif
- Restore dragger behavior? watch out for sync issues
- word wrap on spells that are too long looks off
- January 1/8-1/14
  - Test on different resolutions
  - Menu: Fix overflow for all pages rather than the one-off fixes I've been
    doing.
  - Add refunds to as many spells as possible if they have no effect
- January 1/22-1/28
  - Prepare to ship
    - [Release Demo](https://partner.steamgames.com/doc/store/application/demos)
    - Accessability / Localization Language Support / Spellcheck
    - Establish Minimum System Requirements and update Steam Page
    - Add sentry errors to electron node files
    - Achievements?
    - Accessability option to make text more readable
  - Final QA
    - Manually test all spells for desync issues (in multiplayer)
    - Test for desyncs on multiplayer
    - Bulletproof Updating and Error Reporting
- Other
  - 2nd algorithm for generating levels
    - see branch 2nd-level-algorithm
  - [Submit demo to IGN](https://corp.ign.com/submit-a-game)

---

- **Important** How close am I to 5mb limit for save files? what to do if I go
  over?
- menu: Skip tutorial button in settings doesn't go away once clicked
- (fixed?) early levels are too big, later levels are too small
- fix hover styling for perk reroll button
- single player game overscreen should offer to restart at checkpoint
- music is too soft relative to sfx
- Brad playtest
  - blood golem too powerful? shouldn't be able to do kill damage? or introduce
    later
  - explain graphic for summoner icon
  - debilitate cheaper and less effective
  - Easy to not grow your max mana, maybe get some by default each level? (and
    for health)
  - maybe perks should do concrete amounts instead of %s
  - weird line coming off of units that you pull into liquid on death
  - turn off target snapping when your first spell is a targeting spell for
    convenience
  - spellbook animation is showing up in singleplayer
    - but you still need it when you yourself are casting multiple at once
  - levels can be way too big
  - leaderboard
  - maybe target circle should makes the spells that come after it tick up in
    how long they have to restore
  - it is unclear which spells have what cooldowns
  - **important** AOE should have max targets just like "Connect"
  - increase radius for connect and fix faction targeting so it doesn't hit you

- 80% mana at the start of a level perk is too much

# Priority

- summoner too much health?
- bug: Card copy text overflow
- multi url was saved
  weird:`http://localhost:3000/?pieUrl=ws%3Alocalhost%3A8080&game=a`
- bug: if I start a game, quit to main menu, go back to multiplayer I can't edit
  the server url field, until I alt tab and come back
- What happens if you press multiplayer 'connect' twice while it's still
  connecting
- bug: vampire stopped moving after being pushed
  - after being pushed hard into a corner
- (fixed?) bug: server freaks out after players leave (when they're dead)
  - somehow got inconsistent maps; one client must've been holding on to an
    instance

# To be Triaged

- UI bug: toolbar is jumping around when you hover spell in toolbar
- missing decoy gif
- There should be 2-3 spots where no enemies are allowed to spawn,
  - end game maps are too crowded
- Remove "update" code in golems-menu
- bug: loaded from quicksave in multiplayer and got "CAnnot choose upgrade, from
  player is undefined"
  - This is because save doesn't yet work in multiplayer
- Potential issue when both players are alt-tabbed and server restarts, the
  chrome one got the disconnected message but the other was on the "resume" menu
  screen and when I resumed it's stuck because it has the old game data but the
  server restarted (chrome player started a new game of the same name), and so
  firefox player has old game state and also cannot ready up because they are
  already in game.
- Retro playthrough:
  - font it too small on cards
  - last will didn't work when he was near water 5:35
  - got 2 spells instead of 1
  - connect push to self is not obvious what it does, same with connect swap
  - idea for coop: classes so some wizards can specialize
  - "protection" should work for enemies casters such as poisoner and priestb
- May have prediction errors with ranged units since they don't use
  canAttackTarget in their action(). See ac2c0b1f for more. For now, we're safe
  since ranged units only ever move OR attack not both.

# Tasks

- Need something to protect like the towers in into the breach, something to
  draw you out and make you take risks
- is burst too cheap??
- Don't change music until the biome changes
- fix slow copy "maxStamina"
- Server Browser
- Make magic color and robe color separately customizable
- verify `UI zoom` restored from settings in electron app (due to 63643c06)
- Invent new loop biomes by colorizing old biome tiles for looping

# Bugs / Cleaning

- bug: Getting "host app version doesn't match client version" on SOLOMODE
- arrow spell always shoots towards the center of the unit that it's going to
  hit which can look odd visually if you are targeting multiple units and one is
  in the way and intercepts it
- UI: health bars render over player thought
- save file truncates if it contains '-'
- bug: by alt-tabbing during enemy turn they didn't move visually. Then when I
  came back and ended my turn again they slid to where they would've been had
  they moved during their turn (without animate walking) and then walked another
  turn's distance and bit me without warning
- bug: Prediction is wrong for potions dropped by last will because in non
  prediction is waits a moment before dropping them
- **important** bug: when one player went into a portal and the other had
  already ended their turn and the left over player died from ai (portal was
  spawned via admin menu), it correctly went to the next level but it generated
  2 levels (skipping right to level 3)
- pieUrl is stored wrong in browser search bar so if you copy it after
  connecting it'd double encoded
- **critical** vamp miniboss got stuck where he has stamina and a path (with no
  points), but wont move; i think it's because i summoned an archer and the
  archer was part way in liquid but didn't show it and so he didn't have a path
  to the archer
- Fix: should not broadcast latency warning for a message that failsc with a
  rejected promise
- archer still had freeze modifier listed in tooltip even after the freeze
  disappeared naturally on the next turn
  - freeze is behaving weird in Russell's playtest, it's not ticking down as it
    should
    - maybe it has to do with it being triggered off of chain? he also had bloat
      on
- **critical** miniboss vampire was able to move without playing walking
  animation during the ranged unit turn phase and then continue walking on his
  own
- **important** push + radius*2 + connect + damage isn't damaging the connected
  units (note, the pushed unit ends up in lava)
  - This is because the unit died when it fell in the lava so connect didn't
    connect it to other living units
- sync issue: golem moving through frozen guys jumped back
- "All targets" copy is confusing if player doesn't understand targeting
- (h) Sometimes it tries to path around things and wastes stamina if there isn't
  a straight line path
- (h) sometimes when you walk you get stuck on a wall and it wastes stamina
- **important** bug: saw +0 mana when he tried to mana steal from me; desync
  bug; i moved when he cast.
  - this is a race condition because I'm still able to move freely after his
    cast triggers
  - how to solve desyncs when allies move while you're casting
- Multiplayer: other players can't spawn in while another player is casing a
  spell
  - same thing with casts, it waits
- futher investigate ' // Override ref since in prediction it makes a copy of
  the unit' from 06d754d2
- Turn phase testing:
  - if one player is portaled and the remaining player dies it should go to the
    next level
  - if no players are portaled and all players die and there are no ally npcs it
    should go to game over
  - if no players are portaled and all players die and there ARE npc allies it
    should run turn phases for NPCS
    - if NPC_ALLYs succeed it should go to next level
    - if NPC_Allys do not it should go to end game

## Prediction issues

- prediction should factor in standing on pickups
  - this can be reproduced by standing on health pot and queuing up just enough
    slash spells to kill you and triggering it. You will see that it predicts
    that you will die but you don't because as soon as you first take damage the
    health pot triggers

# Optimization

- optimize: Ihave duplicate units, pickups, and doodads in save due to
  serailizeForSaving having them in the underworld and extracting them to the
  top level too

## Stretch Content

- More Upgrades
  - Modify enemies or global stats
  - Modify cards themselves, just like how cards have the optional add() and
    remove() functions, they could also have a level up function.
- hotseat multiplayer
- content: Heat seeking skull with particle effects behind it. You release it
  and it seeks out the nearest enemy to deal damage
- AI Enhancement: Solve many enemies overkilling allied unit
- Daily challenge
- Idea: way to sacrifice health or mana to your ally
- Reflect damage (reuse modified Fortify icon)
- **next** Content: Add Copy Soul vs capture soul. Capture soul should let you spawn them
  for no mana cost but they need to be below 25% health to be captured. Copy
  Soul gives you the summon card.
- Refactor Bolt to "Soul Bind"
- Magic arrow spell (travels out of range, like ghost arrow)
  - idea: trigger the spell on line segment intersection (throw the spell)
- Make "Destroy Corpse" spell which will be useful for dealing with priests
- Trap Soul / Capture: Instantly traps an enemy's soul in your possesion
  removing them from the board. When you release their soul they are restored to
  their last form but on your faction. Requires low health to work.
- Mind Control: Changes the faction of an enemy
- **contender** Content: "Orge" enemies that get stronger for every ally of
  theirs that dies
- **contender** destroy a corpse for mana
- **contender** grow a barrier
- **contender** Feature: "Soul bind" - bound units share applied effects (or
  maybe just damage)
- **contender** set fires on board that spreads that does damage on turn start
  if you're standing near
- Spell: "Target Nearby" - Like what stomp used to be
- juice: ultra badass spell should put in wide-screen black bars and take over
  the camera
  - and he could crouch and gather enegery
- unlimited range (also target yourself)
- Idea: "oh shit button": double the amount of mana you have this level but it
  reduces by half next level. " Break glass in case of emergency. Deal with the
  devil
- **Idea: Amplify spell: makes "multicast"**
- Add `cooldown` to spells rather than expense scaling
  - Add a spell that resets cooldowns
  - Add a curse that increases cooldowns
- h: "Heat seeking" enemy or spell
- idea: spell that triggers onDeath effects "Playdead"
- Liquid: blood could apply a curse when you fall in, like slowed movement
- thought: Spellmasons should have some element of risk/reward like 50% chance
  to double damage of next spell or something like that. Think of my experience
  with slice and dice where I got a dice side that did 24 damage and affected
  the guy below. If you could always have that it's no fun, too easy but because
  you can only sometimes get it when you're lucky is what makes it exciting.
  - also one-use spells could work well
- confuse spell
- what attributes of a spell could be modified by other cards?
  - already: targets, quantity
  - new: radius, amount
- perk: long range cast only
- perk: Swap your max health and max mana
- Idea: "overwatch" where some archers can shoot even not on their turn if you
  walk in their LOS
- Content: Time crystal releases something when it breaks
- An enemy that consumes allies to get stronger
- idea; one use bargains (deals with the devil) that mix up your max stats. or
  have a50% chance of good or bad outcome
- Card: An attack range minimum but not a maximum so you CAN"T attack if they
  are too close
- enemy that debuffs blessings
- **"heat seaking" missle unit, explodes on contact**
- Card: Mind Control (changes faction temporarily)
- A spell that saves 40% of your current mana for next turn (added to
  spreadsheet)
- A spell where you can save some of your health, mana, stamina in a potion
- What if monsters that go through portal come to next level with you, but you
  don't get more mana after the portal spawns
- totems
- auras
- ricotche
- task: Spell to trade mana for stamina
- eagle eye
- Tornado: Travells through the map throwing things around (maybe a good enemy
  ability)
  - Or just spells that travel in the direction you send them
- A way to "sell spells to get to choose a new one"
- Jake boss ideas:

```
Necromancer supreme. Conjura a bunch of guys to fight but is very fragile himself
Think of the spider boss from Bloodborne
A guy who wields a magical sword that can do ranged slices with it. Somewhat tankier I think. Maybe weak to electric stuff
A mimic! A copy of you. Has your spells and such
Dunno how well that'd work lol
Gotta be a dragon
Big slime? Keeps splitting into smaller slimes
Maybe the final boss could be something ambiguous? Like "The Final Spell"
And it's just ball of energy that can do weird stuff
```

- Russell Boss idea:

```
hrm, ok here's a WILD idea. how about a non-moving boss that has a number of "tentacles" or some other non-moving bits around the map that you have to take care of before you can hit the boss?
say like stationary spawning towers that spawn a dude every few turns
i feel like a good final boss will bring a new mechanic to the game
or maybe the separate tendrils give the boss different abilities each turn like self-casting heal or protection, having additional damage, having additional cast range, multi-attack, etc 
so "hey let's kill the 'heal' tendril first!" "no! we have to get rid of the summon ones before we're overrun!"
and i still like the idea of some spell cards or upgrade cards being "locked" until you achieve something in a run to unlock them
i'm thinking of mechanics from like Slay the Spire here
did you have a spell book from the main menu to show all available spells?
also not related but it would be nice to be able to click enemies during the "pick your starting spot" time for when you can't remember the difference between a poisoner and a puller or the different archers
but overall a boss with multiple "stages" or "parts" would be cool
```

- Boss:
  - maybe the boss could have multiple phases
  - Russell: A good boss introduces a new mechanic
  - Maybe casts whatever spells you cast back at you? Jakes idea

## Multiplayer Enhancements / issues

- if you choose a spawn position while another player is casting it waits and
  then spawns where you clicked, which can be confusing because it still looks
  like you can choose where to spawn
- if you can MOVE_PLAYER while a super long cast is being triggered.
  - you cannot, find a way to handle this for multiplayer so it's communicated
    that you have to wait to cast until someone else has finished casting
  - IMPORTANT: Change the store description:
    `Spellmasons uses innovative faction-based turns: You and your fellow mages can all move, cast and act simultaneously.`
    if needed
- If player joins mid enemy movement it will force reset them
  - this is still an issue: as of 2022-09-16

## Misc

- **critical** Improve sending castCards with targeting based on id not position
- Unit movement desync occurred between clients when one client has CPU
  throttled, the non throttled client has the unit move much farther

# Stretch Tasks

- Post game stats! (requested)
- Achievements
- Mods
- Make pickups do something when destroyed
  - Refactor arrow.ts to use getPotentialTargets instead of just
    underworld.units and unitsPrediction or else it will never strike pickups
- Server config by host (pvp, worms armageddon style customizations)
- Pushing units into portal should do something
- Protection should be able to be cast on dead units to keep priest from
  resurrecting them
- [Mod support](https://partner.steamgames.com/doc/features/workshop)
- Server customization (like Worms Armageddon)
  - Turn time
  - Pvp mode (more factions)
- Perks | "upgrades" with some random attributes | The more dimentions you add
  the better!
  - % chance to get more stamina on level start
  - % chance to start level with mob on your faction
  - % chance that casting wont consume mana
  - % chance to freeze on damage
  - one time: 50/50 chance to incrase max stat or decrease it
  - make 1 random spell permanently more expensive and another permanently
    cheaper
  - Skill tree
  - Critical chances
  - Time challenges - beat the level in less than 3 turns
  - Make wagers - risk / reward
    - even with the difficulty of the next level
  - pseudo class system
  - item that makes your stronger but it randomizes your spawn
