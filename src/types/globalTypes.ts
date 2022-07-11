import type * as PIXI from 'pixi.js';
import type * as Player from '../entity/Player';
import type * as Unit from '../entity/Unit';
import type Underworld from '../Underworld';
import type PieClient from '@websocketpie/client';
import type { Vec2 } from '../mathematics/Vec';
import type { LevelData } from '../Underworld';
import { View } from '../views';
import { Faction } from './commonTypes';
import { IPickup } from '../entity/Pickup';
import { ForceMove } from '../mathematics/moveWithCollision';
declare global {
    interface Window {
        SPELLMASONS_PACKAGE_VERSION: string;
        latencyPanel: Stats.Panel;
        runPredictionsPanel: Stats.Panel;
        underworld: Underworld;
        // A reference to the player instance of the client playing on this instance
        player: Player.IPlayer | undefined;
        // Globals needed for Golems-menu
        pie: PieClient;
        connect_to_wsPie_server: (wsUri?: string) => Promise<void>;
        joinRoom: (_room_info: any) => Promise<unknown>;
        setupPixiPromise: Promise<void>;
        // Svelte menu handles
        exitCurrentGame: () => void;
        closeMenu: () => void;
        // Sets which route of the menu is available; note, the view must also
        // be set to Menu in order to SEE the menu
        setMenu: (route: string) => void;
        // Used to tell the menu if a game is ongoing or not
        updateInGameMenuStatus: () => void;
        // The menu will call this if the user chooses to skip the tutorial
        skipTutorial: () => void;

        save: (title: string) => void;
        load: (title: string) => void;
        getAllSaveFiles: () => string[];
        // Save pie messages for later replay
        saveReplay: (title: string) => void;
        // Used to replay onData messages for development
        replay: (title: string) => void;
        // The client id of the host of the game, may or may not be
        // identical to clientId
        hostClientId: string;
        // Current client's id
        clientId: string;
        animatingSpells: boolean;
        view: View;
        // For development use
        giveMeCard: (cardId: string, quantity: number) => void;
        // Set to true in developer console to see debug information
        showDebug: boolean;
        // Graphics for drawing debug information, use window.showDebug = true
        // to show at runtime. Automatically draws pathing bounds, walls, etc
        debugGraphics: PIXI.Graphics;
        // Graphics for drawing debug information a-la-carte
        devDebugGraphics: PIXI.Graphics;
        // Shows radiuses for spells
        radiusGraphics: PIXI.Graphics;
        // Graphics to show what other players are thinking
        thinkingPlayerGraphics: PIXI.Graphics;
        // Graphics for drawing unit health and mana bars
        unitOverlayGraphics: PIXI.Graphics;
        // Graphics for drawing the spell effects during the dry run phase
        predictionGraphics: PIXI.Graphics;
        // Graphics for rendering above board and walls but beneath units and doodads,
        // see containerPlanningView for exact render order.
        planningViewGraphics: PIXI.Graphics;
        // Graphics for debugging the cave
        debugCave: PIXI.Graphics;
        allowCookies: boolean;
        playMusic: () => void;
        changeVolume: (volume: number) => void;
        changeVolumeMusic: (volume: number) => void;
        changeVolumeGame: (volume: number) => void;
        volume: number;
        volumeMusic: number;
        volumeGame: number;
        startSingleplayer: () => Promise<void>;
        startMultiplayer: (wsPieUrl: string) => Promise<void>;
        // Used to ensure that the current client's turn doesn't end while they are still walking
        // If they invoke endMyTurn() while they are walking, it will wait until they are done
        // walking to end their turn.  If they are not walking, it will end immediately.
        // This property will always be a promise, since it is set immediately below as a resolved
        // promise.  This is so that the promise is always resolved UNLESS the player is currently
        // walking.
        playerWalkingPromise: Promise<void>;
        // makes a pop up prompting the user to accept cookies
        cookieConsentPopup: (forcePopup: boolean) => void;
        // A zoom value that the camera zoom will lerp to
        zoomTarget: number;
        // A list of enemy ids that have been encountered by this client
        // Used to introduce new enemies
        enemyEncountered: string[];
        // Make me superhuman (used for dev)
        superMe: () => void;
        // A local copy of underworld.units used to predict damage and mana use from casting a spell
        predictionUnits: Unit.IUnit[];
        // A local copy of underworld.pickups used to predict effect from casting a spell
        predictionPickups: IPickup[];
        // Shows icons above the heads of enemies who will damage you next turn
        attentionMarkers: Vec2[];
        // Shows icon for units that will be successfully resurrected
        resMarkers: Vec2[];
        // Keep track of the LevelData from the last level that was created in
        // case it needs to be sent to another client
        lastLevelCreated: LevelData;
        // True if client player has casted this turn;
        // Used to prompt before ending turn without taking any action
        castThisTurn: boolean;
        // Turns on fps monitoring
        monitorFPS: () => void;
        // A hash of the last thing this client was thinking
        // Used with MESSAGE_TYPES.PLAYER_THINKING so other clients 
        // can see what another client is planning.
        // The hash is used to prevent sending the same data more than once
        lastThoughtsHash: string;
        playerThoughts: { [clientId: string]: { target: Vec2, cardIds: string[] } };
        // A list of units and pickups and an endPosition that they are moved to via a "force",
        // like a push or pull or explosion.
        forceMove: ForceMove[];
        // Middle Mouse Button Down
        // Note: do NOT set directly, use setMMBDown instead
        readonly MMBDown: boolean;
        // Used to set MMBDown so it will affect CSS too
        setMMBDown: (isDown: boolean) => void;
        // Right Mouse Button Down
        // Note: do NOT set directly, use setRMBDown instead
        readonly RMBDown: boolean;
        // Used to set Right mouse button down
        setRMBDown: (isDown: boolean) => void;
        // Allows manually overriding the underworld seed via the JS console
        seedOverride: string | undefined;
        // devMode: auto picks character and upgrades
        devMode: boolean;
        // Used for development to debug the original information used to make a map
        map: any;
        devSpawnUnit: (unitId: string, faction: Faction) => void;
        devSpawnAllUnits: () => void;
    }
}
