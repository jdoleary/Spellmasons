export interface HasSpace {
    x: number;
    y: number;
    radius: number;
}
export function hasSpace(maybe: any): maybe is HasSpace {
    return maybe && typeof maybe.x == 'number' && typeof maybe.y == 'number' && typeof maybe.radius == 'number';
}
export interface HasLife {
    alive: boolean;
    health: number;
    healthMax: number;
}
export interface HasLife {
    alive: boolean;
    health: number;
    healthMax: number;
}
export function hasLife(maybe: any): maybe is HasLife {
    return maybe && typeof maybe.alive == 'boolean' && maybe.health == 'number' && maybe.healthMax == 'number';
}
export interface HasMana {
    mana: number;
    manaMax: number;
}
export interface HasStamina {
    stamina: number;
    staminaMax: number;
}