 AlbrechtWM [has Spellmasons] 20 hours ago
    
A few balance feedback items
Spells generally seem well costed for what they do.

However the following 3 from what ive seen could use some attention.

1) Poison at 20 mana seems rather steep for a 10 point DoT considering the other options on the table. I would either lower the mana cost to 15 or 10, or increase the damage.

2) Contaminate seems very steep at 50 mana for spreading debuffs, considering the wealth of 20 point targetting spells. I would consider lowering it's cost

3) Targetting Column. Its to narrow and short at 20 mana compared to Cone, Connect, Circle, and other targetting spells at the same mana cost. Either reduce its cost to 15 or increase it's width and/or preferably length (cone is both wider and longer than column for example)

That's it. Noticed some UI/refresh bugs I might also report if they haven't been brought up yet.

Having a lot of fun so far! 
---
A couple observations from my broken run earlier depicted in General:

1) The spell that sacrifices your health to steal mana from enemies has no limit to the amount of mana it can take from enemies, and will take more mana than the enemy has to give if stacked. I was able to achieve over 15k mana by sacrificing all my health with an AoE spam of this spell. Suggestion : this spell needs to be limited to the amount of mana an enemy has to offer.

2) A lengthy spell will continue to cast even after the targeted enemies are dead. It will continue to link to dead enemies that were killed during that same spell resulting in lengthy animation of connections to once alive (now dead) enemies. The same spell continued to cast when entering the next floor, and because I cast blood curse and a ton of heals on all of us, killed my teammates when the spell finally culminated even though we had moved onto the next floor. Suggestion : If a spell contains offensive (or defensive) components, have that spell end if all targets that will be hurt / helped have already died. ( no reason to continue to connect to a mass pile of bodies, or cast fortify on a dead teammate).  Also, have any and all spell effects in progress end when moving to the next floor.

3) When casting an ungodly amount of arrows, the arrows take a very, very long time to shoot. (the developer has already commented on speeding this up) and will continue to shoot after all enemies have died. (this loops back into the last point)
J'in — Today at 5:26 AM
4) When splitting your teammates, they have no control over the split versions of themselves. Not sure if this is intended as the stage ended before we could test this further so I'm not sure if they have auto AI controlling them or what that situation is. Either way I am fine with this as it is funny to me. However, when moving to the next floor, that teammate was still split and still had reduced stats, but none of his little off shoots came with us. This is a pretty big issue for progression. Suggestion : either have split units merge back together on progression to next floor, or have split units come along and spawn with the player when they choose their location.
5) When queueing an absolutely massive amount of spells, it still displays every icon on everyone's screen leading to some pretty blocked views of the map. Suggestion : Have the spell box be limited to a certain amount of icons that each player can then click on ( like an interactable corner) that then expands to the full view and can be collapsed again.

---
VDmitry on Steam
https://steamcommunity.com/app/1618380/discussions/0/3766733548876188181/
 Passed level 22 - what's next? (and some feedback)
I'm now curious if it makes any sense to continue. Is the game ever designed for such experience? I have 20k health in particular and can summon armies so large that my PC is dying while animating them.


Also some feedback so far:

- I've already mentioned that me and AI can summon very big armies and my PC barely can handle that, we probably need an option to disable animations if nothing really limits army size

- similarly I once used Circle + 8 x Arrow (or similiar) and animation took several minutes for this spell (faster if ALT-TAB out of the game, but still too long)

- need to have more than 1 row for spells, it's not friendly to swap spells from the book, unless it's somehow linked to game mechanics

- it's hard to notice scroll appearance - it may be even out of sight or hidden by units, what's about a message or something?

- Fortify 0.1% - this is the only spell so far I don't get. I need to cast it 100 times to block 10% of damage? It's not funny.

- what's about reordering spells in the casting row? like with drag&drop

- Saves... It's good there are saves, but some usability still needed. Stop... Isn't it roguelike? Why DO we have saves? What's about auto-save? Problem solved.

- screen scrolling speed may be needs to be configurable (I'm not using middle button)


- there should be balance issues too, but since I don't even know what to expect... For examplewhen I have 20k health Shield +30 is useless. Hordes of archers summoned by enemy are useless too. Well, they give me lot of potions of course... 
---
Chris:
"balance: Remove Nullify spell because it was way too powerful in the endgame (I may rethink a way to reintegrate it later)"

I've got a couple worked out thoughts on fixing its balance. Hopefully you like one of them! I believe each of these solutions addresses the problem with the previous version of Nullify but in a different way.

A) Nullify no longer works on the caster, but functions identically to before with regards to enemies and other allies

B) Nullify is split into 2 component spellcards: 
Steadfast - a spell that works like Nullify but only with regards to movement/displacement effects like Pull, Push, Displace, Repel, Vortex. 
Nullify (Stackable) - a spell that only nullifies the next forged damaging component in the same spell it is in. It has to be inside the spell combo to nullify an effect and it only nullifies 1 forged effect (ignoring Targeting components of course). Nullify will only protect against 1 single component in Stacked damages like Rend. 
So if there were Nullify - Nullify - Target:Circle - Rend - Rend - Rend, The caster would take damage from Rend as if they were only hit by a single Rend. Enemies would take damage from 3 Rends.

C) Nullify works as before, but cannot protect the caster against damage that would (if not protected) be at or above their max HP. 
I.E Nullify will protect against a single spell's damage to a caster with 60HP if and only if the damage is 59HP or less. If it is 60HP or more, Nullify fails entirely.
---
Sander. — Today at 4:59 PM
Make Dark Summoners a bit less influential, I got to a stage where I had 3 dark summoners (2 of them minibosses) each in a corner of the map, 
I just spawned in 1 corner and then I was never able to reach the other 2 because I didn't have the correct spells (it was only stage 11) 
---
J'in
I think a possible solution for the summoner issue would be to have them summon X creature but with no mana so they have to build up their mana and cant immediately summon more enemies. It would at least buy the player some time to take care of the crowds before more are spawned in

---
Bardcore
When performing an elaborate mana steal chain, it will only let me cast spells up to my pre-mana steal amount, not respecting the mana I've gained during the spell chain from mana steal
which is obviously frustrating, because even with all my extra mana, I cannot recreate this targeting chain to now use my stolen mana
---
Blacklotis — Today at 1:58 PM
I have enjoyed the core game loop thus far.  The following suggestions are not in any particular order and all revolve around my experience playing the game solo.

1.  There is no way to tell in game how well I'm doing (or not).  A breakdown of runs, and the spells chosen that run would do a LOT towards enabling better spell decisions.  A leaderboard could solve this problem nicely if you could select that run and see a breakdown of how it went (Damage per level, number of times each spell was used, number of times each spell chain was used, etc etc.)  To be more complete, a sortable database of all runs.

2.  Enemy movement is about as simple as it can possibly be (and quite boring after about an hour of play).  Enemies know your position at all times and run blindly towards it.  Archers specifically suffer from this as they run towards you.....but then just stand still.  There have been a number of situations where I was able to recover over the course of 4-5 turns in a corner when all but the archers were dead.  This mechanic just feels bad.  More intelligent pathing would radically improve the experience.  A damage balancing pass might be required with this change.

3.  The level design is okay but could be significantly improved.  Adding doors and a sound based aggro system could significantly expand the potential for more complex fights.  Spells like suffocate could have an extra ability that silences the enemy until it dies, preventing them from crying out.

4.  Lava doesn't kill enemies.....wtf?

5.  More items!  Would be interesting to push a barrel of some flammable liquid towards a group and make it go boom, setting things on fire as they ran away 🙂  If you have ever played the Divinity games you can imagine how clever environment based mechanics can get. 
---
- mana steal should be able to extend usable mana mid-chain
---
Chris:
Split priests, summoners, and dark summoners should summon weaker units if they are split (currently they are unable to act at all if split)
---
Cocopuffminer3 — Today at 1:03 PM
Maybe for the later feature updates, you can add a run customizer, room sizes, enemy difficulty, stat modifiers, enemy count, etc

These things could be added as a menu after you press play to give a bit more customization
---
Omni — Today at 5:39 PM
-As I think mentioned before Split hard counters priests and dark summoners too well.

-Using Target Kind/Similar + Connect in alternating fashion is :chefkiss: for targeting the entire map regardless of enemy location. 

-1 use of Vortex tries its best to pull every target to the center point, this in tandem with room wide targeting creates very powerful impact forces to targets on the other side of walls (essentially for 1 single vortex it simulates powers equivalent to multiple push/pull). I love it, but maybe its working too well. 

-Swap is easily the most broken grouping tool when used with multi targeting combos. Its the superior and more consistent version of vortex in my opinion. I love it.

-Potions in general feel very lackluster. They can come in clutch in some early gameplay or for people learning the game for the first time, but by stage 10+ I feel they are nearly negligible. This might feel better in multiplayer, but for solo I didn't find them very necessary. Could be cooler design if potions were on a timer like scrolls, but added a very small amount of permanent mana/health/stamina (maybe 1-2%). Would give more agency to them at all stages of play, though potions generated through Living Will would likely need to not do this or be changed to prevent abuse.

-Not sure if this is intended, but once you obtain every spell it appears you no longer gain talent upgrades at the beginning of each stage.

-Sometimes when doing room wide calculations involving multiple movements (such as grouping multiple enemies with bloat and detonating them), the pre-calculations can sometimes be wrong. My assumption is the calculation doesn't always factor in travel time for some of the pulls/vortex, resulting in some enemies that would have died actually surviving because the detonation went off before the mob was pulled in range during its travel. Not a big deal honestly, just food for thought when dealing with multi-target bloat explosions.
 
-Mana scaling per stage in general feels almost a little too powerful for talents. While chance based talents feel too unreliable. A cool Idea could be to add cards that give/add weights to various spell schools. Such as maybe "Movement Specialization" gives you a selection of 3 movement spell only. Or maybe some cards interact with spells/combos, such as a talent that gives a little bit of health/stamina/mana back on cast, with higher values based on how long of a combo cast you did. This could yield some nice interactions where you could move, cast, move, cast. Or even maybe a talent like "Deal an additional 10 damage to all targets of a combo for every 30 mana spent in the combo".  Sorry kinda popping off with ideas.

-Multiple stacks of Debilitate are multiplicative. 1 stack is double damage, 2 stack is Quadra damage, 3 stack is Octa damage. Not sure if its intended, but extremely powerful. 
---
Omni — Today at 12:24 AM
Could maybe adjust it so that the targets under blood curse also take damage equal to ~20% x stacks of their maxhp per turn or something to prevent abuse. So after ~5x stacks its an auto kill from full hp. Though one could argue this starts to compete with how Suffocate is designed to play out.
Jordan - Spellmasons Developer — Today at 11:52 AM
Well there aren't any enemies that heal at the moment, so wouldn't that still just make you practically invincible so long as you don't accidentally heal yourself?
Omni — Today at 3:01 PM
If it does % MaxHP per turn as damage, it puts an effective timer on your life. Yes, you may be near invincible while you have multiple stacks, but without being able to heal and losing % max hp per turn, you will eventually die. 

That's why I think it competes with Suffocate a little bit, which I personally think may need to be balanced more. Its not particularly easy to stall X amount of turns, or rather I think there is a lack of stall supporting spells if that was the intent behind suffocate. Freeze/Slow/Shield/Heal/Fortification/Decoy are the main ones that come to mind. I think most of these are ok, just in later 10+ stages even when I do multiple stacks of suffocate a lot still say like "13 turns" which sounds super obnoxious to try and stall for that many turns. I think adding additional ways to accelerate these would be cool; maybe a unique combo with Drown that further reduces suffocate stacks, or enemies that receive liquid damage further reduce stack counts.
---
Lancelot — Today at 12:16 AM
Mana steal should be a percentage of life cost, we just went in a game and we were like at 160000hp and nothing did resist us.
---
Sparkle — 02/05/2023 9:30 PM
I think I need to rethink the suggestion
So, maybe instead of having different entries for +2% mana capacity +2% cast range and +8% health, it'd look cleaner and easier to gauge what's needed if it looked like:

Perks
Current
+208% health capacity
+96% mana capacity
+80% cast range
(not actual numbers, just an example of what the current bonuses applied to that current level. These numbers equal the flat %increase + the perpetual %increase per level)

Every Level
+32% health capacity
+8% mana capacity
+10% cast range

Every turn
20% chance +20% health
30% chance +20% mana
30% chance +20% mana 
(assuming those 30% chances are rolled separately)
---
Omni — Yesterday at 4:49 PM
I realize now though that bloodcurse stacking could be broken in tandem with purify since it can remove all your curses. Since you could just purify on the turn it "would" kill you otherwise and still feel nearly immortal by using/cleansing bloodcurse in a skillful way
Omni — Yesterday at 10:05 PM
-Another potential idea you could do with blood curse is have stacks increase the afflicted persons damage, but still make healing hurt them; as well as make them take increasing amounts of damage per turn (similar to poison). Almost like a bloodlust/berserk where it forces them to kill fast or die trying. So if a vampire tags you, you are put on a timer to kill the rest of the room faster. 

-Another idea that I thought of thinking about interactions with stacks could be a spell that increases/doubles/reduces the curses on a target. Essentially the opposite of purify. Could be a great way to interact and affect Poison/Freeze/Bloat/Debilitate/Split/Bloodcurse/Suffocate

Also sorry for all the ideas, either way the game is a ton of fun and I hope you take care of yourself with all the development and work you put into this! 
---
AnGeK — Today at 1:32 PM
Hey it's just my opinion, and ofc I imagine you're busy bug fixing. But if you got time for content i think. Your main goal should be a End boss for making it a real rogue like. And you could make difficulty level, and as reward we would get a customisation item for our mages our even finishing a whole run would unlock for our account a new spell card. I think that would be a cool way to add spells. And better reward linked to the difficulty.
I'm just giving you ideas, so you get useful feedback 🙂
And I know it's important for you the bug fixing but remember everyone's playing the game still if there's glitches because we can create fun time content in multiplayer, so i think it's important to add content maybe even more than little bug fixing to keep the fan base alive.
---
phrieksho — Today at 10:14 AM
Gives me an idea: a rare drop of a revive potion. If a player can maneuver it to a dead ally, they come back at half health or something. Just a thought