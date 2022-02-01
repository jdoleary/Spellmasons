## 2022-02-01
Checking the hash of the whole gamestate turns out to not work very well.  For one, there's a lot of data, and if something small changes, such as a unit's moveTarget the whole hash will be different.  Also originally I was calculating the hash on an interval, which means it would eventually calculate a hash mid-turn, when things were changing.  Which would make the hashes not match even if both clients had the same state message to message.
Possible solutions:
  - Calculate hashes for subgroups of the game state, such as units, players, pickups, etc.
  - Have the host send a message for the result of the AI turn (with from and to positions)
    - Give every unit a unique ID
    - Use full gameplay sync as a last resort
    
---
- Desyncs that occur when messages arrive out of order:
  - Desync, with fake lag, I was actually able to make a desync occur when two messages got send with varying delays and arrived out of order.  Maybe solution is to increment message counter?
  - Desync where if one client misses a `clientPresenceChanged` message their game will continue to operate as if that client isn't connected and can't take turns.
    - AHA, I think due to the fake lag, clients messages MAY arrive out of order
  - I was able to cause a desync, by makings a 5 second lag for messages, having two clients in the same window on different tabs and moving one while the other's message was still in flight
- Was able to cause a `window.overworld is undefined` in overworld.js:27 voteForLevel by having the two tabs start loading then having one vote before the other was finished. Now the overworld is going away in favor of the cauldron, but I should keep this kind of bug in mind when expecting users to join at any stage of the game
- Headless Server
  - Contrary thought: May not need headless server:
    - So long as turn order is enforced, even wsPie should be sufficient
    - There are only 2 things that change state
      1. Player action
      2. CPU turn
      - So long as the game state is identical between clients before CPU turn occurs (and the RNG is in the same state). the clients should remain synced.
      - Maybe I can hash the gamestate and compare to validate that the clients' gamestates are the same. Try npm's object-hash for this
        - object-hash can hash a string of 1120398 bytes in 3.8ms
  - When client joins, server sends client full game state
  - When client takes action
    - It is sent to server which updates it's local state and sends the message (with message id to all clients)
  - Q: How to build clients so that it can update it's state out of order, so if it starts with state A, executes order C and then recieves B? Could it rollback to A, play B and then replay C?
  - Should all messages be reversable?  Is this over engineering? Or would it never get to the point where it executes out of order because users can only act when it's their turn, so if it's their turn, they act (it's reflected immediately on the client) and then it waits to execute all new messages until it receives the one it just sent.
  - RNG will have to be able to be synced over the network, RNG desynces feel more likely, like with AI movement.  So if I send messages like grunt at 3B moves to 7D and if there is no grunt at 3B the client will trigger a desync error and request the full gamestate from the server and 
  force update it's local.  I should collect metrics on how often this happens, because ideally it should never happen. 
---
- Dictums
    - Server shall send messages for turn management
    - Server shall send messages for unit actions? (this could be a lot, can we not handle this on the client side with a seeded random?)
- Questions
    - How does the Server / Client know that a desync has occurred?
        - If a client recieves a message number greater than 1+ what it last had
        - Then the client asks for the previous messages
        - What if it's like Git? A "commit tree"
    - Should messages contain a from/to, (like chess move records: D3 to E4)?
    - What happens if a message is invalid due to a desync?
        - How does the client then respond,  Let's say a client tries to move their player from A1 to A2, but the server has the player at B1, this should trigger a resync because it means the client's state isn't up to date.  There should be automated tests for this (Desync type 3)
    - Should savable game state be encoded in order to be smaller  Seems like a basic saved game is > 9000 characters.  However this is only 9kb which isn't too big.  The whole page weight itself is 522kb
        - How to gzip in js with fflate:
```js
const enc = new TextEncoder();
const encoded = enc.encode(a);
console.log("encoded size", encoded.length);
const gzipped = fflate.gzipSync(encoded);
console.log("gzipped", gzipped.length)
const ungzipped = fflate.gunzipSync(gzipped);
const dec = new TextDecoder();
const unencoded = dec.decode(ungzipped);
console.log("equal", unencoded == a);
```
Types of Desyncs:
- 1: Server never gets client message (client tries to send while disconnected)
- 2: Client never gets server message (server tries to send while disconnected)
- 3: Client is in a bad state and tries to send a message that will be invalid on the server
- 4: Random number generator gets desynced

- Make automated tests that run live
    - Ping test (how long does it take for the server to echo back a message)
        - Also test how long it takes for longer messages
    - Volume (amount kind, not sound kind) test (how large of a message can the server send and does that exceed the current game state size)
        - https://datatracker.ietf.org/doc/html/draft-ietf-hybi-thewebsocketprotocol#section-5.4

So long as every network message is received and executed in order and random number generation is seeded, all clients should remain synced.

---
  - Server keeps records of all messages and numbers them
  - When a client takes an action, it executes it immediately locally
  - Actions received from server overwrite local state
    - Move actions should contain a from and a to