# Critical Path
- v1.20
    - Antonio!'s feedback taht Capture Soul's summon spells are too expensive to be worth it and resurrect is just plain better.
        Expresso Depresso — Yesterday at 7:23 PM
eeeh its one of those where you shouldn't be able to out perform more than 2 summoners. For example as an exclusively co op player even if its just two people you can keep up with about 4 summoners if you have 2 150 cost summons Like blood archer and golem. If you have clone you WILL out pace those four summoners. My buddy and I love summoner armies but if summoners were made noticeably better it would be the second strongest build right behind current blood mage. I'm honestly quite happy with how the current summoner plays and if you get lucky and you get capture soul before you pick a class then the far gazer is amazing. The only change I could really say would be to make summoner a better class to pick with out making it broken would be like a 25-30% discount for summoning things 

    - Daddy.Gar — Today at 2:19 AM
Uh you can infintely use the clone spell as a blood mason to the point i think i may have crashed the east coast community server...
    - Expresso Depresso — Yesterday at 9:16 PM
sooooooo after the bloodmason run we  got so much xp that when we hit new run we got every spell again. I dobut this will be a bug again but I figured I would throw this in here just in case
    - Antonio! — 09/17/2023 9:38 PM
I was mistaken about the death masons having the first turn, but i still think they should either spawn far away from the player or not use their slash attack for a few turns
also are the second phase death masons supposed to die after one or two turns because I think they are just taking eachothers health.
also during the calamities, when increasing max health, the creatures whos max health was increased dont increase in health they have, keeping their old health stat just increasing their max health
    - "good looks" upgrade is hidden on some resolutions (1080)
    - Game stuck after all 3 players portaling: https://www.twitch.tv/videos/1928091427 01:26:43
    - Use bun for websocketpie
    - Bloodmason + Bloodcurse is WAY TO POWERFUL
    - Entropy Weaveress — Today at 3:40 PM
I did not look at the second number.
But by upgrading just my hp I got to unfair hp numbers and could clear every level almost in one turn.
    - Bloodmason is still too powerful just by casting alone
    - Stat upgrades don't show after looping
    - Phrieksho: Vengance + Timemason is bugged out
        - Make sfx of timemason taking damage softer
    - Bloodmason needs balancing desprately
    - Expresso Depresso — 09/15/2023 9:42 PM
so I uh didnt die in my mp game when a blood golem mini boss hit me I took a tiny bit of damage but I shouldve been hit with 80 damage and I only had 42 health
the golem had 3 bloat on him
As far as im aware this game doesnt have feel no pain dice rolls right? lol
    - Expresso Depresso — 09/15/2023 11:01 PM
also small visual bug so not a really big deal but if you use bloat on a friendly summoned unit then kill it it comes back at full heath but then dies instantly upon next action. (example: casting a spell or ending turn)
    - Expresso Depresso — 09/15/2023 11:47 PM
sorry for breaking your game so much. However when I dashed through a red portal from a Deathmason it said I died on my end instead of taking 30 damage, so efectivley my turn was skipped. When the turn ended I was attacked by the Deathmason and died again. My friend I was playing with said that I was very much alive on his end until the Deathmason obliterated me. 
again these were all bugs discovered in multiplayer so I dont know if that has anything to do with it
    - Antonio! — Today at 9:31 AM
    also, the second phase death masons killed eachother for health once
a few bugs have been bothering me in the new update.     1      when a creature dies, its hitbox stays there for a moment, getting in the way of arrow spells. I dont know if thats a bug, but the pre-turn analysis does not take it into account.    2     When you kill the deathmason, its copies have the first turn. I'm not completely sure this is a bug, but because it also kills all creatures on the map, including summons, you cant even have any bodies protecting you from instant death, so if it is on purpose, I dont think its the best way to have the boss.    3      When quicksaving, it seems that you get extra stat level ups. I don't actually know how it happens but I think it happens both when you complete a level and when you spawn into the next. I also got 6 stat points instead of three onve and I dont know why.     4       when combining target arrow with target circle, if the arrow misses, it will still cast target circle where you clicked and refund you the mana it took to cast target arrow, basically giving you infinite cast range
I don't have any screenshots but I figured these arent that hard to test so i guess ill take some if you want
i couldnt replicate the six stat points
    - XzeroAir UI scaling of 1.1 makes class mage type cards get clipped on the bottom
- Next Feature Update (v1.19)
    - Mage Classes
        - Balancing
            - Either Bloodmason spells are too cheap or stats points for health is too powerful

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
- Scojbo: You could always give specific classes immediate access to a spell (like archer: arrow) and then have that spell ALWAYS cost 10.  All the sudden arrow is a decent spell, and the archer has a unique play pattern that revolves around repeated casts of a unique spell.
- Make a non-turn based gamemode where the "end turn" button becomes a "pause" button where you can still cast


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