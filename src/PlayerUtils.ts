import * as math from './jmath/math';
import * as Player from './entity/Player';
import * as config from './config';
import { Vec2 } from './jmath/Vec';
import Underworld from './Underworld';

function isAllowedToCastOutOfRange(cardIds: string[]): boolean {
    // Exception, if all of the cards cast are arrow cards, let them cast out of range
    return cardIds.every(id => id.toLowerCase().includes('arrow'));
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
        const doodadAtCastLocation = underworld.getDoodadAt(target, false);
        if (doodadAtCastLocation && math.distance(caster.unit, doodadAtCastLocation) <= caster.unit.attackRange + config.COLLISION_MESH_RADIUS) {
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