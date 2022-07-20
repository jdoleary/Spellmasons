import type Underworld from '../Underworld';
import type { Vec2 } from '../jmath/Vec';
import type { LevelData } from '../Underworld';
import { ForceMove } from '../jmath/moveWithCollision';

declare global {
    var SPELLMASONS_PACKAGE_VERSION: string;
    var underworld: Underworld;
    // Keep track of the LevelData from the last level that was created in
    // case it needs to be sent to another client
    var lastLevelCreated: LevelData;
    // A hash of the last thing this client was thinking
    // Used with MESSAGE_TYPES.PLAYER_THINKING so other clients 
    // can see what another client is planning.
    // The hash is used to prevent sending the same data more than once
    var lastThoughtsHash: string;
    var playerThoughts: { [clientId: string]: { target: Vec2, cardIds: string[] } };
    // A list of units and pickups and an endPosition that they are moved to via a "force",
    // like a push or pull or explosion.
    var forceMove: ForceMove[];
    // Allows manually overriding the underworld seed via the JS console
    var seedOverride: string | undefined;
    // true if this instance is the headless server with no visuals or audio, just the game logic
    var headless: boolean;
    // Returns true if client is playing singleplayer OR if hostapp
    var isHost: () => boolean;

}
