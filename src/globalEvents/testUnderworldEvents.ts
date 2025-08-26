import { registerEvents } from "../cards";
import { IPickup } from "../entity/Pickup";
import { IUnit } from "../entity/Unit";
import { Vec2 } from "../jmath/Vec";
import { Faction } from "../types/commonTypes";
import Underworld from "../Underworld";


export const testUnderworldEventsId = 'Test';
export default function registerTestUnderworldEvents() {
    registerEvents(testUnderworldEventsId, {
        onDealDamage: (damageDealer: IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: IUnit) => { !prediction && console.log('Global Test Event:onDealDamage'); return amount; },
        onTakeDamage: (unit: IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: IUnit) => { !prediction && console.log('Global Test Event:onTakeDamage'); return amount; },
        onLiquid: (unit: IUnit, currentlyInLiquid: boolean, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: IUnit) => { !prediction && console.log('Global Test Event:onLiquid'); return amount; },
        onKill: async (killer: IUnit, killedUnit: IUnit, underworld: Underworld, prediction: boolean) => { !prediction && console.log('Global Test Event:onKill') },
        onDeath: async (unit: IUnit, underworld: Underworld, prediction: boolean, sourceUnit?: IUnit) => { !prediction && console.log('Global Test Event:onDeath') },
        onTeleport: (unit: IUnit, newLocation: Vec2, underworld: Underworld, prediction: boolean) => { !prediction && console.log('Global Test Event:onTeleport') },
        onSpawn: (unit: IUnit, underworld: Underworld, prediction: boolean) => { !prediction && console.log('Global Test Event:onSpawn') },
        onPickup: async (unit: IUnit, pickup: IPickup, underworld: Underworld, prediction: boolean) => { !prediction && console.log('Global Test Event:onPickup') },
        // TODO: These trigger multiple times for some reason, investigate
        // onFullTurnCycle: async (unit: IUnit, underworld: Underworld, prediction: boolean, faction: Faction) => { !prediction && console.log('Global Test Event:onFullTurnCycle', faction) },
        // onTurnStart: async (unit: IUnit, underworld: Underworld, prediction: boolean, faction: Faction) => { !prediction && console.log('Global Test Event:onTurnStart', faction) },
        // onTurnEnd: async (unit: IUnit, underworld: Underworld, prediction: boolean) => { !prediction && console.log('Global Test Event:onTurnEnd') },
    });
}