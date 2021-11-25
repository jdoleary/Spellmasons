- Dictums
    - Server shall send messages for turn management
    - Server shall send messages for unit actions? (this could be a lot, can we not handle this on the client side with a seeded random?)
- Questions
    - How does the Server / Client know that a desync has occurred?
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
    - Volume test (how large of a message can the server send and does that exceed the current game state size)
        - https://datatracker.ietf.org/doc/html/draft-ietf-hybi-thewebsocketprotocol#section-5.4

So long as every network message is received and executed in order and random number generation is seeded, all clients should remain synced.

---
  - Server keeps records of all messages and numbers them
  - When a client takes an action, it executes it immediately locally
  - Actions received from server overwrite local state
    - Move actions should contain a from and a to
    - 