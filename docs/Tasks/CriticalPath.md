# Critical Path
- Desync reporter - report health, position changes and use server hub as backend
- Fix pickup desync in multiplayer
- Scobjo: balance mana steal
    - https://discord.com/channels/1032294536640200766/1032294537235812404/1132360848824877189
- Look into "Level Variety" recommendations in Discord
- Russell Feedback
    - Distinguish between low/med/high perks in UI
    - Priest miniboss lost miniboss status on death
    - stamina perks not good enough?
    - "Challenge maps" specifically designed to show off specific strategies
    - Improve drown damage
    - "harvest" makes false positive prediction skulls
- Feature idea: what if you can build your own "classes" that increase chances of finding things and have special buffs so you can develop unique playstyles?
    - Or what if you could "tap in" another wizard for a hard situation?
- Idea: Totem enemies that give off auras
- Idea: Risk/reward rolling mechanic that shows the roll ("give up 5 health for potentially 20 mana")
- bug: enemies will die before touching a pickup on multiplayer because on the server they die/move all the way immediately and on the client they don't


# Smaller Important Tasks
- Split doesn't work on yourself if you don't have 2x mana of split (Reported by Chase87)
- Add UI for mageType
    - Test something weird happened with the poisoner where an archer was poisoned but wasn't going to die and the glop ignored it and attacked me even tho the ally archer was closer
- i18n: Add translation for touchpad move character
- Ideas:
    - necromancer abilities (buffing non-player units)
    - spell: Teleport arrow
    - items that increase changes of obtaining certain spells
    - Spell idea: Target for next spell that is cast (includes allies)
- Validation 7/21
    - fix: Choosing necromancer class always makes next spell fizzle because now you have too many
        - This should be fixed if you choose the necromancer class before you start - to be validated


# Ideas
- D...: Level variety https://discord.com/channels/1032294536640200766/1132253029698117672/1132253032332140695