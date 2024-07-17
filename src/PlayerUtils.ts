import * as math from './jmath/math';
import throttle from 'lodash.throttle';
import * as Player from './entity/Player';
import * as Cards from './cards';
import * as config from './config';
import { round, Vec2 } from './jmath/Vec';
import Underworld from './Underworld';
import objectHash from 'object-hash';
import { MESSAGE_TYPES } from './types/MessageTypes';
import { targetArrowCardId } from './cards/target_arrow';
import { targetRicochetArrowCardId } from './cards/target_ricochet_arrow';

function isAllowedToCastOutOfRange(cardIds: string[]): boolean {
    // Exception, if all of the cards cast are arrow cards, let them cast out of range
    return (cardIds[0] && [targetArrowCardId, targetRicochetArrowCardId].includes(cardIds[0])) || cardIds.every(id => Cards.allCards[id]?.ignoreRange);
}
export function isOutOfRange(caster: Player.IPlayer, target: Vec2, underworld: Underworld, cardIds?: string[]): boolean {
    if (cardIds && cardIds.length && isAllowedToCastOutOfRange(cardIds)) {
        return false;
    }
    const castDistance = math.distance(caster.unit, target);
    const inRange = castDistance <= caster.unit.attackRange;
    if (inRange) {
        return false;
    } else {
        // Check to see if targeting a unit, pickup, or doodad that has a piece of itself in range
        const unitAtCastLocation = underworld.getUnitAt(target, false);
        if (unitAtCastLocation && math.distance(caster.unit, unitAtCastLocation) <= caster.unit.attackRange + config.COLLISION_MESH_RADIUS) {
            return false;
        }
        const pickupAtCastLocation = underworld.getPickupAt(target, false);
        if (pickupAtCastLocation && math.distance(caster.unit, pickupAtCastLocation) <= caster.unit.attackRange + config.COLLISION_MESH_RADIUS) {
            return false;
        }
        // Finally, the target is out of range
        return true;
    }
}

export function getEndOfRange(caster: Player.IPlayer, target: Vec2): Vec2 {
    return math.getCoordsAtDistanceTowardsTarget(caster.unit, target, caster.unit.attackRange);
}

export function setPlayerNameUI(player: Player.IPlayer) {
    const { name } = player;
    if (name !== undefined) {
        player.name = name;
        player.unit.name = name;
        if (globalThis.pixi && player.unit.image) {
            // @ts-ignore jid is a custom identifier to id the text element used for the player name
            const nameText = player.unit.image.sprite.children.find(child => child.jid == config.NAME_TEXT_ID) as PIXI.Text || new globalThis.pixi.Text();
            // @ts-ignore jid is a custom identifier to id the text element used for the player name
            nameText.jid = config.NAME_TEXT_ID;
            player.unit.image.sprite.addChild(nameText);
            nameText.text = player.name;
            nameText.y = -config.COLLISION_MESH_RADIUS - config.NAME_TEXT_Y_OFFSET;
            nameText.style = { fill: 'white', fontSize: config.NAME_TEXT_DEFAULT_SIZE, fontFamily: 'Forum', ...config.PIXI_TEXT_DROP_SHADOW };
            nameText.anchor.x = 0.5;
            nameText.anchor.y = 0.5;
        }
    }

}
export const sendPlayerThinkingThrottled = throttle((thoughts: { target?: Vec2, cardIds: string[] }, underworld: Underworld) => {
    // Only send your thoughts on your turn
    if (underworld.isMyTurn()) {
        let { target, cardIds } = thoughts;
        if (globalThis.currentHoverElement?.tagName !== 'CANVAS') {
            // Clear thoughts if player is not hovering over gamespace
            // so it doesn't send player thought when they are looking at inventory
            // or toolbar
            cardIds = [];
        }
        // Since it takes a hash, best to round target
        // to whole numbers so floating point changes
        // don't create a different hash
        if (target) {
            target = round(target);
        }
        const hash = objectHash({ target, cardIds });
        if (hash !== underworld.lastThoughtsHash) {
            if (underworld.pie) {
                let ellipsis = false;
                if (cardIds.length >= 7) {
                    // Slice to one less so the epsilon is added on the 7th
                    cardIds = cardIds.slice(0, 6);
                    ellipsis = true;
                }
                const willClearThoughts = cardIds.length == 0 && underworld.lastThoughtsHash !== '';
                if (cardIds.length || willClearThoughts) {
                    underworld.pie.sendData({
                        type: MESSAGE_TYPES.PLAYER_THINKING,
                        target,
                        cardIds,
                        ellipsis
                    });
                    underworld.lastThoughtsHash = hash;
                    if (willClearThoughts) {
                        // If thoughts were just cleared, also clear the hash so that it doesn't send
                        // another message to clear thoughts
                        underworld.lastThoughtsHash = '';
                    }
                }
            }
        }
    }

}, 500, { trailing: true });