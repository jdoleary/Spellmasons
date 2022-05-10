## Critical tasks
- Websocket pie should try to reconnect after "pull the plug"
- Issue where after a reconnect, the top bar still says "your turn" but it's not my turn in the underworld and won't let me act because playerTurnIndex is not me
- You may be obscured by card hand if you spawn in lower left corner
    - seed Seed: 0.420159076165335
- Brad somehow disconnected and **rejoined** as a new user without the old user disconnecting.
    - [Maybe try to associate IP address with clientId?](https://stackoverflow.com/questions/14822708/how-to-get-client-ip-address-with-websocket-websockets-ws-library-in-node-js)
    - What happens if a user joins with multiple tabs
    - Task: Refactor clientPresenceChanged to only show the list of clients
    - Task: Add pinging to wsPie to make sure clients remain connected??
        - This will ensure that clients don't try to send messages while they're not connected, it should display that they got disconnected
        - https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
        - "pulling the plug" caused a bunch of players to spawn and somehow even though there were only 2 clients,  there were more players that still reported as connected
            - This can happen if you "miss" a clientPresenseChanged message, it should always be kept in
            sync with the clients array
        - "pulling the plug" resulted in a connection failure where it didn't try to reconnect:
            - Promise undefined:
```
syncTurnMessage: phase: PlayerTurns ; player: 1 hub-83e7007f.js:354:43
The connection to wss://websocketpie-3oyno.ondigitalocean.app/?clientId=35dd4c36-fd0a-4596-ab13-e0a5e50f2fcb was interrupted while the page was loading. client.js:235:35
websocket🥧: 
error { target: WebSocket, isTrusted: true, srcElement: WebSocket, currentTarget: WebSocket, eventPhase: 2, bubbles: false, cancelable: false, returnValue: true, defaultPrevented: false, composed: false, … }
hub-83e7007f.js:354:43
websocket🥧: connection closed. hub-83e7007f.js:354:43
onConnectInfo 
Object { type: "ConnectInfo", connected: false, msg: "Connection to wss://websocketpie-3oyno.ondigitalocean.app/?clientId=35dd4c36-fd0a-4596-ab13-e0a5e50f2fcb closed." }
hub-83e7007f.js:354:43
websocket🥧: Reconnect attempt 1; will try to reconnect automatically in 100 milliseconds. hub-83e7007f.js:354:43
websocket🥧: connecting to wss://websocketpie-3oyno.ondigitalocean.app/?clientId=35dd4c36-fd0a-4596-ab13-e0a5e50f2fcb... hub-83e7007f.js:354:43
Firefox can’t establish a connection to the server at wss://websocketpie-3oyno.ondigitalocean.app/?clientId=35dd4c36-fd0a-4596-ab13-e0a5e50f2fcb. client.js:235:35
websocket🥧: 
error { target: WebSocket, isTrusted: true, srcElement: WebSocket, currentTarget: WebSocket, eventPhase: 2, bubbles: false, cancelable: false, returnValue: true, defaultPrevented: false, composed: false, … }
hub-83e7007f.js:354:43
websocket🥧: connection closed. hub-83e7007f.js:354:43
onConnectInfo 
Object { type: "ConnectInfo", connected: false, msg: "Connection to wss://websocketpie-3oyno.ondigitalocean.app/?clientId=35dd4c36-fd0a-4596-ab13-e0a5e50f2fcb closed." }
hub-83e7007f.js:354:43
Uncaught (in promise) undefined 
```
- Need to **Optimize**, it got very laggy for him
    - Re running findPath for each unit each loop is not good
    - Sync dryRun units every loop is a waste too if nothing changes
        - This could be optimized so it only recalcs if a unit moves or if the cast target or cast cards change
    - Rename 'dryRun' to prediction, since it will actually execute logic (on a copy of units - dryRunUnits), it just doesn't want anything to show on screen.

---
- More random generation / better maps.  This isn't a rogue-like without the random element
    - Take queues from slay the spire
    - Sectors could have optional elements
    - Sectors could fit together using WFC instead of just being picked by random
- TODO: Unit.syncronize should sync modifier images such as frozen or heavy armor
- Portal didn't appear once (honeycomb seems broken if you have walls above and below you)
- Goons spawned outside of map when summoner was stuffed in upper left corner of map

## Tasks

- Allys shouldn't push player units
- Update mana steal tooltip (remove cost portion since it updates when you cast)
- Dead units don't lose poison
- "maximum shield" shows a bunch of times on hover if casting the spell would give them map
---
- Use middle mouse button drag to move camera
- Make damage that they WILL take different from damage that they HAVE taken.  It's confusing

- Bug: Can go negative mana if you cast too quickly
- Bug: Had a scenario where i had a debugger on enterPortal and on image.show
and 2nd client got `Cannot change character, player not found with id 8c502be8-631c-482a-9398-40155f77c21f`
    - maybe in this case, re-request player sync??
- Improve sending castCards with targeting based on id not position
- Make loading screen
- Make an overlay screen that blocks interaction while waiting for sync
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther
- Fix multiplayer
    - What about if host disconnects mid step?
- Make freeze block pathing
    - Bug: Guy blocked by frozen unit still takes a bite out of me without moving closer

# Stale, but important bugs

- The zoom coordinates off issue between multiplayer sessions when casting
    - hit on one screen, miss on another
- Optimize pathing
- How to resurrect units you are standing on top of (blocking?)

# Juice
- Cards flip as you drag-n-drop over them
- Improved unit tooltip

## More content
- Upgradable spells like hurt2
- Spells that move units around
- Spell that summons blocker
- Disincentivise hiding and casting
    - Maybe a spawn crystal that if you don't kill it, it'll spawn a bunch of bad guys
- An enemy that consumes allies to get stronger