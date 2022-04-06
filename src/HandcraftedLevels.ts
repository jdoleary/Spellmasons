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
    doodads: SpawnInfo[];
    units: SpawnInfo[];
    startingCards: string[];
    init?: (underworld: Underworld) => void;
}

export const levels: { [name: string]: HandcraftedLevel } = {
    'Tutorial': {
        playerSpawnLocations: [{ x: config.MAP_WIDTH / 4, y: config.MAP_HEIGHT / 2 }],
        portalSpawnLocation: { x: 3 * config.MAP_WIDTH / 4, y: config.MAP_HEIGHT / 2 },
        specialPickups: [],
        obstacles: [],
        doodads: [],
        units: [],
        startingCards: ['walk'],
    },
    'Pickups and Casting Spells': {
        playerSpawnLocations: [{ x: config.COLLISION_MESH_RADIUS, y: config.MAP_HEIGHT / 2 }],
        // portalSpawnLocation: { x: 3 * config.MAP_WIDTH / 4, y: config.MAP_HEIGHT / 2 },
        specialPickups: [
            {
                id: 'damage-card-pickup',
                location: { x: config.MAP_WIDTH / 4, y: config.MAP_HEIGHT / 2 },
            }
        ],
        obstacles: [],
        doodads: [],
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