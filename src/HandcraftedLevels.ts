import type { Vec2 } from "./Vec";
import * as config from "./config";
import type Underworld from "./Underworld";
import Events from './Events';
import * as Pickup from './Pickup';
import { Faction } from "./commonTypes";
import { orderedFloatingText } from "./FloatingText";
import { setView, View } from "./views";

interface SpawnInfo {
    id: string;
    location: Vec2;
}
export interface HandcraftedLevel {
    // mapWidth: number;
    // mapHeight: number;
    playerSpawnLocations: Vec2[];
    portalSpawnLocation?: Vec2;
    specialPickups: SpawnInfo[];
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
export const tutorialLevels = [
    'Tutorial',
    'Pickups and Spell Casting',
    'Spells Work Together',
    'Spells in Order',
]

export const levels: { [name: string]: HandcraftedLevel } = {
    [tutorialLevels[0]]: {
        allowHeavyUnits: false,
        playerSpawnLocations: [{ x: config.MAP_WIDTH / 4, y: config.MAP_HEIGHT / 2 }],
        portalSpawnLocation: { x: 3 * config.MAP_WIDTH / 4, y: config.MAP_HEIGHT / 2 },
        specialPickups: [],
        obstacles: [],
        doodads: [
            {
                text: 'Right click with your mouse to move.\nPress "spacebar" to end your turn.\nEntering the portal will take you to the next level.',
                location: { x: config.MAP_WIDTH / 2, y: 100 },
                style: { align: 'center' },
            }
        ],
        units: [],
        startingCards: [],
        init: (underworld) => {

            // Restart if you die
            const restartIfYouDieEventName = 'restartIfYouDie';
            Events.onDeathSource[restartIfYouDieEventName] = () => {
                underworld.initHandcraftedLevel(tutorialLevels[0]);
            }
            if (window.player) {
                window.player.unit.onDeathEvents = [restartIfYouDieEventName];
            }
            // Queue up the next level
            underworld.nextHandCraftedLevel = tutorialLevels[1];
        }
    },
    [tutorialLevels[1]]: {
        allowHeavyUnits: false,
        playerSpawnLocations: [{ x: config.COLLISION_MESH_RADIUS, y: config.MAP_HEIGHT / 2 }],
        specialPickups: [],
        obstacles: [],
        doodads: [
            {
                text: '↑\nDestroy the practice dummy with your new "hurt" spell.\nNote: You can queue up multiple spells to cast at once',
                location: { x: 485, y: 378 },
                style: { align: 'center' },
            }
        ],
        units: [
            {
                id: 'dummy',
                location: { x: config.MAP_WIDTH / 2, y: config.MAP_HEIGHT / 2 }
            }
        ],
        startingCards: ['hurt'],
        init: (underworld: Underworld) => {
            const spawnPortalOnDeathEventName = 'spawnPortalOnDeath';
            Events.onDeathSource[spawnPortalOnDeathEventName] = () => {
                const portalPickup = Pickup.specialPickups['portal'];
                Pickup.create(
                    3 * config.MAP_WIDTH / 4,
                    config.MAP_HEIGHT / 2,
                    portalPickup.name,
                    portalPickup.description,
                    false,
                    portalPickup.imagePath,
                    portalPickup.animationSpeed,
                    true,
                    portalPickup.effect,
                );
            }
            underworld.units.filter(u => u.faction == Faction.ENEMY).map(u => {
                u.onDeathEvents.push(spawnPortalOnDeathEventName);
            });

            // Restart if you die
            const restartIfYouDieEventName = 'restartIfYouDie';
            Events.onDeathSource[restartIfYouDieEventName] = () => {
                underworld.initHandcraftedLevel(tutorialLevels[1]);
            }
            if (window.player) {
                window.player.unit.onDeathEvents = [restartIfYouDieEventName];
            }
            // Queue up the next level
            underworld.nextHandCraftedLevel = tutorialLevels[2];
        }
    },
    [tutorialLevels[2]]: {
        allowHeavyUnits: false,
        playerSpawnLocations: [{ x: config.COLLISION_MESH_RADIUS, y: config.MAP_HEIGHT / 2 }],
        specialPickups: [],
        obstacles: [],
        doodads: [
            {
                text: 'Destroy all the practice dummies with one spell.',
                location: { x: 485, y: 500 },
                style: { align: 'center' },
            }
        ],
        units: [
            {
                id: 'dummy',
                location: { x: config.MAP_WIDTH / 2, y: config.MAP_HEIGHT / 2 }
            },
            {
                id: 'dummy',
                location: { x: config.MAP_WIDTH / 2 + config.COLLISION_MESH_RADIUS * 2, y: config.MAP_HEIGHT / 2 }
            },
            {
                id: 'dummy',
                location: { x: config.MAP_WIDTH / 2 + config.COLLISION_MESH_RADIUS * 2, y: config.MAP_HEIGHT / 2 - config.COLLISION_MESH_RADIUS * 2 }
            },
            {
                id: 'dummy',
                location: { x: config.MAP_WIDTH / 2 + config.COLLISION_MESH_RADIUS * 2, y: config.MAP_HEIGHT / 2 + config.COLLISION_MESH_RADIUS * 2 }
            },
            {
                id: 'dummy',
                location: { x: config.MAP_WIDTH / 2 + config.COLLISION_MESH_RADIUS * 5, y: config.MAP_HEIGHT / 2 + config.COLLISION_MESH_RADIUS * 4 }
            },
        ],
        startingCards: ['hurt', 'chain'],
        init: (underworld: Underworld) => {
            const spawnPortalOnAllDeathEventName = 'spawnPortalOnAllDeath';
            const enemies = underworld.units.filter(u => u.faction == Faction.ENEMY)
            function checkIfAllDied() {
                const allDestroyedAtOnce = enemies.every(u => u.alive == false);
                if (allDestroyedAtOnce) {
                    const portalPickup = Pickup.specialPickups['portal'];
                    Pickup.create(
                        1.5 * config.MAP_WIDTH / 4,
                        config.MAP_HEIGHT / 2,
                        portalPickup.name,
                        portalPickup.description,
                        false,
                        portalPickup.imagePath,
                        portalPickup.animationSpeed,
                        true,
                        portalPickup.effect,
                    );
                } else {
                    orderedFloatingText('Try again');
                    setTimeout(() => {
                        // restart
                        underworld.initHandcraftedLevel(tutorialLevels[2]);
                    }, 500)
                }

            }
            let checkIfAllDiedTimeout: NodeJS.Timeout;
            Events.onDeathSource[spawnPortalOnAllDeathEventName] = () => {
                if (checkIfAllDiedTimeout !== undefined) {
                    clearTimeout(checkIfAllDiedTimeout);
                }
                // TODO this should be more certain
                checkIfAllDiedTimeout = setTimeout(() => { checkIfAllDied() }, 500);
            }
            enemies.map(u => {
                u.onDeathEvents.push(spawnPortalOnAllDeathEventName);
            });

            // Restart if you die
            const restartIfYouDieEventName = 'restartIfYouDie';
            Events.onDeathSource[restartIfYouDieEventName] = () => {
                underworld.initHandcraftedLevel(tutorialLevels[2]);
            }
            if (window.player) {
                window.player.unit.onDeathEvents = [restartIfYouDieEventName];
            }
            // Queue up the next level
            underworld.nextHandCraftedLevel = tutorialLevels[3];

        }
    },
    [tutorialLevels[3]]: {
        allowHeavyUnits: false,
        playerSpawnLocations: [{ x: config.COLLISION_MESH_RADIUS, y: config.MAP_HEIGHT / 2 }],
        specialPickups: [],
        obstacles: [],
        doodads: [
            {
                text: 'Cast multiple spells together at the same time in a specific order\n to destroy the practice dummies all at once.',
                location: { x: 485, y: 100 },
                style: { align: 'center' },
            }
        ],
        units: [
            {
                id: 'dummy',
                location: { x: config.MAP_WIDTH / 2 - config.COLLISION_MESH_RADIUS * 4, y: config.MAP_HEIGHT / 2 }
            },
            {
                id: 'dummy',
                location: { x: config.MAP_WIDTH / 2 + config.COLLISION_MESH_RADIUS * 2, y: config.MAP_HEIGHT / 2 }
            },
            {
                id: 'dummy',
                location: { x: config.MAP_WIDTH / 2 + config.COLLISION_MESH_RADIUS * 4, y: config.MAP_HEIGHT / 2 - config.COLLISION_MESH_RADIUS * 2 }
            },
            {
                id: 'dummy',
                location: { x: config.MAP_WIDTH / 2 + config.COLLISION_MESH_RADIUS * 2, y: config.MAP_HEIGHT / 2 + config.COLLISION_MESH_RADIUS * 4 }
            },
            {
                id: 'dummy',
                location: { x: config.MAP_WIDTH / 2 + config.COLLISION_MESH_RADIUS * 9, y: config.MAP_HEIGHT / 2 }
            },
        ],
        startingCards: ['hurt', 'AOE', 'chain'],
        init: (underworld: Underworld) => {
            underworld.players.forEach(p => {
                p.unit.manaMax = 100;
                p.unit.mana = p.unit.manaMax;
            });
            const spawnPortalOnAllDeathEventName = 'spawnPortalOnAllDeath';
            const enemies = underworld.units.filter(u => u.faction == Faction.ENEMY)
            function checkIfAllDied() {
                const allDestroyedAtOnce = enemies.every(u => u.alive == false);
                if (allDestroyedAtOnce) {
                    const portalPickup = Pickup.specialPickups['portal'];
                    Pickup.create(
                        1.5 * config.MAP_WIDTH / 4,
                        config.MAP_HEIGHT / 2,
                        portalPickup.name,
                        portalPickup.description,
                        false,
                        portalPickup.imagePath,
                        portalPickup.animationSpeed,
                        true,
                        // Since this is the last level of the tutorial it takes you to the main menu
                        () => {
                            underworld.initLevel(0);
                        }
                    );
                } else {
                    orderedFloatingText('Try again');
                    setTimeout(() => {
                        // restart
                        underworld.initHandcraftedLevel(tutorialLevels[3]);
                    }, 500)
                }

            }
            let checkIfAllDiedTimeout: NodeJS.Timeout;
            Events.onDeathSource[spawnPortalOnAllDeathEventName] = () => {
                if (checkIfAllDiedTimeout !== undefined) {
                    clearTimeout(checkIfAllDiedTimeout);
                }
                // TODO this should be more certain
                checkIfAllDiedTimeout = setTimeout(() => { checkIfAllDied() }, 500);
            }
            enemies.map(u => {
                u.onDeathEvents.push(spawnPortalOnAllDeathEventName);
            });
            // Restart if you die
            const restartIfYouDieEventName = 'restartIfYouDie';
            Events.onDeathSource[restartIfYouDieEventName] = () => {
                underworld.initHandcraftedLevel(tutorialLevels[3]);
            }
            if (window.player) {
                window.player.unit.onDeathEvents = [restartIfYouDieEventName];
            }

        }
    }
}