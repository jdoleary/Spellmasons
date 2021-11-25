# Todo
- What happens when you clone yourself

- Update website on 2021/04/27 once DNSSEC is off
  - https://vercel.com/jdoleary/spellmason-com/settings/domains
  - https://domains.google.com/registrar/spellmason.com/dns

## 2021.04.22 Playtest with Brad

- We desynced unit positions until brad finished his turn, then it synced back up (one included a new spawned unit from summoner)
- Brad desynced when he charged
- It's somehow not Brad's turn on his screen (timer 0:00), but he's still casting on my screen and I have 0:42 seconds left. It seems to be that our turnTimeRemaining tiimers are far off

## 2021.04.21 Playtest with Rachel

- Fixed now?
  - Rachel was frozen and I had taken my turn but it said "waiting on others"
- my turns seem to be ending unexpecedly, i just poisoned a guy and i din'dt move

---

- Idea: A discard card that discards the following cards cast and gets you new cards

- Question for Brad: Should Protection protect any single ally? So that it can work for both players if you stack it?
  - stash: "protection stackable"
- Question for Brad: Do you like charge and should it trigger pickups when it moves you?
  - Bug: Charge doesn't play well with AOE

## Tasks

- Add obstacles to spell effect? So freeze can freeze lava?
- Freezing lava should let you walk over it (casts should work on obstacles)

## bugs

- These bugs occurred while playtesting with Rachel but I haven't been able to reproduce myself
  - chain purify didn't work(didn't remove poison)
  - latency reported negative
