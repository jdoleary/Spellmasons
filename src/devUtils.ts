import type * as PIXI from 'pixi.js';
import { LineSegment } from './jmath/lineSegment';
import floatingText from './graphics/FloatingText';
import { Vec2 } from './jmath/Vec';
import Underworld from './Underworld';
import * as Unit from './entity/Unit';
import { UnitType } from './types/commonTypes';
import * as Cards from './cards';
import { syncInventory } from './graphics/ui/CardUI';
import { addCardToHand, IPlayer, lockStamina } from './entity/Player';
import { Overworld } from './Overworld';

// Development helpers
// Note: clicking on a unit will assign them to `selectedUnit` so they are available in the browser console
// Note: shift + left click to choose to spawn a unit from a context menu (window.adminMode must == true)
// Note: Use context menu to hide the HUD for recording, see function toggleHUD for more info


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
export function setupDevGlobalFunctions(overworld: Overworld) {
    globalThis.devKillAll = () => {
        if (!overworld.underworld) {
            console.error('Cannot "devKillAll Units", underworld is undefined');
            return;
        }
        for (let unit of overworld.underworld.units.filter(u => u.unitType !== UnitType.PLAYER_CONTROLLED)) {
            Unit.die(unit, overworld.underworld, false)
        }
    }
    globalThis.devRemoveAllEnemies = () => {
        if (!overworld.underworld) {
            console.error('Cannot "devRemoveAllEnemies Units", underworld is undefined');
            return;
        }
        for (let u of overworld.underworld.units) {
            if (u.faction !== globalThis.player?.unit.faction) {
                Unit.cleanup(u);
            }
        }
    }
    globalThis.superMe = (underworld: Underworld, player?: IPlayer) => {
        if (player) {
            globalThis.isSuperMe = true;
            player.unit.health = 10000;
            player.unit.healthMax = 10000;
            player.unit.mana = 10000;
            player.unit.manaPerTurn = 10000;
            player.unit.manaMax = 10000;
            // Give me all cards
            Object.keys(Cards.allCards).forEach(cardId => {
                const card = Cards.allCards[cardId];
                if (card) {
                    addCardToHand(card, player, underworld);
                } else {
                    console.log('card', card, 'not found');
                }
            });
            // Run farther! Jump higher!
            player.unit.staminaMax = 10000;
            player.unit.stamina = player.unit.staminaMax;
            player.unit.moveSpeed = 0.3;
            lockStamina(player.unit, underworld);
            // Now that player's health and mana has changed we must sync
            // unitsPrediction so that the player's prediction copy
            // has the same mana and health
            underworld.syncPredictionEntities();
            syncInventory(undefined, underworld);
        } else {
            console.error('Cannot superMe, player argument not specified');
        }
    }

}


const eventDebugLogs: { [label: string]: [number, number][] } = {};
// Helpful perf util to log how many times it is invoked with a given label, per second
export function measureInvokationsPerSecond(label: string) {
    let eventDebugLog = eventDebugLogs[label];
    if (!eventDebugLog) {
        eventDebugLog = [];
        eventDebugLogs[label] = eventDebugLog;
    }

    const now = Date.now();
    const key = now - now % 1000;
    let record = eventDebugLog.find(([k, value]) => k == key);
    if (!record) {
        record = [key, 0];
        eventDebugLog.unshift(record);
        // Log every time the second changes
        if (eventDebugLog.length > 1) {
            console.log('Invokations per second', label, eventDebugLog.pop());
        }
    }
    // Count the number of invokations / second
    record[1]++;

}