## bugs
- Bug: I clicked on a mob that was slightly overlapping me but it somehow cast on me instead even though the target was on the mob
  - This should be fixed once I implement "Collision" task
- Bug: Spell chain still draws dryRun lines for ignored units
- Pixi loader sometimes hangs
  - happens in my second tab
  - sheet1.json is returning 304 not modified
  - Haven't been able to reproduce this in a while

- These bugs occurred while playtesting with Rachel but I haven't been able to reproduce myself
  - chain purify didn't work(didn't remove poison)
  - latency reported negative
- If server restarts mid game, wsPie's RoomManager.onData will fail because client.room is undefined
- Upgrades will be the same for a given user if their clientId stays the same between games.  They shouldn't get the same upgrades on multiple different games