## CacheBlood
- big issue with cacheBlood; this happens after I cacheBlood a number of times
    - relevant: https://www.html5gamedevs.com/topic/44884-firefox-requested-size-at-this-level-is-unsupported/
```
 WebGL warning: texImage: Requested size at this level is unsupported.
15:59:07.093 WebGL warning: clear: Framebuffer not complete. (status: 0x8cd6) COLOR_ATTACHMENT0: Attachment has no width or height.
15:59:07.093 WebGL warning: clear: Framebuffer must be complete.
15:59:07.093 WebGL warning: drawElementsInstanced: Framebuffer not complete. (status: 0x8cd6) COLOR_ATTACHMENT0: Attachment has no width or height.
15:59:07.093 WebGL warning: drawElementsInstanced: Framebuffer must be complete. 
```
## Bugs 
- Prevent mana scamming (done by queing up a new spell while another one is still casting and the mana hasn't been removed yet)
- Fix target arrow issue (allows you to select people out of range)
- Desync during ally turn (as seen in brad playthrough)
- res spell alone should prioritize targeting dead units over living
    - reproduce: miniboss standing over corpse
## Content
- Improve Bossmason behavior
    - No traps
    - No heal? or more obvious?
- Floating text for blood curse from vampire
- Sand vampire should be more than just a color reskin
- Endgame Looping

## Balance
- Improve difficulty scaling with over 4 players
    - Wow used 10man and 25man variations
    - Increase unit quantity for over 4 players?
    - Introduce tougher enemies sooner?
    - Diversity of playstyle (classes?)

## Performance
- Blood Optimization
- Prediction slowing down
    - "You may still cast this spell, but it is too powerful to predict" (Get copy review)
- Testing on worse devises
    - Test on worse processor
    - Test on less RAM
- Test in offline mode

## Features
- Save / Load on multiplayer

# Nice to haves
- Stats in gameover screen
- Leaderboard
- Modding