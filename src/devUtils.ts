import type * as PIXI from 'pixi.js';
import { LineSegment } from './jmath/lineSegment';
import floatingText from './graphics/FloatingText';
import { Vec2, jitter } from './jmath/Vec';
import Underworld from './Underworld';
import * as Unit from './entity/Unit';
import * as Units from './entity/units';
import { Faction, UnitType } from './types/commonTypes';
import * as Cards from './cards';
import { syncInventory } from './graphics/ui/CardUI';
import { addCardToHand } from './entity/Player';
import { moveWithCollisions } from './jmath/moveWithCollision';

// Development helpers
// Note: clicking on a unit will assign them to `selectedUnit` so they are available in the browser console
// Note: shift + left click to choose to spawn a unit from a context menu


export default function devUtils(graphics: PIXI.Graphics) {

    const _debugDrawLineSegments = (lines: LineSegment[], lineColor = 0x0000ff) => {
        for (let line of lines) {
            graphics.lineStyle(3, lineColor, 0.5);
            graphics.moveTo(line.p1.x, line.p1.y);
            graphics.lineTo(line.p2.x, line.p2.y);
            graphics.lineStyle(3, 0x00ffff, 0.5);
            graphics.drawCircle(line.p1.x, line.p1.y, 2);
            graphics.drawCircle(line.p2.x, line.p2.y, 2);

        }
    }
    const debugDrawLineSegments = (lines: LineSegment[]) => {
        graphics.clear();
        _debugDrawLineSegments(lines);
    }
    const debugDrawVec2s = (points: Vec2[]) => {
        const timeoutAdd = 500;//ms
        let timeout = 0;
        for (let point of points) {
            timeout += timeoutAdd;
            setTimeout(() => {
                floatingText({
                    coords: point,
                    text: '🎈',
                });

            }, timeout)

        }

    }
    return { debugDrawLineSegments, debugDrawVec2s }
}
export function setupDevGlobalFunctions(underworld: Underworld) {
    if (window) {
        // @ts-ignore: window.devUnderworld is NOT typed in globalThis intentionally
        // so that it will not be used elsewhere, but it is assigned here
        // so that it can be accessed by a developer in client
        window.devUnderworld = underworld;
    }
    // TODO remove dev helper function for production release
    globalThis.giveMeCard = (cardId: string) => {
        const card = Cards.allCards[cardId];
        if (card) {
            addCardToHand(card, globalThis.player, underworld);
        } else {
            console.log('card', card, 'not found');
        }
    };
    globalThis.devKillAll = () => {
        underworld.units.filter(u => u.unitType !== UnitType.PLAYER_CONTROLLED).forEach(u => Unit.die(u, underworld, false));
    }
    // For development, spawns a unit near the player
    globalThis.devSpawnUnit = (unitId: string, faction: Faction = Faction.ENEMY, coords?: Vec2) => {
        if (globalThis.player) {
            coords = coords || underworld.findValidSpawn(globalThis.player.unit, 5)
            const sourceUnit = Units.allUnits[unitId];
            if (coords && sourceUnit) {
                const newUnit = Unit.create(
                    unitId,
                    // Start the unit at the summoners location
                    coords.x,
                    coords.y,
                    // A unit always summons units in their own faction
                    faction,
                    sourceUnit.info.image,
                    UnitType.AI,
                    sourceUnit.info.subtype,
                    1,
                    sourceUnit.unitProps,
                    underworld
                );
                // Prevent them from overlapping
                moveWithCollisions(newUnit, jitter(newUnit, 1, underworld.random), underworld.units, underworld);
                return newUnit;
            }

        }
        return undefined;
    }
    globalThis.devSpawnAllUnits = () => {
        for (let id of Object.keys(Units.allUnits)) {
            globalThis.devSpawnUnit?.(id, Faction.ENEMY);
        }
    }
    globalThis.devRemoveAllEnemies = () => {
        for (let u of underworld.units) {
            if (u.faction !== globalThis.player?.unit.faction) {
                Unit.cleanup(u);
            }
        }
    }
    globalThis.superMe = () => {
        if (globalThis.player) {

            globalThis.player.unit.health = 10000;
            globalThis.player.unit.healthMax = 10000;
            globalThis.player.unit.mana = 10000;
            globalThis.player.unit.manaMax = 10000;
            // Give me all cards
            if (globalThis.giveMeCard) {
                Object.keys(Cards.allCards).forEach(globalThis.giveMeCard);
            }
            // Run farther! Jump higher!
            globalThis.player.unit.staminaMax = 10000;
            globalThis.player.unit.stamina = globalThis.player.unit.staminaMax;
            globalThis.player.unit.moveSpeed = 0.3;
            // Now that player's health and mana has changed we must sync
            // predictionUnits so that the player's prediction copy
            // has the same mana and health
            underworld.syncPredictionEntities();
            syncInventory(undefined, underworld);
        }
    }

}