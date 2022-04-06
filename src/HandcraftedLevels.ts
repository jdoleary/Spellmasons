import type { Vec2 } from "./Vec";
import * as config from "./config";
import type Underworld from "./Underworld";
import Events from './Events';
import * as Pickup from './Pickup';
import { Faction } from "./commonTypes";

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
}
export const tutorialLevels = [
    'Tutorial',
    'Pickups and Spell Casting',
    'Spells Work Together',
    'Spells in Order',
]

export const levels: { [name: string]: HandcraftedLevel } = {
    [tutorialLevels[0]]: {
        playerSpawnLocations: [{ x: config.MAP_WIDTH / 4, y: config.MAP_HEIGHT / 2 }],
        portalSpawnLocation: { x: 3 * config.MAP_WIDTH / 4, y: config.MAP_HEIGHT / 2 },
        specialPickups: [],
        obstacles: [],
        doodads: [
            {
                text: 'Left click on the "walk" card in your inventory and click on the ground to move.\nPress "spacebar" to end your turn.\nEntering the portal will take you to the next level.',
                location: { x: config.MAP_WIDTH / 2, y: 100 },
                style: { align: 'center' },
            }
        ],
        units: [],
        startingCards: ['walk'],
        init: (underworld) => {
            underworld.nextHandCraftedLevel = tutorialLevels[1];
        }
    },
    [tutorialLevels[1]]: {
        playerSpawnLocations: [{ x: config.COLLISION_MESH_RADIUS, y: config.MAP_HEIGHT / 2 }],
        // portalSpawnLocation: { x: 3 * config.MAP_WIDTH / 4, y: config.MAP_HEIGHT / 2 },
        specialPickups: [
            {
                id: 'damage-card-pickup',
                location: { x: config.MAP_WIDTH / 4, y: config.MAP_HEIGHT / 2 },
            }
        ],
        obstacles: [],
        doodads: [
            {
                text: 'Move to the spellbook \nto pick it up and aquire a new spell\n↓',
                location: { x: config.MAP_WIDTH / 4, y: 197 },
                style: { align: 'center' },
            },
            {
                text: '↑\nDestroy the practice dummy with your new spell.',
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
        startingCards: ['walk'],
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

        }
    }
}