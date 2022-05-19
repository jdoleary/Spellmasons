import type { Vec2 } from "./Vec";
import * as config from "./config";
import type Underworld from "./Underworld";
import Events from './Events';
import { Faction } from "./commonTypes";
import { centeredFloatingText } from "./FloatingText";

interface SpawnInfo {
    id: string;
    location: Vec2;
}
type HandcraftedLevelMaker = (underworld: Underworld) => HandcraftedLevel;
export interface HandcraftedLevel {
    // mapWidth: number;
    // mapHeight: number;
    playerSpawnLocations: Vec2[];
    portalSpawnLocation?: Vec2;
    obstacles: SpawnInfo[];
    doodads: {
        location: Vec2,
        text: string,
        style: any
    }[];
    units: SpawnInfo[];
    startingCards: string[];
    init?: (underworld: Underworld) => void;
    allowHeavyUnits: boolean;
}
export const tutorialLevels = Object.freeze([
    'Tutorial',
    'Pickups and Spell Casting',
    'Spells Work Together',
    'Spells in Order',
]);

export const levels: { [name: string]: HandcraftedLevelMaker } = {
    // @ts-ignore
    [tutorialLevels[0]]: (underworld: Underworld) => ({
        allowHeavyUnits: false,
        playerSpawnLocations: [{ x: underworld.width / 4, y: underworld.height / 2 }],
        portalSpawnLocation: { x: 3 * underworld.width / 4, y: underworld.height / 2 },
        obstacles: [],
        doodads: [
            {
                text: 'Right click with your mouse to move.\nHold "F" to see how far you can move per turn.\nWhen you have exhausted your stamina, press "Spacebar" to end your turn.\nEntering the portal will take you to the next level.',
                location: { x: underworld.width / 2, y: 400 },
                style: { align: 'center' },
            }
        ],
        units: [],
        startingCards: [],
        init: (underworld: Underworld) => {

            // Restart if you die
            const restartIfYouDieEventName = 'restartIfYouDie';
            Events.onDeathSource[restartIfYouDieEventName] = () => {
                // @ts-ignore
                underworld.initHandcraftedLevel(tutorialLevels[0]);
            }
            if (window.player) {
                window.player.unit.onDeathEvents = [restartIfYouDieEventName];
            }
            // Queue up the next level
            underworld.nextHandCraftedLevel = tutorialLevels[1];
        }
    }),
    // @ts-ignore
    [tutorialLevels[1]]: (underworld: Underworld) => ({
        allowHeavyUnits: false,
        playerSpawnLocations: [{ x: config.COLLISION_MESH_RADIUS, y: underworld.height / 2 }],
        obstacles: [],
        doodads: [
            {
                text: '↑\nDestroy the practice dummy with the "hurt" spell at the bottom of your screen.\nNote: You can queue up multiple spells to cast at once',
                location: { x: 385, y: 252 },
                style: { align: 'center' },
            }
        ],
        units: [
            {
                id: 'dummy',
                location: { x: underworld.width / 2, y: underworld.height / 2 }
            }
        ],
        startingCards: ['hurt'],
        init: (underworld: Underworld) => {
            // Restart if you die
            const restartIfYouDieEventName = 'restartIfYouDie';
            Events.onDeathSource[restartIfYouDieEventName] = () => {
                // @ts-ignore
                underworld.initHandcraftedLevel(tutorialLevels[1]);
            }
            if (window.player) {
                window.player.unit.onDeathEvents = [restartIfYouDieEventName];
            }
            // Queue up the next level
            underworld.nextHandCraftedLevel = tutorialLevels[2];
        }
    }),
    // @ts-ignore
    [tutorialLevels[2]]: (underworld: Underworld) => ({
        allowHeavyUnits: false,
        playerSpawnLocations: [{ x: config.COLLISION_MESH_RADIUS, y: underworld.height / 2 }],
        obstacles: [],
        doodads: [
            {
                text: 'Destroy all the practice dummies with one cast.\nThe order of the spells matters.',
                location: { x: 341, y: 381 },
                style: { align: 'center' },
            }
        ],
        units: [
            {
                id: 'dummy',
                location: { x: underworld.width / 2, y: underworld.height / 2 }
            },
            {
                id: 'dummy',
                location: { x: underworld.width / 2 + config.COLLISION_MESH_RADIUS * 2, y: underworld.height / 2 }
            },
            {
                id: 'dummy',
                location: { x: underworld.width / 2 + config.COLLISION_MESH_RADIUS * 2, y: underworld.height / 2 - config.COLLISION_MESH_RADIUS * 2 }
            },
            {
                id: 'dummy',
                location: { x: underworld.width / 2 + config.COLLISION_MESH_RADIUS * 2, y: underworld.height / 2 + config.COLLISION_MESH_RADIUS * 2 }
            },
            {
                id: 'dummy',
                location: { x: underworld.width / 2 + config.COLLISION_MESH_RADIUS * 5, y: underworld.height / 2 + config.COLLISION_MESH_RADIUS * 4 }
            },
        ],
        startingCards: ['hurt', 'chain'],
        init: (underworld: Underworld) => {
            const restartIfNotAllDieAtSameTimeEventName = 'restartIfNotAllDieAtSameTime';
            const enemies = underworld.units.filter(u => u.faction == Faction.ENEMY)
            function checkIfAllDied() {
                const allDestroyedAtOnce = enemies.every(u => u.alive == false);
                if (!allDestroyedAtOnce) {
                    centeredFloatingText('Try again');
                    setTimeout(() => {
                        // restart
                        // @ts-ignore
                        underworld.initHandcraftedLevel(tutorialLevels[2]);
                    }, 500)
                }

            }
            let checkIfAllDiedTimeout: NodeJS.Timeout;
            Events.onDeathSource[restartIfNotAllDieAtSameTimeEventName] = () => {
                if (checkIfAllDiedTimeout !== undefined) {
                    clearTimeout(checkIfAllDiedTimeout);
                }
                // TODO this should be more certain
                checkIfAllDiedTimeout = setTimeout(() => { checkIfAllDied() }, 500);
            }
            enemies.map(u => {
                u.onDeathEvents.push(restartIfNotAllDieAtSameTimeEventName);
            });
            // Restart if you die
            const restartIfYouDieEventName = 'restartIfYouDie';
            Events.onDeathSource[restartIfYouDieEventName] = () => {
                // @ts-ignore
                underworld.initHandcraftedLevel(tutorialLevels[2]);
            }
            if (window.player) {
                window.player.unit.onDeathEvents = [restartIfYouDieEventName];
            }
            // Queue up the next level
            underworld.nextHandCraftedLevel = tutorialLevels[3];
        }
    }),
    // @ts-ignore
    [tutorialLevels[3]]: (underworld: Underworld) => ({
        allowHeavyUnits: false,
        playerSpawnLocations: [{ x: config.COLLISION_MESH_RADIUS, y: underworld.height / 2 }],
        obstacles: [],
        doodads: [
            {
                text: 'Cast multiple spells together at the same time in a specific order\n to destroy the practice dummies all at once.',
                location: { x: 341, y: 400 },
                style: { align: 'center' },
            }
        ],
        units: [
            {
                id: 'dummy',
                location: { x: underworld.width / 2 + config.COLLISION_MESH_RADIUS * 2, y: underworld.height / 2 }
            },
            {
                id: 'dummy',
                location: { x: underworld.width / 2 + config.COLLISION_MESH_RADIUS * 4, y: underworld.height / 2 - config.COLLISION_MESH_RADIUS * 2 }
            },
            {
                id: 'dummy',
                location: { x: underworld.width / 2 + config.COLLISION_MESH_RADIUS * 2, y: underworld.height / 2 + config.COLLISION_MESH_RADIUS * 4 }
            },
            {
                id: 'dummy',
                location: { x: underworld.width / 2 + config.COLLISION_MESH_RADIUS * 9, y: underworld.height / 2 }
            },
            {
                id: 'dummy',
                location: { x: underworld.width / 2 - config.COLLISION_MESH_RADIUS * 4, y: underworld.height / 2 }
            },
        ],
        startingCards: ['hurt', 'AOE', 'chain'],
        init: (underworld: Underworld) => {
            underworld.players.forEach(p => {
                p.unit.manaMax = 100;
                p.unit.mana = p.unit.manaMax;
            });
            const restartIfNotAllDieAtSameTimeEventName = 'restartIfNotAllDieAtSameTime';
            const enemies = underworld.units.filter(u => u.faction == Faction.ENEMY)
            function checkIfAllDied() {
                const allDestroyedAtOnce = enemies.every(u => u.alive == false);
                if (!allDestroyedAtOnce) {
                    centeredFloatingText('Try again');
                    setTimeout(() => {
                        // restart
                        // @ts-ignore
                        underworld.initHandcraftedLevel(tutorialLevels[3]);
                    }, 500)
                }

            }
            let checkIfAllDiedTimeout: NodeJS.Timeout;
            Events.onDeathSource[restartIfNotAllDieAtSameTimeEventName] = () => {
                if (checkIfAllDiedTimeout !== undefined) {
                    clearTimeout(checkIfAllDiedTimeout);
                }
                // TODO this should be more certain
                checkIfAllDiedTimeout = setTimeout(() => { checkIfAllDied() }, 500);
            }
            enemies.map(u => {
                u.onDeathEvents.push(restartIfNotAllDieAtSameTimeEventName);
            });
            // Restart if you die
            const restartIfYouDieEventName = 'restartIfYouDie';
            Events.onDeathSource[restartIfYouDieEventName] = () => {
                // @ts-ignore
                underworld.initHandcraftedLevel(tutorialLevels[3]);
            }
            if (window.player) {
                window.player.unit.onDeathEvents = [restartIfYouDieEventName];
            }

        }
    })
}