# Critical Path
## Priority
- Fix summon cards disappearing
- Fix dash movement desync
  - it seems to only move to the first on server
- Fix other strategy balance:
  - Balance Summons cost
- Fix: "Failed to save" when there are too many saves"
- 
- WhiteScythe — Today at 7:26 PM
Been encountering an issue in multiplayer, seashell or walrus, where if the primary player is AFK for more than a minute it kicks the other player back out and makes a backup.
- Just remove lobby ready entirely so that it's impossible to  be trapped in lobby
- Delay card pick until start of turn so it doesn't ruin spells
    - Change end turn btn to a level up button
- FIND DESYNCS that occur when you encounter Deathmason in singleplayer

---

- fix: Getting spells extra on multiplayer game restart after lose
    - Cannot reproduce
- idea: to fix pickup lag in multiplayer, maybe just put a delay on them? or in the message it should say who's going to pick it up so await with a timeout for them to collide?
- fix logged issues
    - Player managed to choose an upgrade without being supposed to
        - Fix summoner capture soul spell not coming back after load?
- Ghnoyeurghe — Today at 12:04 PM
    Actually my friends and I had a near identical issue last night, level 12 we had a crash and the two of them when I loaded the save were only able to spawn in as level 1 wizards
- Gumby — Today at 3:05 PM
It doesn't seem to be related to the spells cast, it seems to be more relating to the number of enemies on the screen (the later matches have more enemies). On my PC i click end turn and the end turn button greys out, on my friend's PC he clicks end turn and the end turn button greys out for him, but the AI just doesn't start their turn....... oh and on my screen it looks like my friend hasnt ended their turn, and on my friend's pc it looks like i haven't ended my turn, there is some sync issue with the end turn fucntionality in multiplayer. myabe just start a 60 second timer once any of the players have hit their end turn button or even a last resort 10 minute timer per turn. At least that way there'd be some way of saving the matches when this happens. Or add an auto-save function at the end of every turn, so should this happen we can just quit out, load the last auto-save and come back in again. 
- Write Callum back

---
- Follow up with Bebo about art
- zezeus — Yesterday at 8:38 PM
Hello, 

Sorry I attempted to record my bug but my recording software leaves up the spellbook for the entirety of the recording
anyways, more accurately after testing a couple times. Deathmasons just cause major "lag" actions can take multiple minutes to resolve, this is without pressing end turn. This happens every time deathmasons are in my game. Funny enough pressing ESC or alt-tabbing causes the actions to resolve quickly.
so desync was not the correct term for my single-player issue

## 1.24
- Zed: essentially what i'm saying is scaling the health of enemies doesn't really solve the issue, providing enemies/arenas that have unique mechanics or resistances will.

for example: an enemy that has a tough outer shell. Direct damage is reduced, but blunt force damage is a crit (i.e. pushing into a wall) and perhaps this enemy is slow, and is thus more susceptible to drowning
- "onData queue stuck on message" - improve logs
- Soul Muncher
    - Timemason: More max mana but it drains over time (rewards you to act quickly)
    - Fix: Connect targets Urns

- Ensure if one game infinite loops that it doesn't crash the other games on the
  server
  - Add better logs to the server infinite loop warning
- Ensure end turn fires even if player is already marked as ended turn so it
  doesn't get stuck
- Turn off background throttling
  - Ensure it receives messages even when alt tabbed
- Keep stats on all server disconnect issues
- Puparas offering help with Russian translation
- Feature: Skillo — Today at 11:32 AM very promissing [11:33 AM] instead of
  trivializing mana (by getting more avenues for casts, since the game is all
  about doing sick spell chains), integrate mana scaling naturally during your
  run and then the other stuff as your actual choices [11:35 AM] speaking of
  which, one way of making stamina scaling more interesting is by adding a class
  that scales with it. "damaging spells deal extra damage based on how much you
  moved in this turn" something like building momentum

Skillo — Today at 11:41 AM exactly! Imagine doing target arrow + dash + slash
and doing massive damage cause you crossed the map with it

- fix: UI: Decoy health isn't listed in card like other summons

- Enemy whose damage ramps over time (ancient) Scojbo
- Vinnick Talberot:

  I also wanted to say that with the introduction of the urns, in several runs
  I've had I have had very few mobs to fight in contrast to the urns, and so
  when I kill them all I don't make much progress to new cards. So I've gone two
  maps at a time in some cases with nothing new, which then gets met with this
  mass of monsters on the following map and I can't do anything because I
  haven't increased my pool of options. @Jordan - Spellmasons Creator

Rainbowluck:

    Also boss summon ? cost like twice the cost and there is not stat boost or anything ?

RainbowLuck — Yesterday at 4:45 PM when u capture soul to set up a game and u
got kick out and you come back with no soul is realy frustrating '-'

    timothycombs12 — Yesterday at 8:40 PM
    found a glitch. target arrow + slash + capture soul targeting an ancient. it will refund the spell and not take hp from the player, but it will not give a spawnable ancient. i dont know if the last part is on purpose

Ian / Chase / Pompa — Yesterday at 9:32 PM Is it a bug if my lovely golem is
dealing .00000000000001 more damage than expected or just amusing? :3

Summon feedback
https://discord.com/channels/1032294536640200766/1069630737919266936/1177596327392186419

- Skillo — Today at 9:29 AM Forgot to mention here that for some reason teleport
  portals aren't visible for me :p Sometimes i'll just wander around and be
  randomly teleported somewhere else Singleplayer
- server crash: RainbowLuck — Today at 7:25 AM after i did a AOE circle 3
  clone/regeneration in the screen you see above , after that nothing work
  anymore and the server crash
- Knaughts — Today at 12:07 AM This guy will not attack, because the poison will
  kill him first. The lack of this means I have to do a bunch of math when
  casting a big spell that includes any poison, which makes poison a much bigger
  hassle.
- RainbowLuck — Today at 7:19 AM the thing is , toxic is underpower or explosive
  is too strong

- fix pickup created with duplicate id

---

- Outreach: try a non gmail email address
  - Look into line tracking
  - Try instagram
  - Look into indieboost?
  - NorthernLion outreach recommendations
    - Include the game key
      - don't do "interest checks" just send the key
    - Be brief
    - Explain your game's value
      - why is it entertaining to watch
- Check bug reports in discord for missed messages

- Admin commands don't go to multiplayer anymore
- Gumby — Today at 3:05 PM It doesn't seem to be related to the spells cast, it
  seems to be more relating to the number of enemies on the screen (the later
  matches have more enemies). On my PC i click end turn and the end turn button
  greys out, on my friend's PC he clicks end turn and the end turn button greys
  out for him, but the AI just doesn't start their turn....... oh and on my
  screen it looks like my friend hasnt ended their turn, and on my friend's pc
  it looks like i haven't ended my turn, there is some sync issue with the end
  turn fucntionality in multiplayer. myabe just start a 60 second timer once any
  of the players have hit their end turn button or even a last resort 10 minute
  timer per turn. At least that way there'd be some way of saving the matches
  when this happens. Or add an auto-save function at the end of every turn, so
  should this happen we can just quit out, load the last auto-save and come back
  in again.

---

- v1.24
---

- Salazar — Yesterday at 7:51 PM I have seen someone mention corpses beginning
  to lag the game and i would also like a restriction on corpses...Or anything
  to restrain the impact on performance...Bc it might have been so bad it closed
  down the server i hosted and this time fucked the savefile with my friend
  being suddenly back to lvl 1 and all new spells...I tried to solve it by
  loading a prior save but he just keeps respawning at level 1 with none of his
  prior spells and him being able to choose a spawning point in the middle of
  the death mason level...With the added bonus of me being dead this time for
  some reason. Its kinda a bug report so it goes here ig. Ghnoyeurghe — Today at
  12:04 PM Actually my friends and I had a near identical issue last night,
  level 12 we had a crash and the two of them when I loaded the save were only
  able to spawn in as level 1 wizards

---

- Optimize late game lag
  - Find the bottleneck, use web workers?
    - Circlex3 + bloat + slash
      - I could cache the onDeaths to all happen at the same time to optimize
        the takeDamage>die>onDeath>explode hello
    - cone chain similar chair similar manasteal clone*5
    - Circlex3 + vortex
      - fullySimulateForceMovePredictions takes a while
  - https://github.com/GoogleChromeLabs/comlink
  - archer hasLineOfSight needs perf improvement on runpredictions
  - fullySimulateForceMovePredictions takes a while
    - but maybe I'm also calling runPredictions too often on mouse move with
      spell
  - Archy — Today at 4:13 PM

```
I mean I encountered issues with performance while I was playing with summons, resurrect and clone spells. Combining them with cone or circle and increasing body count lags the game. Cause when when you clone your friendlies you accidentally clone dead bodies around them and it becomes worse when you trying to add more "cannon fodder" to it. 

Another issue is when you try to preview long spell chain attack with bloat or other explosive spell and when the preview tries to show result of the attack it also lags significantly.

P.S.  I have Ryzen 7 3700 and rtx4070, but as I see it's cpu intensive. Because my friend with weaker cpu starts lagging in mp much earlier.
```

- Features for 1.21
  - UX bug: When an Ice urn ends the player turn the ice doesn't stay on them so
    it's not obvious how they got their turn ended
  - enigmaticbacon — Today at 2:56 PM On community servers in multi-player, if
    I've died, and my partner gets a kill that levels us up, I'll get a spell
    select screen that doesn't allow me to reroll and when I make a choice, it
    won't be added to my spellbook. Then, when we reach the next level, I'll get
    the same spell choices again and this time it works. It's disorienting
  - Still encountering desyncs
  - Kess — Today at 10:59 AM I can also confirm that on community servers, a
    couple times in the middle of the player turn monsters that were just killed
    would revive at full health, without any revive spells and just popped back
    to life 😅. The instance I remember best was one person casted a spell that
    killed a golem and a miniboss golem, then walked as far as they could, then
    clicked the end turn button (though the other two of us were still planning
    things so turn wasn't over), and -pop- the miniboss and golem were back at
    full health. Also freezing the newly reborn enemies did not show the frozen
    vfx but did list it in their status effects

---

- FIND OUT HOW TO ENABLE STEAM REMOTE PLAY BEFORE EVENT (FEB 12)
  - https://steamcommunity.com/app/1618380/discussions/0/3872591600381876700/
- timemason needs a change waiting for timemason's ability to work, especially
  as the game goes on, is a huge time-sink and gets very boring. I get that part
  of it is a time-crunch challage, but is there any way we could make it so you
  can volunteer to speed it up or something?

- Forest Dweller Yamu [has Spellmasons] Oct 19 @ 2:51am

Reconnecting in Multiplayer is Super Broken I've played multiple matches online
with friends where trying to reconnect with everyone either A: Doen't work and
makes us restart from the beginning by just killing all players or B: Some
players just start picking levels again and have no progress up to that floor
anymore.

I really like this game and its fun with buddies, but having the match just
break everytime on floor 7-9 just ruins it.

- Mattmellow — Today at 1:38 PM bestiary of all encountered enemies to access in
  game, and all spells (credit enigmaticbaco)


- enigmaticbacon — Yesterday at 7:40 PM When loading a game in which you have a
  mini-boss on your team, its stats are reverted to the non-miniboss version,
  which can lead to awkward fractional HP. Example: I have a miniboss mana
  vampire on my team with 10/720 HP, save the game, then load the game, it will
  still be called a miniboss mana vampire, and have the same size, but it'll
  have 3.33333333/240HP
- Add Clutter (Pandize from discord)
- https://steamcommunity.com/app/1618380/discussions/0/6993585599485171773/
- STEAM: flowkrad [has Spellmasons] Sep 20 @ 6:27am had the same bug happen.
  playing solo a resurrected a few of those guys that reduce max mana on hit and
  they hit a few times (did not reduce max mana to zero)

- v1.20
  - Fix bloodmason:
    - Some mana spells cost nothing and therefore are OP like manasteal
    - Check fortify mixed with bloodmason
      - Or ally heals
    - Bug: Manasteal is free when you're bloodmason
    - Daddy.Gar — Today at 2:19 AM
    - Bloodmason + Bloodcurse is WAY TO POWERFUL
  - UI scaling issues:
    - XzeroAir UI scaling of 1.1 makes class mage type cards get clipped on the
      bottom Uh you can infintely use the clone spell as a blood mason to the
      point i think i may have crashed the east coast community server...
  - See flowkrad's feedback about necromancer
    https://discord.com/channels/1032294536640200766/1154122344948846653/1154122348631441459
  - Game stuck after all 3 players portaling:
    https://www.twitch.tv/videos/1928091427 01:26:43
  - Use bun for websocketpie
  - Entropy Weaveress — Today at 3:40 PM I did not look at the second number.
    But by upgrading just my hp I got to unfair hp numbers and could clear every
    level almost in one turn.
  - Bloodmason is still too powerful just by casting alone
  - Stat upgrades don't show after looping
  - Phrieksho: Vengance + Timemason is bugged out
  - Expresso Depresso — 09/15/2023 9:42 PM so I uh didnt die in my mp game when
    a blood golem mini boss hit me I took a tiny bit of damage but I shouldve
    been hit with 80 damage and I only had 42 health the golem had 3 bloat on
    him As far as im aware this game doesnt have feel no pain dice rolls right?
    lol
  - Expresso Depresso — 09/15/2023 11:47 PM sorry for breaking your game so
    much. However when I dashed through a red portal from a Deathmason it said I
    died on my end instead of taking 30 damage, so efectivley my turn was
    skipped. When the turn ended I was attacked by the Deathmason and died
    again. My friend I was playing with said that I was very much alive on his
    end until the Deathmason obliterated me. again these were all bugs
    discovered in multiplayer so I dont know if that has anything to do with it
    a few bugs have been bothering me in the new update. 1 when a creature dies,
    its hitbox stays there for a moment, getting in the way of arrow spells. I
    dont know if thats a bug, but the pre-turn analysis does not take it into
    account. 2 When you kill the deathmason, its copies have the first turn. I'm
    not completely sure this is a bug, but because it also kills all creatures
    on the map, including summons, you cant even have any bodies protecting you
    from instant death, so if it is on purpose, I dont think its the best way to
    have the boss. 3 When quicksaving, it seems that you get extra stat level
    ups. I don't actually know how it happens but I think it happens both when
    you complete a level and when you spawn into the next. I also got 6 stat
    points instead of three onve and I dont know why. 4 when combining target
    arrow with target circle, if the arrow misses, it will still cast target
    circle where you clicked and refund you the mana it took to cast target
    arrow, basically giving you infinite cast range I don't have any screenshots
    but I figured these arent that hard to test so i guess ill take some if you
    want i couldnt replicate the six stat points

- v1.20
  - Upgrade server to Bun
  - Is there a way to make existing spells synergize more??
    - Special Class-specific upgrades such as "make arrow cheaper" for archer
      (rather than current perks)
    - Increase base damage
- Renewed Marketing Efforts
  - Post in Wholesomeverse
  - Bug Bounty?
  - Blender environment tracking to show a scene from the game in real life
- Auras
- PickaPecka spell idea: Targets units that you pass through when moving (would
  work well with movement spells)

# Chosen Tasks

- Desync reporter - report health, position changes and use server hub as
  backend
- Fix pickup desync in multiplayer
- Scobjo: balance mana steal
  - https://discord.com/channels/1032294536640200766/1032294537235812404/1132360848824877189
- Look into "Level Variety" recommendations in Discord
- bug: enemies will die before touching a pickup on multiplayer because on the
  server they die/move all the way immediately and on the client they don't

# Smaller Important Tasks

- Add UI for mageType
  - Test something weird happened with the poisoner where an archer was poisoned
    but wasn't going to die and the glop ignored it and attacked me even tho the
    ally archer was closer
- i18n: Add translation for touchpad move character
- Validation 7/21
  - fix: Choosing necromancer class always makes next spell fizzle because now
    you have too many
    - This should be fixed if you choose the necromancer class before you
      start - to be validated

# Ideas

- D...: Level variety
  https://discord.com/channels/1032294536640200766/1132253029698117672/1132253032332140695
- Idea: Totem enemies that give off auras
- Idea: Risk/reward rolling mechanic that shows the roll ("give up 5 health for
  potentially 20 mana")
- Idea: Spell to temporarily increase cast range for this level (or a cast range
  aura)
- Ideas:
  - necromancer abilities (buffing non-player units)
  - spell: Teleport arrow
  - items that increase changes of obtaining certain spells
  - Spell idea: Target for next spell that is cast (includes allies)
- Spells should use your core attributes so if you change your attributes they
  impact your spells. Like damage spells always use your base damage and
  multiply it.
- Able to change your hero’s attributes at a cost (Risk it)
- Spellmasons marketing: put sprites in real life with blender environment
  tracking New trailer
- Reach out to instagram influencers
- All this after better end game and auras
- A shopkeeer where you can pay with your attributes for things
- Feature idea: what if you can build your own "classes" that increase chances
  of finding things and have special buffs so you can develop unique playstyles?
  - Or what if you could "tap in" another wizard for a hard situation?
