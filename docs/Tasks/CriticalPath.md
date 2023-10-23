# Critical Path
- Bun.sh refactor
    - had a spell chosen and then disappear on level 3
    - no skill choice presented on level up to level 4, maybe it's because they already had too many spells from previous bug
    - got ` Creating a pickup with duplicate id`, just ran over a pickup, it triggered but came back
- FIND OUT HOW TO ENABLE STEAM REMOTE PLAY BEFORE EVENT
    - https://steamcommunity.com/app/1618380/discussions/0/3872591600381876700/
-  timemason needs a change
waiting for timemason's ability to work, especially as the game goes on, is a huge time-sink and gets very boring. I get that part of it is a time-crunch challage, but is there any way we could make it so you can volunteer to speed it up or something?

otherwise love the challenge. 
-  Forest Dweller Yamu [has Spellmasons] Oct 19 @ 2:51am
    
Reconnecting in Multiplayer is Super Broken
I've played multiple matches online with friends where trying to reconnect with everyone either A: Doen't work and makes us restart from the beginning by just killing all players or B: Some players just start picking levels again and have no progress up to that floor anymore.

I really like this game and its fun with buddies, but having the match just break everytime on floor 7-9 just ruins it. 
- Add tools to requesting order of server's last few messages for testing desync on prod
- Experimentally enable Bun server
- Optimize late game lag
    - Find the bottleneck, use web workers?
        - Circlex3 + bloat + slash
            - I could cache the onDeaths to all happen at the same time to optimize the takeDamage>die>onDeath>explode hello
        - cone chain similar chair similar manasteal clone*5
        - Circlex3 + vortex
            - fullySimulateForceMovePredictions takes a while
    - https://github.com/GoogleChromeLabs/comlink
    - Archy — Today at 4:13 PM
```
I mean I encountered issues with performance while I was playing with summons, resurrect and clone spells. Combining them with cone or circle and increasing body count lags the game. Cause when when you clone your friendlies you accidentally clone dead bodies around them and it becomes worse when you trying to add more "cannon fodder" to it. 

Another issue is when you try to preview long spell chain attack with bloat or other explosive spell and when the preview tries to show result of the attack it also lags significantly.

P.S.  I have Ryzen 7 3700 and rtx4070, but as I see it's cpu intensive. Because my friend with weaker cpu starts lagging in mp much earlier. 
```
- Features for 1.21
    - UX bug: When an Ice urn ends the player turn the ice doesn't stay on them so it's not obvious how they got their turn ended
    - enigmaticbacon — Today at 2:56 PM
    On community servers in multi-player, if I've died, and my partner gets a kill that levels us up, I'll get a spell select screen that doesn't allow me to reroll and when I make a choice, it won't be added to my spellbook. Then, when we reach the next level, I'll get the same spell choices again and this time it works. It's disorienting
    - i18n: 'Error: You may only save during your turn.';
    - Still encountering desyncs
    - Kess — Today at 10:59 AM
I can also confirm that on community servers, a couple times in the middle of the player turn monsters that were just killed would revive at full health, without any revive spells and just popped back to life 😅. The instance I remember best was one person casted a spell that killed a golem and a miniboss golem, then walked as far as they could, then clicked the end turn button (though the other two of us were still planning things so turn wasn't over), and -pop- the miniboss and golem were back at full health. Also freezing the newly reborn enemies did not show the frozen vfx but did list it in their status effects

- New wanted features
    - Skillo: Towers
    - Auras
    - enigmaticbacon: Paperweight, heavyweight
        - Add mass to units
            - Some units automatically have more mass than others like bosses
    - fog of war (on branch fogOfWar)

- Mattmellow — Today at 1:38 PM
bestiary of all encountered enemies to access in game, 
and all spells (credit enigmaticbaco)

- idea: (Pandize?) Spell upgrades

- enigmaticbacon — Yesterday at 7:40 PM
When loading a game in which you have a mini-boss on your team, its stats are reverted to the non-miniboss version, which can lead to awkward fractional HP. 
Example: I have a miniboss mana vampire on my team with 10/720 HP, save the game, then load the game, it will still be called a miniboss mana vampire, and have the same size, but it'll have 3.33333333/240HP
- Add Clutter (Pandize from discord)
- https://steamcommunity.com/app/1618380/discussions/0/6993585599485171773/
- STEAM: flowkrad [has Spellmasons] Sep 20 @ 6:27am 
had the same bug happen. playing solo a resurrected a few of those guys that reduce max mana on hit and they hit a few times (did not reduce max mana to zero) 

- v1.20
    - Fix bloodmason:
        - Some mana spells cost nothing and therefore are OP like manasteal
        - Check fortify mixed with bloodmason
            - Or ally heals
        - Bug: Manasteal is free when you're bloodmason
        - Daddy.Gar — Today at 2:19 AM
        - Bloodmason + Bloodcurse is WAY TO POWERFUL
    - UI scaling issues:
        - XzeroAir UI scaling of 1.1 makes class mage type cards get clipped on the bottom
            Uh you can infintely use the clone spell as a blood mason to the point i think i may have crashed the east coast community server...
    - See flowkrad's feedback about necromancer https://discord.com/channels/1032294536640200766/1154122344948846653/1154122348631441459
    - Game stuck after all 3 players portaling: https://www.twitch.tv/videos/1928091427 01:26:43
    - Use bun for websocketpie
    - Entropy Weaveress — Today at 3:40 PM
I did not look at the second number.
But by upgrading just my hp I got to unfair hp numbers and could clear every level almost in one turn.
    - Bloodmason is still too powerful just by casting alone
    - Stat upgrades don't show after looping
    - Phrieksho: Vengance + Timemason is bugged out
    - Expresso Depresso — 09/15/2023 9:42 PM
so I uh didnt die in my mp game when a blood golem mini boss hit me I took a tiny bit of damage but I shouldve been hit with 80 damage and I only had 42 health
the golem had 3 bloat on him
As far as im aware this game doesnt have feel no pain dice rolls right? lol
    - Expresso Depresso — 09/15/2023 11:47 PM
sorry for breaking your game so much. However when I dashed through a red portal from a Deathmason it said I died on my end instead of taking 30 damage, so efectivley my turn was skipped. When the turn ended I was attacked by the Deathmason and died again. My friend I was playing with said that I was very much alive on his end until the Deathmason obliterated me. 
again these were all bugs discovered in multiplayer so I dont know if that has anything to do with it
a few bugs have been bothering me in the new update.     1      when a creature dies, its hitbox stays there for a moment, getting in the way of arrow spells. I dont know if thats a bug, but the pre-turn analysis does not take it into account.    2     When you kill the deathmason, its copies have the first turn. I'm not completely sure this is a bug, but because it also kills all creatures on the map, including summons, you cant even have any bodies protecting you from instant death, so if it is on purpose, I dont think its the best way to have the boss.    3      When quicksaving, it seems that you get extra stat level ups. I don't actually know how it happens but I think it happens both when you complete a level and when you spawn into the next. I also got 6 stat points instead of three onve and I dont know why.     4       when combining target arrow with target circle, if the arrow misses, it will still cast target circle where you clicked and refund you the mana it took to cast target arrow, basically giving you infinite cast range
I don't have any screenshots but I figured these arent that hard to test so i guess ill take some if you want
i couldnt replicate the six stat points

- v1.20
    - Upgrade server to Bun
    - Is there a way to make existing spells synergize more??
        - Special Class-specific upgrades such as "make arrow cheaper" for archer (rather than current perks)
        - Increase base damage
- Renewed Marketing Efforts
    - Post in Wholesomeverse
    - Bug Bounty?
    - Blender environment tracking to show a scene from the game in real life
- Auras
- PickaPecka spell idea: Targets units that you pass through when moving (would work well with movement spells)


# Chosen Tasks
- Desync reporter - report health, position changes and use server hub as backend
- Fix pickup desync in multiplayer
- Scobjo: balance mana steal
    - https://discord.com/channels/1032294536640200766/1032294537235812404/1132360848824877189
- Look into "Level Variety" recommendations in Discord
- bug: enemies will die before touching a pickup on multiplayer because on the server they die/move all the way immediately and on the client they don't


# Smaller Important Tasks
- Add UI for mageType
    - Test something weird happened with the poisoner where an archer was poisoned but wasn't going to die and the glop ignored it and attacked me even tho the ally archer was closer
- i18n: Add translation for touchpad move character
- Validation 7/21
    - fix: Choosing necromancer class always makes next spell fizzle because now you have too many
        - This should be fixed if you choose the necromancer class before you start - to be validated


# Ideas
- D...: Level variety https://discord.com/channels/1032294536640200766/1132253029698117672/1132253032332140695
- Idea: Totem enemies that give off auras
- Idea: Risk/reward rolling mechanic that shows the roll ("give up 5 health for potentially 20 mana")
- Idea: Spell to temporarily increase cast range for this level (or a cast range aura)
- Ideas:
    - necromancer abilities (buffing non-player units)
    - spell: Teleport arrow
    - items that increase changes of obtaining certain spells
    - Spell idea: Target for next spell that is cast (includes allies)
- Spells should use your core attributes so if you change your attributes they impact your spells. Like damage spells always use your base damage and multiply it. 
- Able to change your hero’s attributes at a cost (Risk it)
- Spellmasons marketing: put sprites in real life with blender environment tracking
New trailer
- Reach out to instagram influencers
- All this after better end game and auras
- A shopkeeer where you can pay with your attributes for things 
- Feature idea: what if you can build your own "classes" that increase chances of finding things and have special buffs so you can develop unique playstyles?
    - Or what if you could "tap in" another wizard for a hard situation?