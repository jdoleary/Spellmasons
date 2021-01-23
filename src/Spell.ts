import type Unit from './Unit'
export interface Spell {
    mana_cost:number;
    // damage can be negative for healing
    damage:number;
    cast: (target:Unit) => void;
}
export default {};