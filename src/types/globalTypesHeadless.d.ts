import type * as PIXI from 'pixi.js';
import type * as Player from '../entity/Player';
import type * as Unit from '../entity/Unit';
import type Underworld from '../Underworld';
import type PieClient from '@websocketpie/client';
import type { Vec2 } from '../jmath/Vec';
import type { View } from '../views';
import type { Faction } from './commonTypes';
import type { IPickup } from '../entity/Pickup';
import { IHostApp } from '../network/networkUtil';

declare global {
    var SPELLMASONS_PACKAGE_VERSION: string;
    var underworld: Underworld;
    // Allows manually overriding the underworld seed via the JS console
    var seedOverride: string | undefined;
    // true if this instance is the headless server with no visuals or audio, just the game logic
    var headless: boolean;
    // Returns true if client is playing singleplayer OR if hostapp
    var isHost: (pie: PieClient | IHostApp) => boolean;


    // The following are undefined in the headless server
    // var pixi: undefined;
    // var latencyPanel: undefined;
    // var runPredictionsPanel: undefined;
    // var player: undefined;
    // var connect_to_wsPie_server: undefined;
    // var joinRoom: undefined;
    // var setupPixiPromise: undefined;
    // var pixiPromiseResolver: undefined;
    // var exitCurrentGame: undefined;
    // var closeMenu: undefined;
    // var setMenu: undefined;
    // var updateInGameMenuStatus: undefined;
    // var skipTutorial: undefined;
    // var save: undefined;
    // var load: undefined;
    // var getAllSaveFiles: undefined;
    // var clientId: undefined;
    // var animatingSpells: undefined;
    // var view: undefined;
    // var giveMeCard: undefined;
    // var showDebug: undefined;
    // var walkPathGraphics: undefined;
    // var debugGraphics: undefined;
    // var devDebugGraphics: undefined;
    // var radiusGraphics: undefined;
    // var thinkingPlayerGraphics: undefined;
    // var unitOverlayGraphics: undefined;
    // var predictionGraphics: undefined;
    // var planningViewGraphics: undefined;
    // var debugCave: undefined;
    // var allowCookies: undefined;
    // var playMusic: undefined;
    // var changeVolume: undefined;
    // var changeVolumeMusic: undefined;
    // var changeVolumeGame: undefined;
    // var volume: undefined;
    // var volumeMusic: undefined;
    // var volumeGame: undefined;
    // var startSingleplayer: undefined;
    // var startMultiplayer: undefined;
    // var playerWalkingPromise: undefined;
    // var cookieConsentPopup: undefined;
    // var zoomTarget: any;
    // var enemyEncountered: undefined;
    // var superMe: undefined;
    // var predictionUnits: undefined;
    // var predictionPickups: undefined;
    // var attentionMarkers: undefined;
    // var resMarkers: undefined;
    // var castThisTurn: undefined;
    // var monitorFPS: undefined;
    // var MMBDown: undefined;
    // var setMMBDown: undefined;
    // var RMBDown: undefined;
    // var setRMBDown: undefined;
    // var notifiedOutOfStamina: undefined;
    // var devMode: undefined;
    // var map: any;
    // var devSpawnUnit: undefined;
    // var devSpawnAllUnits: undefined;
    // var devRemoveAllEnemies: undefined;
    // var playNextSong: undefined;
    // var playSFX: undefined;
    // var playSFXKey: undefined;
    // var sfx: undefined;
    // var tryAutoConnect: undefined;
    var pixi: typeof PIXI | undefined;
    var latencyPanel: undefined | Stats.Panel;
    var runPredictionsPanel: undefined | Stats.Panel;
    // A reference to the player instance of the client playing on this instance
    var player: Player.IPlayer | undefined;
    var connect_to_wsPie_server: undefined | ((wsUri?: string) => Promise<void>);
    var joinRoom: undefined | ((_room_info: any) => (undefined | Promise<unknown>));
    var setupPixiPromise: undefined | Promise<void>;
    var pixiPromiseResolver: undefined | (() => void);
    // Svelte menu handles
    var exitCurrentGame: undefined | (() => void);
    var closeMenu: undefined | (() => void);
    // Sets which route of the menu is available; note, the view must also
    // be set to Menu in order to SEE the menu
    var setMenu: undefined | ((route: string) => void);
    // Used to tell the menu if a game is ongoing or not
    var updateInGameMenuStatus: undefined | (() => void);
    // The menu will call this if the user chooses to skip the tutorial
    var skipTutorial: undefined | (() => void);

    var save: undefined | ((title: string) => void);
    var load: undefined | ((title: string) => void);
    var getAllSaveFiles: undefined | (() => string[]);
    // Current client's id
    var clientId: undefined | string;
    var animatingSpells: undefined | boolean;
    var view: undefined | View;
    // For development use
    var giveMeCard: undefined | ((cardId: string, quantity: number) => void);
    // Set to true in developer console to see debug information
    var showDebug: undefined | boolean;
    // Draw the "walk rope" to show a player how far they can travel.
    var walkPathGraphics: PIXI.Graphics | undefined;
    // Graphics for drawing debug information, use window.showDebug = true
    // to show at runtime. Automatically draws pathing bounds, walls, etc
    var debugGraphics: PIXI.Graphics | undefined;
    // Graphics for drawing debug information a-la-carte
    var devDebugGraphics: PIXI.Graphics | undefined;
    // Shows radiuses for spells
    var radiusGraphics: PIXI.Graphics | undefined;
    // Graphics to show what other players are thinking
    var thinkingPlayerGraphics: PIXI.Graphics | undefined;
    // Graphics for drawing unit health and mana bars
    var unitOverlayGraphics: PIXI.Graphics | undefined;
    // Graphics for drawing the spell effects during the dry run phase
    var predictionGraphics: PIXI.Graphics | undefined;
    // Graphics for rendering above board and walls but beneath units and doodads,
    // see containerPlanningView for exact render order.
    var planningViewGraphics: PIXI.Graphics | undefined;
    // Graphics for debugging the cave
    var debugCave: PIXI.Graphics | undefined;
    var allowCookies: undefined | boolean;
    var playMusic: undefined | (() => void);
    var changeVolume: undefined | ((volume: number) => void);
    var changeVolumeMusic: undefined | ((volume: number) => void);
    var changeVolumeGame: undefined | ((volume: number) => void);
    var volume: undefined | number;
    var volumeMusic: undefined | number;
    var volumeGame: undefined | number;
    var startSingleplayer: undefined | (() => Promise<void>);
    var startMultiplayer: undefined | ((wsPieUrl: string) => Promise<void>);
    // Used to ensure that the current client's turn doesn't end while they are still walking
    // If they invoke endMyTurn() while they are walking, it will wait until they are done
    // walking to end their turn.  If they are not walking, it will end immediately.
    // This property will always be a promise, since it is set immediately below as a resolved
    // promise.  This is so that the promise is always resolved UNLESS the player is currently
    // walking.
    var playerWalkingPromise: undefined | Promise<void>;
    // makes a pop up prompting the user to accept cookies
    var cookieConsentPopup: undefined | ((forcePopup: boolean) => void);
    // A zoom value that the camera zoom will lerp to
    var zoomTarget: undefined | number;
    // A list of enemy ids that have been encountered by this client
    // Used to introduce new enemies
    var enemyEncountered: undefined | string[];
    // Make me superhuman (used for dev)
    var superMe: undefined | ((underworld: Underworld) => void);
    // A local copy of underworld.units used to predict damage and mana use from casting a spell
    var predictionUnits: Unit.IUnit[] | undefined;
    // A local copy of underworld.pickups used to predict effect from casting a spell
    var predictionPickups: IPickup[] | undefined;
    // Shows icons above the heads of enemies who will damage you next turn
    var attentionMarkers: undefined | { imagePath: string, pos: Vec2 }[];
    // Shows icon for units that will be successfully resurrected
    var resMarkers: undefined | Vec2[];
    // True if client player has casted this turn;
    // Used to prompt before ending turn without taking any action
    var castThisTurn: undefined | boolean;
    // Turns on fps monitoring
    var monitorFPS: undefined | (() => void);
    // Middle Mouse Button Down
    // Note: do NOT set directly, use setMMBDown instead
    var MMBDown: undefined | boolean;
    // Used to set MMBDown so it will affect CSS too
    var setMMBDown: undefined | ((isDown: boolean) => void);
    // Right Mouse Button Down
    // Note: do NOT set directly, use setRMBDown instead
    var RMBDown: undefined | boolean;
    // Used to set Right mouse button down
    var setRMBDown: undefined | ((isDown: boolean, underworld: Underworld) => void);
    var notifiedOutOfStamina: undefined | boolean;
    // devMode: auto picks character and upgrades
    var devMode: undefined | boolean;
    // Used for development to debug the original information used to make a map
    var map: undefined | any;
    var devKillAll: undefined | (() => void);
    var devSpawnUnit: undefined | ((unitId: string, faction: Faction, coords?: Vec2) => void);
    var devSpawnAllUnits: undefined | (() => void);
    var devRemoveAllEnemies: undefined | (() => void);
    // Move audio functions into global so they can be injected IF audio is supported
    var playNextSong: undefined | (() => void | undefined);
    var playSFX: ((path?: string) => void | undefined);
    var playSFXKey: ((key: string) => void | undefined);
    var sfx: { [key: string]: string } | undefined;
    // svelte menu function to attempt to autoconnect if the queryString holds the info
    var tryAutoConnect: undefined | (() => void);
    // Returns pie.isConnected()
    var isConnected: undefined | (() => boolean);
    // Disconnects pie from server
    var pieDisconnect: undefined | (() => Promise<void>);
    // the currently selected unit, useful as a devTool, click on a unit and they will be available in the console
    var selectedUnit: Unit.IUnit | undefined;
    // used for hiding the HUD for recording purposes
    var isHUDHidden: boolean | undefined;
}
